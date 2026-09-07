// Internal admin API: workspaces, channels, flows, errors, usage.
// Requires a session with an owner/admin workspace role. Non-admin members get
// 403. Returns counts + safe fields only (never secrets).
import express from 'express';
import { requireAuth, workspaceFor, requireRole } from '../auth/middleware.js';

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
              (SELECT COUNT(*)::int FROM conversations c WHERE c.channel_account_id = a.id) AS conversations,
              (SELECT MAX(created_at) FROM webhook_events w WHERE w.channel_account_id = a.id) AS last_webhook
       FROM channel_accounts a WHERE a.workspace_id=$1 ORDER BY a.updated_at DESC`, [req.workspaceId]);
    res.json(rows || []);
  });

  r.get('/api/v1/admin/flows', async (req, res) => {
    const rows = await q(pool,
      'SELECT id, workspace_id, channel_account_id, external_flow_id, template, template_version, status, updated_at FROM micromind_flows WHERE workspace_id=$1 ORDER BY updated_at DESC',
      [req.workspaceId]);
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
  r.post('/api/v1/admin/users', requireRole('owner'), async (req, res) => {
    const { email, password, displayName, role = 'agent' } = req.body || {};
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

  return r;
}
