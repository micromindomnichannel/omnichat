// Channel connection API. Every route requires a session; workspace access is
// resolved from membership — never trusted from the client.
import express from 'express';
import crypto from 'crypto';
import { encryptSecret, decryptSecret } from '../credentials/crypto.js';
import { syncMetaConversations } from '../meta/conversations.js';
import { CHANNELS, provisionTenantChannelFlow, templateVersionForAsync, orbitBackendPublicUrl } from '../micromind/provisionChannel.js';
import { testFlowLink, recordLinkTest } from '../micromind/linktest.js';
import { assertCanConnectChannel } from '../billing/plans.js';
import { requireAuth, requireWorkspace, workspaceFor } from '../auth/middleware.js';
import { graphGet, publishPagePost, publishInstagramMedia } from '../meta/graph.js';
import { discoverDiscordBot, getDiscordMe } from '../integrations/discord.js';
import { startDiscordAccount, stopDiscordAccount, isDiscordListening } from '../integrations/discordGateway.js';
import { setTelegramWebhook, deleteTelegramWebhook, getTelegramWebhook, getTelegramMe } from '../integrations/telegram.js';
import { buildMetaAuthUrl, discoverMetaAssets, exchangeMetaCode, metaConfigured, metaRedirectUri, subscribePage } from '../meta/oauth.js';

