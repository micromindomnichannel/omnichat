// Internal admin API: workspaces, channels, flows, errors, usage.
// Requires a session with an owner/admin workspace role. Non-admin members get
// 403. Returns counts + safe fields only (never secrets).
import express from 'express';
import { requireAuth, workspaceFor, requireRole } from '../auth/middleware.js';
import { authMode } from '../micromind/provisioner.js';
import { analystStatus } from '../micromind/analyst.js';

const q = async (pool, sql, params = []) => {
  try {
    return (await pool.query(sql, params)).rows;
  } catch {
    return null; // DB down (migrations pending) -> nulls, not 500s
  }
};

export function adminRouter(pool) {
  const r = express.Router();
  // Admin over the caller's own workspace (first membership). Cross-workspace
  // admin comes with the multi-org phase; the user/org model is ready for it.
  // Path-scoped to /api/v1/admin (bare r.use would intercept every request
  // when the router is mounted without a prefix).
  r.use('/api/v1/admin', requireAuth, (req, res, next) => {
    const wid = workspaceFor(req);
    if (!wid) return res.status(403).json({ error: 'no workspace access' });
    req.workspaceId = wid;
    req.workspaceRole = (req.user?.memberships || []).find((m) => m.workspace_id === wid)?.role;
    next();
  }, requireRole('owner', 'admin'));

  r.get('/api/v1/admin/overview', async (req, res) => {
    const w = req.workspaceId;
    const [ws, ch, flows, msgs, errs] = await Promise.all([
      q(pool, 'SELECT id, name, plan FROM workspaces WHERE id=$1', [w]),
      q(pool, "SELECT channel, status, COUNT(*)::int AS n FROM channel_accounts WHERE workspace_id=$1 GROUP BY 1,2", [w]),
      q(pool, 'SELECT template, status, COUNT(*)::int AS n FROM micromind_flows WHERE workspace_id=$1 GROUP BY 1,2', [w]),
      q(pool, "SELECT provider, COUNT(*)::int AS n FROM webhook_events WHERE workspace_id=$1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' GROUP BY 1", [w]),
      q(pool, "SELECT COUNT(*)::int AS n FROM webhook_events WHERE workspace_id=$1 AND status IN ('failed') AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'", [w]),
    ]);
    res.json({ workspaces: ws, channels: ch, flows, messages24h: msgs, errors24h: errs?.[0]?.n ?? null, dbUp: ws !== null });
  });

  r.get('/api/v1/admin/channels', async (req, res) => {
    const rows = await q(pool,
      `SELECT a.id, a.workspace_id, a.channel, a.display_name, a.username, a.status, a.micromind_flow_id,
              a.updated_at AS last_sync,
              w.micromind_folder_id AS folder_id,
              w.micromind_folder_status AS folder_status,
              EXISTS (SELECT 1 FROM micromind_flows f WHERE f.channel_account_id = a.id AND f.prediction_key_credential_id IS NOT NULL) AS key_provisioned,
              (SELECT last_test_status FROM micromind_flows f WHERE f.channel_account_id = a.id ORDER BY updated_at DESC LIMIT 1) AS last_test,
              (SELECT last_test_status FROM micromind_flows f WHERE f.channel_account_id = a.id ORDER BY updated_at DESC LIMIT 1) AS last_test,
              (SELECT COUNT(*)::int FROM conversations c WHERE c.channel_account_id = a.id) AS conversations,
              (SELECT MAX(created_at) FROM webhook_events w WHERE w.channel_account_id = a.id) AS last_webhook
       FROM channel_accounts a LEFT JOIN workspaces w ON w.id = a.workspace_id
       WHERE a.workspace_id=$1 ORDER BY a.updated_at DESC`, [req.workspaceId]);
    res.json(rows || []);
  });

  r.get('/api/v1/admin/flows', async (req, res) => {
    const rows = await q(pool,
      `SELECT id, workspace_id, channel_account_id, external_flow_id, template, template_version,
              purpose, label, source, last_test_at, last_test_status,
              (prediction_key_credential_id IS NOT NULL) AS key_linked, status, updated_at
       FROM micromind_flows WHERE workspace_id=$1 ORDER BY updated_at DESC`,
      [req.workspaceId]);
    res.json(rows || []);
  });

  // MicroMind control-plane status: provisioner mode, analyst config, tenant folder.
  // Safe to expose to workspace admins (modes + ids only, never secrets).
  r.get('/api/v1/admin/micromind', async (req, res) => {
    try {
      const ws = (await pool.query(
        'SELECT micromind_folder_id, micromind_folder_status FROM workspaces WHERE id=$1',
        [req.workspaceId])).rows[0] || {};
      const a = analystStatus();
      let analystOverride = null;
      try {
        const srow = (await pool.query(
          'SELECT analyst_flow_id FROM workspace_settings WHERE workspace_id=$1',
          [req.workspaceId])).rows[0];
        if (srow?.analyst_flow_id) analystOverride = { flowSet: true };
      } catch { /* pre-009 databases */ }
      res.json({
        provisioner: { mode: authMode() },
        analyst: { configured: a.configured || Boolean(analystOverride), flowSet: Boolean(a.flowId) || Boolean(analystOverride), override: analystOverride ? 'workspace' : 'env' },
        folder: { id: ws.micromind_folder_id || null, status: ws.micromind_folder_status || 'pending' },
        dbUp: true,
      });
    } catch {
      const a = analystStatus();
      res.json({
        provisioner: { mode: authMode() },
        analyst: { configured: a.configured, flowSet: Boolean(a.flowId) },
        folder: { id: null, status: 'unknown' },
        dbUp: false,
      });
    }
  });

  // Member directory for the Team tab (owner/admin only via router gate).
  r.get('/api/v1/admin/users', async (req, res) => {
    const rows = await q(pool,
      `SELECT u.id, u.email, u.display_name, m.role, u.created_at
       FROM workspace_members m JOIN users u ON u.id = m.user_id
       WHERE m.workspace_id=$1 ORDER BY u.created_at ASC`, [req.workspaceId]);
    res.json(rows || []);
  });

  r.get('/api/v1/admin/errors', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const rows = await q(pool,
      `SELECT id, provider, external_event_id, workspace_id, channel_account_id, status, processed_at, created_at
       FROM webhook_events WHERE workspace_id=$1 AND status IN ('failed','no_channel') ORDER BY created_at DESC LIMIT $2`,
      [req.workspaceId, limit]);
    const audit = await q(pool,
      'SELECT id, workspace_id, action, resource, meta, created_at FROM audit_logs WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT $2',
      [req.workspaceId, limit]);
    res.json({ webhooks: rows || [], audit: audit || [] });
  });

  r.get('/api/v1/admin/usage', async (req, res) => {
    const rows = await q(pool,
      `SELECT provider, DATE(created_at) AS day, COUNT(*)::int AS events,
              COUNT(*) FILTER (WHERE status='processed')::int AS processed
       FROM webhook_events WHERE workspace_id=$1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY 1,2 ORDER BY 2 DESC, 1`, [req.workspaceId]);
    res.json(rows || []);
  });

  // Owner-only: create a member account (public registration closes after bootstrap).
  r.post('/api/v1/admin/users', requireRole('owner'), async (req, res) => {    const { email, password, displayName, role = 'agent' } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'valid email required' });
    if (!password || String(password).length < 10) return res.status(400).json({ error: 'password min 10 chars' });
    if (!['admin', 'agent'].includes(role)) return res.status(400).json({ error: 'role must be admin|agent' });
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const id = `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)',
        [id, String(email).toLowerCase(), await bcrypt.hash(String(password), 12), displayName || email.split('@')[0]]);
      await pool.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [req.workspaceId, id, role]);
      res.json({ user: { id, email: String(email).toLowerCase() }, membership: { workspace_id: req.workspaceId, role } });
    } catch (err) {
      if (String(err.message).includes('duplicate')) return res.status(409).json({ error: 'email taken' });
      res.status(500).json({ error: err.message });
    }
  });

  // Template registry status: manifest defaults + DB overrides + versions
  // actually in use. Lets Admin badge stale clones (badge-only policy: existing
  // clones are never auto-recloned).
  r.get('/api/v1/admin/templates', async (req, res) => {
    try {
      const { loadManifest } = await import('../micromind/provisionChannel.js');
      const manifest = loadManifest();
      const dbRows = await q(pool, 'SELECT channel, version, status, updated_at FROM flow_templates');
      const dbByChannel = Object.fromEntries((dbRows || []).map((r) => [r.channel, r]));
      const inUse = await q(pool,
        'SELECT template AS channel, template_version AS version, COUNT(*)::int AS clones FROM micromind_flows GROUP BY 1,2');
      const out = {};
      for (const [channel, entry] of Object.entries(manifest)) {
        const current = dbByChannel[channel]?.version || entry.version;
        out[channel] = {
          file: entry.file, currentVersion: current,
          currentSource: dbByChannel[channel] ? 'db' : 'file',
          status: dbByChannel[channel]?.status || entry.status,
          inUse: (inUse || []).filter((u) => u.channel === channel)
            .map((u) => ({ version: u.version, clones: u.clones, stale: u.version !== current })),
        };
      }
      res.json(out);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner-only: register/update a channel template export. Validates structure
  // (trigger + prompt + agent present) and scans for live secrets (bot tokens,
  // OAuth secrets, page tokens) plus requires an explicit no-secrets
  // attestation — templates ship to every future tenant clone.
  r.put('/api/v1/admin/templates/:channel', requireRole('owner'), async (req, res) => {
    const { channel } = req.params;
    const { flowData, version, status = 'draft', confirmNoSecrets = false } = req.body || {};
    const KNOWN = ['messenger', 'instagram', 'whatsapp', 'telegram', 'gmail'];
    if (!KNOWN.includes(channel)) return res.status(400).json({ error: `Unknown channel: ${channel}` });
    if (!version || !/^v\d+(-draft)?$/.test(String(version))) {
      return res.status(400).json({ error: "version required, format 'vN' or 'vN-draft' (e.g. v2-draft)" });
    }
    if (!['draft', 'verified'].includes(status)) return res.status(400).json({ error: "status must be 'draft' or 'verified'" });
    if (confirmNoSecrets !== true) {
      return res.status(400).json({ error: 'confirmNoSecrets:true required — attest the export holds no live tokens/keys' });
    }
    const { validateTemplateExport } = await import('../micromind/templateValidate.js');
    const check = validateTemplateExport(flowData);
    if (!check.ok) {
      return res.status(400).json({
        error: check.errors.length ? `invalid template: ${check.errors.join(', ')}` : `live secrets detected (${check.hits.length}) — strip them before registering`,
        errors: check.errors, hits: check.hits.slice(0, 10),
      });
    }
    const flow = flowData;
    try {
      await pool.query(
        `INSERT INTO flow_templates (channel, version, status, flow_data, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
         ON CONFLICT (channel) DO UPDATE SET version=EXCLUDED.version, status=EXCLUDED.status,
           flow_data=EXCLUDED.flow_data, updated_by=EXCLUDED.updated_by, updated_at=CURRENT_TIMESTAMP`,
        [channel, String(version), status, JSON.stringify(flow), req.user.email]
      );
      await pool.query(
        'INSERT INTO audit_logs (id, workspace_id, actor, action, resource, meta) VALUES ($1,$2,$3,$4,$5,$6)',
        [`aud_${Date.now()}`, req.workspaceId, req.user.email, 'template.register',
         `template:${channel}`, JSON.stringify({ version, status, nodes: flow.nodes.length })]
      );
      res.json({ channel, version: String(version), status, nodes: flow.nodes.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
