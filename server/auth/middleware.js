// Auth middleware: requireAuth (valid session), requireWorkspace (membership),
// requireRole (owner/admin for admin routes). Import these in every router;
// nothing trusts a client-supplied workspace_id without a membership row.
import { getSessionUser, parseCookies, COOKIE_NAME } from './sessions.js';

export async function requireAuth(req, res, next) {
  try {
    const token = parseCookies(req)[COOKIE_NAME];
    const user = await getSessionUser(req.app.get('pool'), token);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Resolve :workspaceId from membership. Single-workspace users get it implicitly.
export function requireWorkspace(req, res, next) {
  const wid = workspaceFor(req);
  if (!wid) return res.status(403).json({ error: 'no workspace access' });
  req.workspaceId = wid;
  req.workspaceRole = (req.user?.memberships || []).find((m) => m.workspace_id === wid)?.role;
  next();
}

// workspaceFor: param workspace wins if member; else a verified row workspace;
// else the single membership. Returns null when access is not granted.
export function workspaceFor(req, rowWorkspace) {
  const ms = req.user?.memberships || [];
  if (req.params.workspaceId) {
    return ms.some((m) => m.workspace_id === req.params.workspaceId) ? req.params.workspaceId : null;
  }
  if (rowWorkspace && ms.some((m) => m.workspace_id === rowWorkspace)) return rowWorkspace;
  if (ms.length === 1) return ms[0].workspace_id;
  return null;
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.workspaceRole)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
