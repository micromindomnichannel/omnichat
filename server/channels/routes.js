// Channel connection API. Every route requires a session; workspace access is
// resolved from membership — never trusted from the client.
import express from 'express';
import crypto from 'crypto';
import { encryptSecret } from '../credentials/crypto.js';
import { CHANNELS, provisionChannelFlow } from '../micromind/provisionChannel.js';
import { assertCanConnectChannel } from '../billing/plans.js';
import { requireAuth, requireWorkspace, workspaceFor } from '../auth/middleware.js';

const FULL = ['messenger', 'instagram']; // verified template + auto-provision
const BYOF = ['whatsapp', 'telegram', 'gmail']; // wiring done, template pending -> micromindFlowId required
const NOT_STARTED = ['tiktok'];
const PROVIDER = {
  messenger: 'meta_messenger',
  instagram: 'meta_instagram',
  whatsapp: 'meta_whatsapp',
  telegram: 'telegram_bot',
  gmail: 'google_oauth',
};

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function safeAccount(row) {
  if (!row) return row;
  const { ...safe } = row;
  return {
    id: safe.id,
    workspace_id: safe.workspace_id,
    channel: safe.channel,
    external_account_id: safe.external_account_id,
    display_name: safe.display_name,
    username: safe.username,
    micromind_flow_id: safe.micromind_flow_id,
    status: safe.status,
    metadata: { verify_token: safe.metadata?.verify_token, webhook_name: safe.metadata?.webhook_name, phone_number_id: safe.metadata?.phone_number_id },
    created_at: safe.created_at,
    updated_at: safe.updated_at,
  };
}

async function audit(pool, workspaceId, action, resource, meta = {}, actor = 'system') {
  try {
    await pool.query(
      'INSERT INTO audit_logs (id, workspace_id, actor, action, resource, meta) VALUES ($1,$2,$3,$4,$5,$6)',
      [rid('aud'), workspaceId, actor, action, resource, JSON.stringify(meta)]
    );
  } catch { /* audit must never break the request */ }
}

