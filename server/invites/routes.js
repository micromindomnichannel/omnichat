// Workspace invitations: owner invites by email, receiver accepts via link.
// Flow: POST /workspaces/:id/invites (owner) -> email with accept link ->
// GET /invites/:token (public lookup) -> POST /invites/:token/accept
// (public, sets password, creates session). Tokens are random 256-bit,
// stored sha256-hashed, 7-day expiry, single-use. Login is rate-limited;
// invite creation is owner-only. Never enumerates users (accept on an
// already-member email just joins, same response shape either way).
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuth, requireWorkspace, requireRole } from '../auth/middleware.js';
import { createSession, sessionCookie } from '../auth/sessions.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { sendMail } from '../mailer.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_DAYS = 7;
const acceptLimit = rateLimit({ windowMs: 60_000, max: 10 });

const frontendBase = () =>
  (process.env.ORBIT_FRONTEND_URL || 'https://orbit-xi-one-60.vercel.app').replace(/\/$/, '');

export function invitesRouter(pool) {
  const r = express.Router();

  // Owner: invite email+role to the workspace. Sends the accept link by email;
  // when mail is unconfigured the link is returned for manual forwarding.
  r.post('/api/v1/workspaces/:workspaceId/invites', requireAuth, requireWorkspace, requireRole('owner'), async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = String(req.body?.role || 'agent');
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'valid email required' });
    if (!['admin', 'agent'].includes(role)) return res.status(400).json({ error: 'role must be admin|agent' });
    try {
      const already = (await pool.query(
        'SELECT m.role FROM workspace_members m JOIN users u ON u.id = m.user_id WHERE m.workspace_id=$1 AND u.email=$2',
        [req.workspaceId, email])).rows[0];
      if (already) return res.status(409).json({ error: `already a workspace ${already.role}` });
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const id = rid('inv');
      await pool.query('DELETE FROM workspace_invites WHERE workspace_id=$1 AND email=$2 AND accepted_at IS NULL',
        [req.workspaceId, email]); // one active invite per email
      await pool.query(
        `INSERT INTO workspace_invites (id, workspace_id, email, role, token_hash, created_by, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP + INTERVAL '${INVITE_TTL_DAYS} days')`,
        [id, req.workspaceId, email, role, tokenHash, req.user.id]
      );
      const ws = (await pool.query('SELECT name FROM workspaces WHERE id=$1', [req.workspaceId])).rows[0];
      const acceptUrl = `${frontendBase()}/accept-invite?token=${token}`;
      let delivered = false;
      try {
        const sent = await sendMail({
          to: email,
          subject: `You're invited to ${ws?.name || 'an ORBIT workspace'} on ORBIT`,
          text: `You've been invited to join ${ws?.name || 'an ORBIT workspace'} as ${role}.\n\nAccept within ${INVITE_TTL_DAYS} days (you'll set your own password, nothing to remember from us):\n${acceptUrl}\n\nIf you didn't expect this, ignore this email.`,
        });
        delivered = Boolean(sent?.delivered);
      } catch (err) {
        console.error('[invites] email delivery failed:', err.message);
      }
      res.json({
        invite: { id, email, role, expiresInDays: INVITE_TTL_DAYS, delivered },
        // Manual fallback only when mail didn't deliver (owner forwards it).
        ...(delivered ? {} : { acceptUrl }),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner/admin: list invites (pending + accepted) for the workspace.
  r.get('/api/v1/workspaces/:workspaceId/invites', requireAuth, requireWorkspace, requireRole('owner', 'admin'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, email, role, expires_at, accepted_at, created_at,
                CASE WHEN accepted_at IS NOT NULL THEN 'accepted'
                     WHEN expires_at <= CURRENT_TIMESTAMP THEN 'expired'
                     ELSE 'pending' END AS status
         FROM workspace_invites WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 100`,
        [req.workspaceId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner: revoke a pending invite.
  r.delete('/api/v1/invites/:id', requireAuth, async (req, res) => {
    try {
      const row = (await pool.query('SELECT workspace_id FROM workspace_invites WHERE id=$1', [req.params.id])).rows[0];
      const { workspaceFor } = await import('../auth/middleware.js');
      const wid = workspaceFor(req, row?.workspace_id);
      if (!wid) return res.status(404).json({ error: 'invite not found' });
      const role = (req.user?.memberships || []).find((m) => m.workspace_id === wid)?.role;
      if (role !== 'owner') return res.status(403).json({ error: 'forbidden' });
      await pool.query('DELETE FROM workspace_invites WHERE id=$1', [req.params.id]);
      res.json({ revoked: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: look up an invite by token (powers the accept page).
  r.get('/api/v1/invites/:token', async (req, res) => {
    try {
      const hash = crypto.createHash('sha256').update(String(req.params.token || '')).digest('hex');
      const row = (await pool.query(
        `SELECT i.email, i.role, i.expires_at, i.accepted_at, w.name AS workspace_name
         FROM workspace_invites i JOIN workspaces w ON w.id = i.workspace_id
         WHERE i.token_hash=$1`, [hash])).rows[0];
      if (!row) return res.status(404).json({ error: 'invalid invitation link' });
      if (row.accepted_at) return res.status(410).json({ error: 'invitation already accepted — just sign in' });
      if (new Date(row.expires_at).getTime() < Date.now()) return res.status(410).json({ error: 'invitation expired — ask the owner for a new one' });
      res.json({ email: row.email, role: row.role, workspaceName: row.workspace_name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: accept an invite — set password, join workspace, signed in.
  // Existing users (same email) just gain the membership; everyone lands in
  // a session cookie, same as signup/login.
  r.post('/api/v1/invites/:token/accept', acceptLimit, async (req, res) => {
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim();
    if (!password || password.length < 10) return res.status(400).json({ error: 'password min 10 chars' });
    try {
      const hash = crypto.createHash('sha256').update(String(req.params.token || '')).digest('hex');
      const inv = (await pool.query(
        'SELECT * FROM workspace_invites WHERE token_hash=$1', [hash])).rows[0];
      if (!inv) return res.status(404).json({ error: 'invalid invitation link' });
      if (inv.accepted_at) return res.status(410).json({ error: 'invitation already accepted — just sign in' });
      if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(410).json({ error: 'invitation expired — ask the owner for a new one' });
      let user = (await pool.query('SELECT * FROM users WHERE email=$1', [inv.email])).rows[0];
      if (!user) {
        const id = rid('u');
        await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)',
          [id, inv.email, await bcrypt.hash(password, 12), displayName || inv.email.split('@')[0]]);
        user = { id, email: inv.email };
      } else {
        // Joining member sets their own password on accept.
        await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',
          [await bcrypt.hash(password, 12), user.id]);
      }
      await pool.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [inv.workspace_id, user.id, inv.role]);
      if (displayName) {
        await pool.query('UPDATE users SET display_name=$1 WHERE id=$2 AND (display_name IS NULL OR display_name = SPLIT_PART(email, \'@\', 1))',
          [displayName, user.id]).catch(() => {});
      }
      await pool.query('UPDATE workspace_invites SET accepted_at=CURRENT_TIMESTAMP WHERE id=$1', [inv.id]);
      const { token } = await createSession(pool, user.id);
      res.setHeader('Set-Cookie', sessionCookie(token));
      res.json({ success: true, workspace_id: inv.workspace_id, role: inv.role });
    } catch (err) {
      if (String(err.message).includes('duplicate')) return res.status(409).json({ error: 'email taken' });
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
