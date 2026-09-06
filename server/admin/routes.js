// Internal admin API: workspaces, channels, flows, errors, usage.
// MVP: no auth gate (same rule as everything else) — put behind SSO/admin check
// before any production pilot. Returns counts + safe fields only (never secrets).
import express from 'express';

const q = async (pool, sql, params = []) => {
  try {
    return (await pool.query(sql, params)).rows;
  } catch {
    return null; // DB down (migrations pending) -> nulls, not 500s
  }
};

export function adminRouter(pool) {
  const r = express.Router();

  r.get('/api/v1/admin/overview', async (_req, res) => {
    const [ws, ch, flows, msgs, errs] = await Promise.all([
      q(pool, 'SELECT id, name, plan FROM workspaces'),
      q(pool, "SELECT channel, status, COUNT(*)::int AS n FROM channel_accounts GROUP BY 1,2"),
      q(pool, 'SELECT template, status, COUNT(*)::int AS n FROM micromind_flows GROUP BY 1,2'),
      q(pool, "SELECT provider, COUNT(*)::int AS n FROM webhook_events WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' GROUP BY 1"),
      q(pool, "SELECT COUNT(*)::int AS n FROM webhook_events WHERE status IN ('failed') AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'"),
    ]);
    res.json({ workspaces: ws, channels: ch, flows, messages24h: msgs, errors24h: errs?.[0]?.n ?? null, dbUp: ws !== null });
  });

  r.get('/api/v1/admin/channels', async (_req, res) => {
    const rows = await q(pool,
      `SELECT a.id, a.workspace_id, a.channel, a.display_name, a.username, a.status, a.micromind_flow_id,
              a.updated_at AS last_sync,
              (SELECT COUNT(*)::int FROM conversations c WHERE c.channel_account_id = a.id) AS conversations,
              (SELECT MAX(created_at) FROM webhook_events w WHERE w.channel_account_id = a.id) AS last_webhook
       FROM channel_accounts a ORDER BY a.updated_at DESC`);
    res.json(rows || []);
  });

  r.get('/api/v1/admin/flows', async (_req, res) => {
    const rows = await q(pool,
      'SELECT id, workspace_id, channel_account_id, external_flow_id, template, template_version, status, updated_at FROM micromind_flows ORDER BY updated_at DESC');
    res.json(rows || []);
  });

  r.get('/api/v1/admin/errors', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const rows = await q(pool,
      `SELECT id, provider, external_event_id, workspace_id, channel_account_id, status, processed_at, created_at
       FROM webhook_events WHERE status IN ('failed','no_channel') ORDER BY created_at DESC LIMIT $1`, [limit]);
    const audit = await q(pool,
      'SELECT id, workspace_id, action, resource, meta, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ webhooks: rows || [], audit: audit || [] });
  });

  r.get('/api/v1/admin/usage', async (_req, res) => {
    const rows = await q(pool,
      `SELECT provider, DATE(created_at) AS day, COUNT(*)::int AS events,
              COUNT(*) FILTER (WHERE status='processed')::int AS processed
       FROM webhook_events WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY 1,2 ORDER BY 2 DESC, 1`);
    res.json(rows || []);
  });

  return r;
}