export function channelsRouter(pool) {
  const r = express.Router();
  // Path-scoped: all channel routes live under /api/v1 (bare r.use would
  // intercept every request when the router is mounted without a prefix).
  r.use('/api/v1', requireAuth);

  // List connected channels (safe fields only — never secrets)
  r.get('/api/v1/workspaces/:workspaceId/channels', requireWorkspace, async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM channel_accounts WHERE workspace_id = $1 ORDER BY created_at ASC',
        [req.workspaceId]
      );
      res.json(rows.map(safeAccount));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Connect: manual token (MVP) or OAuth handoff. Body:
  // { displayName, username, externalAccountId, pageAccessToken|botToken|secret,
  //   phoneNumberId (whatsapp), verifyToken?, micromindFlowId?, autoProvision? }
  // whatsapp|telegram|gmail are BYOF until their template lands: micromindFlowId required.
  r.post('/api/v1/workspaces/:workspaceId/channels/:channel/connect', requireWorkspace, async (req, res) => {
    const { channel } = req.params;
    const workspaceId = req.workspaceId;
    if (NOT_STARTED.includes(channel)) {
      return res.status(400).json({ code: 'channel_pending', error: `${channel} slice not started yet` });
    }
    if (!FULL.includes(channel) && !BYOF.includes(channel)) {
      return res.status(400).json({ error: `Unknown channel: ${channel}` });
    }

    const { displayName, username, externalAccountId, pageAccessToken, botToken, secret,
      phoneNumberId, verifyToken, micromindFlowId, autoProvision = true } = req.body || {};
    const credentialSecret = pageAccessToken || botToken || secret;
    if (BYOF.includes(channel) && !micromindFlowId) {
      return res.status(400).json({ code: 'template_pending', error: `No verified ${channel} template yet — supply micromindFlowId (bring-your-own-flow)` });
    }
    if (!credentialSecret && !micromindFlowId) {
      return res.status(400).json({ error: 'pageAccessToken/botToken/secret or micromindFlowId required' });
    }
    try {
      await assertCanConnectChannel(pool, workspaceId, channel);
    } catch (e) {
      return res.status(e.status || 402).json({ code: e.code || 'upgrade_required', error: e.message });
    }
    const finalVerify = verifyToken || (CHANNELS[channel].defaultVerifyToken
      ? `${CHANNELS[channel].defaultVerifyToken}_${crypto.randomBytes(3).toString('hex')}`
      : null);
    const extraMeta = {};
    if (channel === 'whatsapp' && phoneNumberId) extraMeta.phone_number_id = phoneNumberId;
    let webhookSecret = null;
    if (channel === 'telegram') {
      webhookSecret = crypto.randomBytes(16).toString('hex');
      extraMeta.webhook_secret = webhookSecret;
    }

    try {
      let credentialId = null;
      if (credentialSecret) {
        credentialId = rid('cred');
        await pool.query(
          'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata) VALUES ($1,$2,$3,$4,$5)',
          [credentialId, workspaceId, PROVIDER[channel], encryptSecret(credentialSecret),
           JSON.stringify({ channel, ...(phoneNumberId ? { phone_number_id: phoneNumberId } : {}) })]
        );
      }
      const accountId = rid('ch');
      await pool.query(
        `INSERT INTO channel_accounts (id, workspace_id, channel, external_account_id, display_name, username, credential_id, micromind_flow_id, status, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connecting',$9)
         ON CONFLICT (workspace_id, channel, external_account_id) DO UPDATE SET
           display_name = EXCLUDED.display_name, username = EXCLUDED.username,
           credential_id = COALESCE(EXCLUDED.credential_id, channel_accounts.credential_id),
           status = 'connecting', updated_at = CURRENT_TIMESTAMP`,
        [accountId, workspaceId, channel, externalAccountId || username || channel, displayName || username || channel,
         username || null, credentialId, micromindFlowId || null,
         JSON.stringify({ verify_token: finalVerify, webhook_name: channel, ...extraMeta })]
      );
      const accId = (
        await pool.query(
          'SELECT id FROM channel_accounts WHERE workspace_id=$1 AND channel=$2 AND external_account_id=$3',
          [workspaceId, channel, externalAccountId || username || channel]
        )
      ).rows[0].id;

      // Provision dedicated MicroMind flow (needs MICROMIND_API_KEY; otherwise keep supplied id)
      let flowId = micromindFlowId || null;
      let status = micromindFlowId ? 'active' : 'connecting';
      if (autoProvision && !micromindFlowId) {
        try {
          const ws = (await pool.query('SELECT * FROM workspace_settings WHERE workspace_id=$1', [workspaceId])).rows[0] || {};
          const created = await provisionChannelFlow(channel, {
            name: `ORBIT ${channel} - ${ws.business_name || workspaceId}`,
            verifyToken: finalVerify,
            businessName: ws.business_name,
            aiTone: ws.ai_tone,
            language: ws.language,
          });
          flowId = created.id;
          await pool.query('INSERT INTO micromind_flows (id, workspace_id, channel_account_id, external_flow_id, template, status) VALUES ($1,$2,$3,$4,$5,\'active\')',
            [rid('mmf'), workspaceId, accId, flowId, channel]);
          status = 'active';
        } catch (e) {
          status = 'error';
          await pool.query('UPDATE channel_accounts SET status=$1, metadata = metadata || $2 WHERE id=$3',
            [status, JSON.stringify({ provision_error: String(e.message).slice(0, 300) }), accId]);
        }
      } else if (flowId) {
        await pool.query('INSERT INTO micromind_flows (id, workspace_id, channel_account_id, external_flow_id, template, status) VALUES ($1,$2,$3,$4,$5,\'active\') ON CONFLICT DO NOTHING',
          [rid('mmf'), workspaceId, accId, flowId, channel]);
      }
      if (status === 'active') {
        await pool.query('UPDATE channel_accounts SET status=$1, micromind_flow_id=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3',
          [status, flowId, accId]);
      }
      await audit(pool, workspaceId, 'channel.connect', `${channel}:${accId}`, { status }, req.user.email);
      const { rows } = await pool.query('SELECT * FROM channel_accounts WHERE id=$1', [accId]);
      res.json({
        channel, status, account: safeAccount(rows[0]),
        // Returned ONCE: configure as the Telegram setWebhook secret_token. Never stored elsewhere.
        ...(webhookSecret ? { webhookSecret, webhookUrlHint: 'POST /webhooks/telegram' } : {}),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // OAuth start (Meta app handoff): stores state, returns it for the redirect builder.
  r.post('/api/v1/workspaces/:workspaceId/channels/:channel/oauth/start', requireWorkspace, async (req, res) => {
    const { channel } = req.params;
    if (!FULL.includes(channel) && !BYOF.includes(channel)) return res.status(400).json({ error: `Unknown channel: ${channel}` });
    const state = crypto.randomBytes(24).toString('hex');
    await pool.query(
      "INSERT INTO oauth_states (id, workspace_id, provider, state, expires_at) VALUES ($1,$2,$3,$4, CURRENT_TIMESTAMP + INTERVAL '15 minutes')",
      [rid('oas'), req.workspaceId, channel, state]
    );
    res.json({ provider: channel, state, note: 'Complete Meta OAuth in the developer portal, then finish via /connect with the token (MVP) or the callback when the Meta app is configured.' });
  });

  // OAuth callback: validates state (code exchange lands here once the Meta app is configured).
  r.get('/api/v1/channels/:channel/oauth/callback', async (req, res) => {
    const { state, code } = req.query;
    if (!state) return res.status(400).json({ error: 'missing state' });
    const { rows } = await pool.query("SELECT * FROM oauth_states WHERE state=$1 AND expires_at > CURRENT_TIMESTAMP", [state]);
    if (!rows.length) return res.status(400).json({ error: 'invalid or expired state' });
    await pool.query('DELETE FROM oauth_states WHERE state=$1', [state]);
    if (!code) return res.json({ channel: req.params.channel, status: 'state_verified', next: 'supply code/page token via connect' });
    res.json({ channel: req.params.channel, status: 'callback_received', next: 'code exchange not configured yet — finish via connect' });
  });

  r.post('/api/v1/channels/:id/disconnect', async (req, res) => {
    try {
      const row = (await pool.query('SELECT workspace_id FROM channel_accounts WHERE id=$1', [req.params.id])).rows[0];
      const workspaceId = workspaceFor(req, row?.workspace_id);
      if (!workspaceId) return res.status(404).json({ error: 'channel not found' });
      const { rows } = await pool.query(
        "UPDATE channel_accounts SET status='disconnected', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND workspace_id=$2 RETURNING *",
        [req.params.id, workspaceId]
      );
      if (!rows.length) return res.status(404).json({ error: 'channel not found' });
      await audit(pool, workspaceId, 'channel.disconnect', rows[0].channel + ':' + rows[0].id, {}, req.user.email);
      res.json({ channel: rows[0].channel, status: 'disconnected' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/v1/channels/:id/reconnect', async (req, res) => {
    try {
      const row = (await pool.query('SELECT workspace_id FROM channel_accounts WHERE id=$1', [req.params.id])).rows[0];
      const workspaceId = workspaceFor(req, row?.workspace_id);
      if (!workspaceId) return res.status(404).json({ error: 'channel not found' });
      const { rows } = await pool.query(
        "UPDATE channel_accounts SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND workspace_id=$2 AND credential_id IS NOT NULL RETURNING *",
        [req.params.id, workspaceId]
      );
      if (!rows.length) return res.status(404).json({ error: 'channel not found or missing credential — reconnect with a fresh token' });
      await audit(pool, workspaceId, 'channel.reconnect', rows[0].channel + ':' + rows[0].id, {}, req.user.email);
      res.json({ channel: rows[0].channel, status: 'active' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