const FULL = ['messenger', 'instagram', 'telegram', 'discord']; // verified template + auto-provision
const BYOF = ['whatsapp', 'gmail']; // wiring done, template pending -> micromindFlowId required
const PROVIDER = {
  messenger: 'meta_messenger',
  instagram: 'meta_instagram',
  whatsapp: 'meta_whatsapp',
  telegram: 'telegram_bot',
  discord: 'discord_bot',
  gmail: 'google_oauth',
};

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function oauthReturnTarget(value) {
  const fallback = process.env.ORBIT_FRONTEND_URL || 'https://orbit-xi-one-60.vercel.app';
  try {
    const url = new URL(String(value || fallback));
    const allowed = new URL(fallback);
    return url.origin === allowed.origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function oauthCallbackPage(res, status, payload, returnTo) {
  const target = new URL(oauthReturnTarget(returnTo));
  target.searchParams.set('meta_oauth', status >= 200 && status < 300 ? 'connected' : 'error');
  const title = status >= 200 && status < 300 ? 'Meta connected' : 'Meta connection needs attention';
  const syncSummary = Array.isArray(payload?.linked)
    ? payload.linked.map((item) => {
      const sync = item.historySync || {};
      const counts = sync.status === 'synced' ? ` (${sync.conversations || 0} conversations, ${sync.messages || 0} messages)` : '';
      return `${item.channel}: ${sync.status || 'not reported'}${counts}${sync.error ? ' — see Orbit diagnostics' : ''}`;
    }).join(' | ')
    : '';
  const message = status >= 200 && status < 300
    ? `Your Messenger and Instagram accounts were connected successfully.${syncSummary ? ` Historical sync: ${syncSummary}.` : ''}`
    : String(payload?.error || 'Meta connection failed');
  const safe = (text) => String(text).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  return res.status(status).type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="3;url=${safe(target.toString())}"><title>${safe(title)}</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;color:#172033}main{max-width:560px;padding:32px;text-align:center;border:1px solid #eee;border-radius:16px}p{color:#667085}</style></head><body><main><h1>${safe(title)}</h1><p>${safe(message)}</p><p>You will be redirected to Orbit in <strong>3 seconds</strong>.</p><a href="${safe(target.toString())}">Return to Orbit now</a></main><script>setTimeout(()=>location.href=${JSON.stringify(target.toString())},3000)</script></body></html>`);
}

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
    metadata: {
      verify_token: safe.metadata?.verify_token,
      webhook_name: safe.metadata?.webhook_name,
      phone_number_id: safe.metadata?.phone_number_id,
      history_sync: safe.metadata?.history_sync ? {
        status: safe.metadata.history_sync.status,
        conversations: safe.metadata.history_sync.conversations || 0,
        messages: safe.metadata.history_sync.messages || 0,
        error: safe.metadata.history_sync.error ? String(safe.metadata.history_sync.error).replace(/EA[A-Za-z0-9]+/g, '[redacted-token]') : undefined,
      } : undefined,
    },
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

  // List connected channels (safe fields only — never secrets).
  // Includes tenancy state (MicroMind folder + prediction key) per account.
  r.get('/api/v1/workspaces/:workspaceId/channels', requireWorkspace, async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM channel_accounts WHERE workspace_id = $1 ORDER BY created_at ASC',
        [req.workspaceId]
      );
      const ws = (await pool.query(
        'SELECT micromind_folder_id, micromind_folder_status FROM workspaces WHERE id=$1',
        [req.workspaceId])).rows[0] || {};
      const keyed = (await pool.query(
        `SELECT channel_account_id FROM micromind_flows
         WHERE workspace_id=$1 AND prediction_key_credential_id IS NOT NULL`,
        [req.workspaceId]).catch(() => ({ rows: [] }))).rows.map((x) => x.channel_account_id);
      const tested = (await pool.query(
        `SELECT DISTINCT ON (channel_account_id) channel_account_id, last_test_status, last_test_at
         FROM micromind_flows WHERE workspace_id=$1 ORDER BY channel_account_id, updated_at DESC`,
        [req.workspaceId]).catch(() => ({ rows: [] }))).rows;
      const testByAccount = Object.fromEntries(tested.map((t) => [t.channel_account_id, t]));
      res.json(rows.map((a) => ({
        ...safeAccount(a),
        tenancy: {
          folder: ws.micromind_folder_id ? 'ready' : 'pending',
          folderId: ws.micromind_folder_id || null,
          keyProvisioned: keyed.includes(a.id),
          lastTest: testByAccount[a.id]?.last_test_status || null,
          lastTestAt: testByAccount[a.id]?.last_test_at || null,
        },
      })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Instagram-only diagnostics: no tokens are returned. This separates Meta
  // access/delivery failures from Orbit persistence and Inbox failures.
  r.get('/api/v1/workspaces/:workspaceId/channels/instagram/diagnostics', requireWorkspace, async (req, res) => {
    try {
      const account = (await pool.query(
        "SELECT * FROM channel_accounts WHERE workspace_id=$1 AND channel='instagram' ORDER BY updated_at DESC LIMIT 1",
        [req.workspaceId]
      )).rows[0];
      if (!account) return res.status(404).json({ error: 'instagram account not connected' });
      const credential = account.credential_id
        ? (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [account.credential_id])).rows[0]
        : null;
      const token = credential ? decryptSecret(credential.encrypted_secret) : null;
      const pageId = account.metadata?.page_id || null;
      const report = {
        account: { id: account.external_account_id, status: account.status, pageId, flowId: account.micromind_flow_id },
        historySync: account.metadata?.history_sync || null,
        webhookEvents: (await pool.query("SELECT status, COUNT(*)::int AS count FROM webhook_events WHERE provider='instagram' GROUP BY status ORDER BY status")).rows,
        conversations: (await pool.query("SELECT COUNT(*)::int AS count FROM conversations WHERE workspace_id=$1 AND channel='instagram'", [req.workspaceId])).rows[0]?.count || 0,
        graph: { attempted: Boolean(token && pageId) },
      };
      if (token && pageId) {
        try {
          const out = await graphGet(token, `/${pageId}/conversations?platform=instagram&limit=5`);
          report.graph.ok = true;
          report.graph.returnedConversations = Array.isArray(out?.data) ? out.data.length : 0;
        } catch (err) {
          report.graph.ok = false;
          report.graph.error = String(err.message).slice(0, 300);
        }
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Telegram diagnostics: webhook registration (ORBIT URL? pending? errors),
  // intake history, and inbox persistence. No tokens are returned.
  r.get('/api/v1/workspaces/:workspaceId/channels/telegram/diagnostics', requireWorkspace, async (req, res) => {
    try {
      const account = (await pool.query(
        "SELECT * FROM channel_accounts WHERE workspace_id=$1 AND channel='telegram' ORDER BY updated_at DESC LIMIT 1",
        [req.workspaceId]
      )).rows[0];
      if (!account) return res.status(404).json({ error: 'telegram account not connected' });
      const credential = account.credential_id
        ? (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [account.credential_id])).rows[0]
        : null;
      const token = credential ? decryptSecret(credential.encrypted_secret) : null;
      const report = {
        account: { id: account.external_account_id, status: account.status, flowId: account.micromind_flow_id },
        registered: account.metadata?.webhook_registration || null,
        webhookEvents: (await pool.query("SELECT status, COUNT(*)::int AS count FROM webhook_events WHERE provider='telegram' GROUP BY status ORDER BY status")).rows,
        conversations: (await pool.query("SELECT COUNT(*)::int AS count FROM conversations WHERE workspace_id=$1 AND channel='telegram'", [req.workspaceId])).rows[0]?.count || 0,
        webhook: { attempted: Boolean(token) },
      };
      if (token) {
        try {
          const live = await getTelegramWebhook({ botToken: token });
          report.webhook = { ...report.webhook, ok: true, ...live, pointsAtOrbit: live.url.includes('/webhooks/telegram') };
        } catch (err) {
          report.webhook = { ...report.webhook, ok: false, error: String(err.message).slice(0, 200) };
        }
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Discord diagnostics: gateway listener state, bot identity, intake
  // history, and inbox persistence. No tokens are returned.
  r.get('/api/v1/workspaces/:workspaceId/channels/discord/diagnostics', requireWorkspace, async (req, res) => {
    try {
      const account = (await pool.query(
        "SELECT * FROM channel_accounts WHERE workspace_id=$1 AND channel='discord' ORDER BY updated_at DESC LIMIT 1",
        [req.workspaceId]
      )).rows[0];
      if (!account) return res.status(404).json({ error: 'discord account not connected' });
      const credential = account.credential_id
        ? (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [account.credential_id])).rows[0]
        : null;
      const token = credential ? decryptSecret(credential.encrypted_secret) : null;
      const report = {
        account: { id: account.external_account_id, status: account.status, flowId: account.micromind_flow_id },
        listener: { running: isDiscordListening(account.id) },
        webhookEvents: (await pool.query("SELECT status, COUNT(*)::int AS count FROM webhook_events WHERE provider='discord' GROUP BY status ORDER BY status")).rows,
        conversations: (await pool.query("SELECT COUNT(*)::int AS count FROM conversations WHERE workspace_id=$1 AND channel='discord'", [req.workspaceId])).rows[0]?.count || 0,
        bot: { attempted: Boolean(token) },
      };
      if (token) {
        try {
          const me = await discoverDiscordBot(token);
          report.bot = { ...report.bot, ok: Boolean(me), username: me?.username || null, botId: me?.id || null };
        } catch (err) {
          report.bot = { ...report.bot, ok: false, error: String(err.message).slice(0, 200) };
        }
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  // { displayName, username, externalAccountId, pageAccessToken|botToken|secret,
  //   phoneNumberId (whatsapp), verifyToken?, micromindFlowId?, flowKey?,
  //   autoProvision? }
  // flowKey = pasted MicroMind prediction key for the linked flow. Vaulted
  // (never returned), linked to the flow row, and exercised by an automatic
  // harmless test ping. whatsapp|gmail are BYOF until their template
  // lands: micromindFlowId required.
  r.post('/api/v1/workspaces/:workspaceId/channels/:channel/connect', requireWorkspace, async (req, res) => {
    const { channel } = req.params;
    const workspaceId = req.workspaceId;
    if (!FULL.includes(channel) && !BYOF.includes(channel)) {
      return res.status(400).json({ error: `Unknown channel: ${channel}` });
    }

    const { displayName, username, externalAccountId, pageAccessToken, botToken, secret,
      phoneNumberId, verifyToken, micromindFlowId, flowKey, autoProvision = true } = req.body || {};
    const credentialSecret = pageAccessToken || botToken || secret;
    // Discord: validate the pasted bot token (fail fast on 401/403) and
    // resolve the bot's user id, so the account has a stable external
    // identity even when the operator pastes only the token. Outages stay
    // best-effort: getDiscordMe returns null and the old discovery path runs.
    let resolvedExternalId = externalAccountId || null;
    let resolvedUsername = username || null;
    if (channel === 'discord' && credentialSecret && !resolvedExternalId) {
      try {
        const me = await getDiscordMe(credentialSecret);
        if (me?.id) {
          resolvedExternalId = me.id;
          if (!resolvedUsername && me.username) resolvedUsername = me.username;
        } else {
          const fallback = await discoverDiscordBot(credentialSecret).catch(() => null);
          if (fallback?.id) {
            resolvedExternalId = fallback.id;
            if (!resolvedUsername && fallback.username) resolvedUsername = fallback.username;
          }
        }
      } catch (err) {
        if (err?.code === 'invalid_bot_token') {
          return res.status(400).json({ code: 'invalid_bot_token', error: String(err.message).slice(0, 200) });
        }
      }
    }
    // Telegram: validate the pasted bot token via getMe (fail fast on typos)
    // and resolve the bot's stable identity, so the account row is keyed by
    // the bot itself even when the operator pastes only the token.
    if (channel === 'telegram' && credentialSecret && !resolvedExternalId) {
      try {
        const me = await getTelegramMe({ botToken: credentialSecret });
        resolvedExternalId = me.botId;
        if (!resolvedUsername && me.username) resolvedUsername = me.username;
      } catch (err) {
        return res.status(400).json({ code: 'invalid_bot_token', error: String(err.message).slice(0, 200) });
      }
    }
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
    // App-level verify token (single Meta app serves all tenants: Meta holds ONE
    // callback URL + ONE verify token per app, so the token must be stable and
    // shared, never per-account random. Tenant routing happens per-event via
    // entry.id -> channel_accounts.external_account_id. An explicit verifyToken
    // in the body still wins (operator override / migration scenarios).
    const finalVerify = verifyToken || CHANNELS[channel].defaultVerifyToken || null;
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
        [accountId, workspaceId, channel, resolvedExternalId || resolvedUsername || channel, displayName || resolvedUsername || channel,
         resolvedUsername || null, credentialId, micromindFlowId || null,
         JSON.stringify({ verify_token: finalVerify, webhook_name: channel, ...extraMeta })]
      );
      const accId = (
        await pool.query(
          'SELECT id FROM channel_accounts WHERE workspace_id=$1 AND channel=$2 AND external_account_id=$3',
          [workspaceId, channel, resolvedExternalId || resolvedUsername || channel]
        )
      ).rows[0].id;

      // Provision: folder -> tenant key -> flow-in-folder + key link (zero-touch).
      // Falls back to a supplied micromindFlowId (BYOF). A pasted flowKey is
      // vaulted and linked so enforced flows don't 401 at runtime. Any failure
      // lands the account in 'error' with the reason in metadata (never a 500).
      let flowId = micromindFlowId || null;
      let keyCredentialId = null;
      let folderId = null;
      let flowRowId = null;
      const flowLabel = `ORBIT ${channel} - ${displayName || username || workspaceId}`;
      let status = micromindFlowId ? 'active' : 'connecting';
      if (autoProvision && !micromindFlowId) {
        try {
          const ws = (await pool.query('SELECT * FROM workspace_settings WHERE workspace_id=$1', [workspaceId])).rows[0] || {};
          const out = await provisionTenantChannelFlow(pool, workspaceId, channel, {
            name: `ORBIT ${channel} - ${ws.business_name || workspaceId}`,
            verifyToken: finalVerify,
            businessName: ws.business_name,
            aiTone: ws.ai_tone,
            language: ws.language,
            phoneNumberId: phoneNumberId || null,
          });
          flowId = out.flow.id;
          folderId = out.folderId;
          keyCredentialId = out.credentialId;
          flowRowId = rid('mmf');
          await pool.query('INSERT INTO micromind_flows (id, workspace_id, channel_account_id, external_flow_id, template, template_version, purpose, label, source, prediction_key_credential_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,\'active\')',
            [flowRowId, workspaceId, accId, flowId, channel, await templateVersionForAsync(pool, channel), 'channel', flowLabel, 'provisioned', keyCredentialId]);
          status = 'active';
        } catch (e) {
          status = 'error';
          await pool.query('UPDATE channel_accounts SET status=$1, metadata = metadata || $2 WHERE id=$3',
            [status, JSON.stringify({ provision_error: String(e.message).slice(0, 300) }), accId]);
        }
      } else if (flowId) {
        // BYOF: register the pasted link. A pasted flowKey is vaulted and linked
        // so key-enforced flows don't 401 at runtime (the pre-existing NULL bug).
        if (flowKey && String(flowKey).trim()) {
          const pastedId = rid('cred');
          await pool.query(
            'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata) VALUES ($1,$2,$3,$4,$5)',
            [pastedId, workspaceId, 'micromind_prediction', encryptSecret(JSON.stringify({ apiKey: String(flowKey).trim(), apiSecret: null })),
             JSON.stringify({ source: 'pasted', channel })]
          );
          keyCredentialId = pastedId;
        }
        flowRowId = rid('mmf');
        await pool.query('INSERT INTO micromind_flows (id, workspace_id, channel_account_id, external_flow_id, template, template_version, purpose, label, source, prediction_key_credential_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,\'active\') ON CONFLICT DO NOTHING',
          [flowRowId, workspaceId, accId, flowId, channel, await templateVersionForAsync(pool, channel), 'channel', flowLabel, 'byof', keyCredentialId]);
      }
      if (status === 'active') {
        await pool.query('UPDATE channel_accounts SET status=$1, micromind_flow_id=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3',
          [status, flowId, accId]);
      }
      // Discord intake is gateway-based: start (or restart) this account's
      // listener now that the token is vaulted. Best-effort — a dead token
      // kills only its listener, never the connect.
      if (channel === 'discord' && status === 'active') {
        try {
          const full = (await pool.query('SELECT * FROM channel_accounts WHERE id=$1', [accId])).rows[0];
          if (full) await startDiscordAccount(pool, full);
        } catch (err) {
          console.error(`[channel:discord] gateway start failed:`, err.message);
        }
      }
      // Zero-touch intake registration (best-effort, never fails connect):
      // telegram -> ORBIT calls setWebhook itself (the per-tenant cutover).
      // Anything unresolved stays manual via the returned secrets/hints.
      let intake = { attempted: false };
      const backendUrl = orbitBackendPublicUrl();
      const backendReal = !backendUrl.includes('YOUR-ORBIT-BACKEND');
      if (channel === 'telegram' && status === 'active' && credentialSecret && webhookSecret) {
        intake = { attempted: true, transport: 'telegram-webhook', url: `${backendUrl}/webhooks/telegram` };
        if (!backendReal) {
          intake = { ...intake, ok: false, error: 'backend URL not configured — register manually (secret + URL hint returned)' };
        } else {
          try {
            await setTelegramWebhook({ botToken: credentialSecret, url: `${backendUrl}/webhooks/telegram`, secret: webhookSecret });
            intake = { ...intake, ok: true };
          } catch (err) {
            intake = { ...intake, ok: false, error: String(err.message).slice(0, 200) };
          }
        }
        await pool.query('UPDATE channel_accounts SET metadata = metadata || $1 WHERE id=$2',
          [JSON.stringify({ webhook_registration: { ...intake, at: new Date().toISOString() } }), accId]).catch(() => {});
      }
      // Automatic link validation (fixed harmless ping). Records the result on
      // the flow row; a failed test never fails the connect itself.
      let test = { status: 'skipped', detail: 'no key linked — test once a key is added' };
      if (flowRowId && keyCredentialId) {
        const result = await testFlowLink(pool, { flowId, credentialId: keyCredentialId, workspaceId });
        await recordLinkTest(pool, flowRowId, result);
        test = { status: result.status, latencyMs: result.latencyMs, detail: result.detail || null };
      }
      await audit(pool, workspaceId, 'channel.connect', `${channel}:${accId}`, { status, test: test.status }, req.user.email);
      const { rows } = await pool.query('SELECT * FROM channel_accounts WHERE id=$1', [accId]);
      res.json({
        channel, status, account: safeAccount(rows[0]),
        test,
        intake,
        tenancy: {
          folder: folderId ? 'ready' : 'pending',
          folderId: folderId || null,
          keyProvisioned: Boolean(keyCredentialId),
        },
        // Returned ONCE: manual fallback for the Telegram webhook (auto-registered
        // above when possible) — configure via setWebhook with this secret_token.
        // Never stored elsewhere.
        ...(webhookSecret ? { webhookSecret, webhookUrlHint: 'POST /webhooks/telegram' } : {}),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Publish-now: deliver a scheduled post to Meta now (merges ORBIT Posts
  // duties into the production app). Uses the workspace's vaulted Page token
  // (messenger account preferred, instagram fallback) — tokens must carry
  // pages_manage_posts under the production app. Per-platform outcomes land in
  // content_schedules.result; row goes published if ANY platform succeeded.
  // whatsapp has no Meta publish API here and is recorded skipped.
  r.post('/api/v1/workspaces/:workspaceId/schedules/:id/publish', requireWorkspace, async (req, res) => {
    const workspaceId = req.workspaceId;
    try {
      const row = (await pool.query(
        'SELECT * FROM content_schedules WHERE id=$1 AND workspace_id=$2',
        [req.params.id, workspaceId])).rows[0];
      if (!row) return res.status(404).json({ error: 'schedule not found' });
      if (row.status === 'published') return res.status(409).json({ code: 'already_published', error: 'already published' });
      const accs = (await pool.query(
        "SELECT * FROM channel_accounts WHERE workspace_id=$1 AND channel IN ('messenger','instagram') AND status='active' AND credential_id IS NOT NULL ORDER BY CASE channel WHEN 'messenger' THEN 0 ELSE 1 END",
        [workspaceId])).rows;
      if (!accs.length) {
        return res.status(409).json({ code: 'no_channel', error: 'connect a Messenger or Instagram channel first (its Page token publishes)' });
      }
      const results = {};
      for (const platform of row.platforms || []) {
        if (platform === 'facebook' || platform === 'messenger') {
          const acc = accs.find((a) => a.channel === 'messenger') || accs[0];
          try {
            const cred = (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [acc.credential_id])).rows[0];
            const out = await publishPagePost({
              pageAccessToken: decryptSecret(cred.encrypted_secret),
              pageId: acc.external_account_id,
              message: row.content_text,
              link: row.media_url && !row.media_url.startsWith('data:') ? row.media_url : undefined,
            });
            results.facebook = { ok: true, postId: out?.id || null };
          } catch (e) {
            results.facebook = { ok: false, error: String(e.message).slice(0, 200) };
          }
        } else if (platform === 'instagram') {
          const acc = accs.find((a) => a.channel === 'instagram');
          if (!acc) {
            results.instagram = { ok: false, error: 'no instagram channel connected' };
          } else if (!row.media_url || !/^https:\/\//i.test(row.media_url)) {
            results.instagram = { ok: false, error: 'instagram requires a public https image_url' };
          } else {
            try {
              const cred = (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [acc.credential_id])).rows[0];
              const out = await publishInstagramMedia({
                pageAccessToken: decryptSecret(cred.encrypted_secret),
                igId: acc.external_account_id,
                imageUrl: row.media_url,
                caption: row.content_text,
              });
              results.instagram = { ok: true, mediaId: out?.id || null };
            } catch (e) {
              results.instagram = { ok: false, error: String(e.message).slice(0, 200) };
            }
          }
        } else {
          results[platform] = { ok: false, error: 'skipped: no publish API for this platform' };
        }
      }
      const anyOk = Object.values(results).some((r) => r.ok);
      const status = anyOk ? 'published' : 'failed';
      await pool.query(
        'UPDATE content_schedules SET status=$1, result=$2, published_at=CASE WHEN $1=$3 THEN CURRENT_TIMESTAMP ELSE published_at END WHERE id=$4',
        [status, JSON.stringify(results), 'published', row.id]
      );
      await audit(pool, workspaceId, 'schedule.publish', `${row.id}`, { status }, req.user.email);
      res.json({ id: row.id, status, results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // OAuth start: create a one-time state bound to the caller's workspace and
  // return the Meta authorization URL. The callback is deliberately cookieless;
  // the state is the workspace trust anchor.
  r.post('/api/v1/workspaces/:workspaceId/channels/:channel/oauth/start', requireWorkspace, async (req, res) => {
    const { channel } = req.params;
    if (!['messenger', 'instagram'].includes(channel)) return res.status(400).json({ error: 'Meta OAuth is available for Messenger and Instagram only' });
    if (!metaConfigured()) return res.status(503).json({ code: 'meta_oauth_not_configured', error: 'Set META_APP_ID and META_APP_SECRET on the backend first' });
    const state = crypto.randomBytes(24).toString('hex');
    const returnTo = oauthReturnTarget(req.body?.returnTo);
    await pool.query(
      "INSERT INTO oauth_states (id, workspace_id, provider, state, metadata, expires_at) VALUES ($1,$2,$3,$4,$5, CURRENT_TIMESTAMP + INTERVAL '15 minutes')",
      [rid('oas'), req.workspaceId, channel, state, JSON.stringify({ requested_channel: channel, return_to: returnTo })]
    );
    res.json({ provider: channel, state, authUrl: buildMetaAuthUrl({ channel, state }), redirectUri: metaRedirectUri(channel) });
  });

  // OAuth callback: exchange the code, discover Page + Instagram assets, vault
  // their Page tokens, and provision one ORBIT/MicroMind flow per asset.
  r.get('/api/v1/channels/:channel/oauth/callback', async (req, res) => {
    const { state, code } = req.query;
    if (!state) return res.status(400).json({ error: 'missing state' });
    const { rows } = await pool.query("SELECT * FROM oauth_states WHERE state=$1 AND expires_at > CURRENT_TIMESTAMP", [state]);
    if (!rows.length) return res.status(400).json({ error: 'invalid or expired state' });
    const oauthState = rows[0];
    const returnTo = oauthState.metadata?.return_to;
    if (oauthState.provider !== req.params.channel || !['messenger', 'instagram'].includes(req.params.channel)) {
      return res.status(400).json({ error: 'OAuth state/provider mismatch' });
    }
    await pool.query('DELETE FROM oauth_states WHERE state=$1', [state]);
    if (req.query.error) return oauthCallbackPage(res, 400, { error: String(req.query.error_description || req.query.error) }, returnTo);
    if (!code) return oauthCallbackPage(res, 400, { error: 'missing OAuth code' }, returnTo);
    try {
      const exchanged = await exchangeMetaCode({ code: String(code), channel: req.params.channel });
      const discovered = await discoverMetaAssets(exchanged.access_token);
      const metaCredentialId = rid('cred');
      const connectionId = rid('meta');
      const expiresAt = exchanged.expires_in ? new Date(Date.now() + Number(exchanged.expires_in) * 1000) : null;
      await pool.query(
        'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata, expires_at, refreshed_at) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)',
        [metaCredentialId, oauthState.workspace_id, 'meta_user_oauth', encryptSecret(exchanged.access_token), JSON.stringify({ meta_user_id: discovered.user.id }), expiresAt]
      );
      await pool.query(
        "INSERT INTO meta_connections (id, workspace_id, meta_user_id, meta_user_name, credential_id, scopes, expires_at, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (workspace_id, meta_user_id) DO UPDATE SET meta_user_name=EXCLUDED.meta_user_name, credential_id=EXCLUDED.credential_id, scopes=EXCLUDED.scopes, expires_at=EXCLUDED.expires_at, status='active', updated_at=CURRENT_TIMESTAMP",
        [connectionId, oauthState.workspace_id, discovered.user.id, discovered.user.name || null, metaCredentialId,
          String(process.env.META_OAUTH_SCOPES || '').split(',').map((s) => s.trim()).filter(Boolean), expiresAt, JSON.stringify({ source: 'oauth' })]
      );
      const actualConnectionId = (await pool.query('SELECT id FROM meta_connections WHERE workspace_id=$1 AND meta_user_id=$2', [oauthState.workspace_id, discovered.user.id])).rows[0]?.id || connectionId;
      const linked = [];
      for (const asset of discovered.assets) {
        const credentialId = rid('cred');
        await pool.query(
          'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata) VALUES ($1,$2,$3,$4,$5)',
          [credentialId, oauthState.workspace_id, asset.channel === 'messenger' ? 'meta_messenger' : 'meta_instagram', encryptSecret(asset.pageAccessToken), JSON.stringify({ channel: asset.channel, page_id: asset.pageId, instagram_business_id: asset.instagramBusinessId || null })]
        );
        const existing = (await pool.query('SELECT * FROM channel_accounts WHERE workspace_id=$1 AND channel=$2 AND external_account_id=$3', [oauthState.workspace_id, asset.channel, asset.externalAccountId])).rows[0];
        const accountId = existing?.id || rid('ch');
        const verifyToken = CHANNELS[asset.channel].defaultVerifyToken;
        let subscription = 'active';
        try { await subscribePage(asset.pageId, asset.pageAccessToken); } catch (err) { subscription = `failed: ${String(err.message).slice(0, 180)}`; }
        await pool.query(
          `INSERT INTO channel_accounts (id, workspace_id, channel, external_account_id, display_name, username, credential_id, status, meta_connection_id, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'connecting',$8,$9)
           ON CONFLICT (workspace_id, channel, external_account_id) DO UPDATE SET display_name=EXCLUDED.display_name, username=EXCLUDED.username, credential_id=EXCLUDED.credential_id, status='connecting', meta_connection_id=EXCLUDED.meta_connection_id, metadata=EXCLUDED.metadata, updated_at=CURRENT_TIMESTAMP`,
          [accountId, oauthState.workspace_id, asset.channel, asset.externalAccountId, asset.displayName, asset.username, credentialId, actualConnectionId, JSON.stringify({ verify_token: verifyToken, webhook_name: asset.channel, page_id: asset.pageId, instagram_business_id: asset.instagramBusinessId || null, source: 'meta_oauth', webhook_subscription: subscription })]
        );
        // OAuth reconnects refresh Meta credentials, but must not clone the
        // tenant's MicroMind flow. Reuse the existing linked flow whenever it
        // is still recorded for this channel account.
        if (existing?.micromind_flow_id) {
          const flowRow = (await pool.query(
            'SELECT id FROM micromind_flows WHERE workspace_id=$1 AND channel_account_id=$2 AND external_flow_id=$3 ORDER BY updated_at DESC LIMIT 1',
            [oauthState.workspace_id, accountId, existing.micromind_flow_id]
          )).rows[0];
          if (flowRow) {
            await pool.query(
              "UPDATE channel_accounts SET status='active', micromind_flow_id=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2",
              [existing.micromind_flow_id, accountId]
            );
            await pool.query("UPDATE micromind_flows SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [flowRow.id]);
            let historySync = { status: 'synced' };
            try { historySync = { status: 'synced', ...(await syncMetaConversations(pool, { workspaceId: oauthState.workspace_id, accountId, channel: asset.channel, pageId: asset.pageId, businessId: asset.channel === 'instagram' ? asset.instagramBusinessId : asset.pageId, pageAccessToken: asset.pageAccessToken })) }; }
            catch (syncErr) { historySync = { status: 'failed', error: String(syncErr.message).slice(0, 240) }; }
            await pool.query("UPDATE channel_accounts SET metadata=metadata || $1 WHERE id=$2", [JSON.stringify({ history_sync: historySync }), accountId]);
            linked.push({ channel: asset.channel, id: asset.externalAccountId, status: 'active', reused: true, historySync });
            continue;
          }
        }
        const ws = (await pool.query('SELECT * FROM workspace_settings WHERE workspace_id=$1', [oauthState.workspace_id])).rows[0] || {};
        try {
          const out = await provisionTenantChannelFlow(pool, oauthState.workspace_id, asset.channel, {
            name: `ORBIT ${asset.channel} - ${ws.business_name || oauthState.workspace_id}`,
            verifyToken, businessName: ws.business_name, aiTone: ws.ai_tone, language: ws.language,
          });
          const flowRowId = rid('mmf');
          await pool.query("INSERT INTO micromind_flows (id, workspace_id, channel_account_id, external_flow_id, template, template_version, purpose, label, source, prediction_key_credential_id, status) VALUES ($1,$2,$3,$4,$5,$6,'channel',$7,'provisioned',$8,'active')",
            [flowRowId, oauthState.workspace_id, accountId, out.flow.id, asset.channel, await templateVersionForAsync(pool, asset.channel), `ORBIT ${asset.channel} - ${asset.displayName}`, out.credentialId]);
          await pool.query("UPDATE channel_accounts SET status='active', micromind_flow_id=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [out.flow.id, accountId]);
          let historySync = { status: 'synced' };
          try { historySync = { status: 'synced', ...(await syncMetaConversations(pool, { workspaceId: oauthState.workspace_id, accountId, channel: asset.channel, pageId: asset.pageId, businessId: asset.channel === 'instagram' ? asset.instagramBusinessId : asset.pageId, pageAccessToken: asset.pageAccessToken })) }; }
          catch (syncErr) { historySync = { status: 'failed', error: String(syncErr.message).slice(0, 240) }; }
          await pool.query("UPDATE channel_accounts SET metadata=metadata || $1 WHERE id=$2", [JSON.stringify({ history_sync: historySync }), accountId]);
          linked.push({ channel: asset.channel, id: asset.externalAccountId, status: 'active', historySync });
        } catch (err) {
          await pool.query("UPDATE channel_accounts SET status='error', metadata=metadata || $1 WHERE id=$2", [JSON.stringify({ provision_error: String(err.message).slice(0, 300) }), accountId]);
          linked.push({ channel: asset.channel, id: asset.externalAccountId, status: 'error', error: String(err.message).slice(0, 160) });
        }
      }
      return oauthCallbackPage(res, 200, { channel: req.params.channel, status: 'connected', metaUser: { id: discovered.user.id, name: discovered.user.name || null }, linked }, returnTo);
    } catch (err) {
      return oauthCallbackPage(res, err.status || 502, { code: err.code || 'meta_oauth_failed', error: err.message }, returnTo);
    }
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
      if (rows[0].channel === 'discord') {
        try { await stopDiscordAccount(rows[0].id); } catch { /* listener already dead */ }
      }
      if (rows[0].channel === 'telegram' && rows[0].credential_id) {
        // Zero-touch offboarding: release the bot's webhook so updates stop
        // hitting ORBIT (and the token can be re-pointed). Never fails disconnect.
        try {
          const cred = (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [rows[0].credential_id])).rows[0];
          if (cred) await deleteTelegramWebhook({ botToken: decryptSecret(cred.encrypted_secret) });
        } catch { /* webhook already gone or token dead */ }
      }
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
      if (rows[0].channel === 'discord') {
        try { await startDiscordAccount(pool, rows[0]); } catch { /* dead token kills only its listener */ }
      }
      await audit(pool, workspaceId, 'channel.reconnect', rows[0].channel + ':' + rows[0].id, {}, req.user.email);
      res.json({ channel: rows[0].channel, status: 'active' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Re-run the harmless link-validation ping for an account's latest flow row.
  r.post('/api/v1/channels/:id/test', async (req, res) => {
    try {
      const acc = (await pool.query('SELECT * FROM channel_accounts WHERE id=$1', [req.params.id])).rows[0];
      const workspaceId = workspaceFor(req, acc?.workspace_id);
      if (!acc || !workspaceId) return res.status(404).json({ error: 'channel not found' });
      const row = (await pool.query(
        'SELECT * FROM micromind_flows WHERE channel_account_id=$1 ORDER BY updated_at DESC LIMIT 1',
        [acc.id])).rows[0];
      if (!row?.external_flow_id) return res.status(409).json({ error: 'no flow linked yet' });
      const result = await testFlowLink(pool, {
        flowId: row.external_flow_id, credentialId: row.prediction_key_credential_id, workspaceId,
      });
      await recordLinkTest(pool, row.id, result);
      await audit(pool, workspaceId, 'channel.test', `${acc.channel}:${acc.id}`, { status: result.status }, req.user.email);
      res.json({ channel: acc.channel, flowId: row.external_flow_id, test: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rotate the prediction key for an account's latest flow row. The pasted key
  // is vaulted and swapped in, then re-tested. The OLD vault row is left in
  // place (swap-only): revoke the old key inside MicroMind GUI manually —
  // ORBIT cannot delete server-side keys without a management token, and will
  // never pretend otherwise.
  r.put('/api/v1/channels/:id/key', async (req, res) => {
    try {
      const { flowKey } = req.body || {};
      if (!flowKey || !String(flowKey).trim()) {
        return res.status(400).json({ error: 'flowKey required (paste the new prediction key)' });
      }
      const acc = (await pool.query('SELECT * FROM channel_accounts WHERE id=$1', [req.params.id])).rows[0];
      const workspaceId = workspaceFor(req, acc?.workspace_id);
      if (!acc || !workspaceId) return res.status(404).json({ error: 'channel not found' });
      const row = (await pool.query(
        'SELECT * FROM micromind_flows WHERE channel_account_id=$1 ORDER BY updated_at DESC LIMIT 1',
        [acc.id])).rows[0];
      if (!row?.external_flow_id) return res.status(409).json({ error: 'no flow linked yet' });
      const oldCredentialId = row.prediction_key_credential_id || null;
      const nextId = rid('cred');
      await pool.query(
        'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata) VALUES ($1,$2,$3,$4,$5)',
        [nextId, workspaceId, 'micromind_prediction', encryptSecret(JSON.stringify({ apiKey: String(flowKey).trim(), apiSecret: null })),
         JSON.stringify({ source: 'pasted', channel: acc.channel, rotated_from: oldCredentialId })]
      );
      await pool.query('UPDATE micromind_flows SET prediction_key_credential_id=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2',
        [nextId, row.id]);
      const result = await testFlowLink(pool, { flowId: row.external_flow_id, credentialId: nextId, workspaceId });
      await recordLinkTest(pool, row.id, result);
      await audit(pool, workspaceId, 'channel.key.rotate', `${acc.channel}:${acc.id}`, { status: result.status }, req.user.email);
      res.json({
        channel: acc.channel,
        rotated: true,
        test: result,
        manualRevokeNote: 'Old key left untouched server-side: revoke it inside MicroMind GUI (API Keys) to complete rotation.',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
