// Plan + usage for the caller's workspace (all members can read).
// Billing provider plugs in later by updating workspaces.plan.
import express from 'express';
import { requireAuth, workspaceFor } from '../auth/middleware.js';
import { getWorkspacePlan } from './plans.js';

export function billingRouter(pool) {
  const r = express.Router();
  r.use(requireAuth);

  r.get('/api/v1/workspaces/:workspaceId/plan', async (req, res) => {
    const workspaceId = workspaceFor(req, req.params.workspaceId);
    if (!workspaceId) return res.status(403).json({ error: 'no workspace access' });
    try {
      const plan = await getWorkspacePlan(pool, workspaceId);
      const ch = await pool.query(
        `SELECT COUNT(*)::int AS active,
                COUNT(*) FILTER (WHERE status='error')::int AS errored
         FROM channel_accounts WHERE workspace_id=$1 AND status IN ('active','error')`,
        [workspaceId]
      );
      const msg = await pool.query(
        `SELECT COUNT(*)::int AS events,
                COUNT(*) FILTER (WHERE status='processed')::int AS processed
         FROM webhook_events WHERE workspace_id=$1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'`,
        [workspaceId]
      );
      res.json({
        plan,
        usage: {
          channelsActive: ch.rows[0]?.active || 0,
          channelsErrored: ch.rows[0]?.errored || 0,
          events30d: msg.rows[0]?.events || 0,
          processed30d: msg.rows[0]?.processed || 0,
        },
        billing: { provider: null, note: 'Billing provider not connected — plans are assigned manually.' },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
