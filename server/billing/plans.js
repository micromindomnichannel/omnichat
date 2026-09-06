// Plans + limits live ENTIRELY in ORBIT (never in MicroMind).
// MVP values from the plan; a billing provider (Stripe/Fawry) plugs in later
// by updating workspaces.plan. Auth-skipped MVP resolves the default workspace.
export const PLANS = {
  free: { label: 'Free', channels: 2, teamSeats: 1, messagesMonth: 1000 },
  pro: { label: 'Pro', channels: 6, teamSeats: 5, messagesMonth: 20000 },
  business: { label: 'Business', channels: Number.MAX_SAFE_INTEGER, teamSeats: 20, messagesMonth: Number.MAX_SAFE_INTEGER },
};

export function planOf(row) {
  const name = row?.plan && PLANS[row.plan] ? row.plan : 'pro';
  return { name, ...PLANS[name] };
}

export async function getWorkspacePlan(pool, workspaceId) {
  const { rows } = await pool.query('SELECT plan FROM workspaces WHERE id=$1', [workspaceId]);
  return planOf(rows[0]);
}

// Throws {code:'upgrade_required', status:402} when the workspace is at its cap.
export async function assertCanConnectChannel(pool, workspaceId, channel) {
  const plan = await getWorkspacePlan(pool, workspaceId);
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM channel_accounts WHERE workspace_id=$1 AND status='active'",
    [workspaceId]
  );
  if (rows[0].n >= plan.channels) {
    const err = new Error(`Plan limit reached: ${plan.label} allows ${plan.channels} active channels`);
    err.code = 'upgrade_required';
    err.status = 402;
    throw err;
  }
  return plan;
}
