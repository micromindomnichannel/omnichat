// Auth endpoints. Registration is OPEN only while zero users exist (bootstrap);
// afterwards accounts are created by owners via POST /api/v1/admin/users.
// Login is rate-limited (anti-brute-force). Sessions are httpOnly cookies.
import express from 'express';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSessionUser, parseCookies, sessionCookie, clearSessionCookie, COOKIE_NAME } from './sessions.js';
import { rateLimit } from '../middleware/rateLimit.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginLimit = rateLimit({ windowMs: 60_000, max: 10 });

export function authRouter(pool) {
  const r = express.Router();

  r.post('/api/auth/signup', async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password = req.body?.password;
    const displayName = req.body?.displayName;
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'valid email required' });
    if (!password || String(password).length < 10) return res.status(400).json({ error: 'password min 10 chars' });
    try {
      const count = await pool.query('SELECT COUNT(*)::int AS n FROM users');
      const first = count.rows[0].n === 0;
      if (!first) return res.status(403).json({ code: 'registration_closed', error: 'Ask a workspace owner for an account' });
      const id = rid('u');
      const hash = await bcrypt.hash(String(password), 12);
      await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)',
        [id, email.toLowerCase(), hash, displayName || email.split('@')[0]]);
      // First user owns the default workspace.
      await pool.query(
        "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('default',$1,'owner') ON CONFLICT DO NOTHING", [id]);
      const { token, expires } = await createSession(pool, id);
      res.setHeader('Set-Cookie', sessionCookie(token, expires));
      res.json({ user: { id, email: email.toLowerCase() }, memberships: [{ workspace_id: 'default', role: 'owner' }] });
    } catch (err) {
      if (String(err.message).includes('duplicate')) return res.status(409).json({ error: 'email taken' });
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/auth/login', loginLimit, async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'email + password required' });
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [String(email).toLowerCase()]);
      const user = rows[0];
      if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
        return res.status(401).json({ error: 'invalid credentials' });
      }
      const { token, expires } = await createSession(pool, user.id);
      const mem = await pool.query('SELECT workspace_id, role FROM workspace_members WHERE user_id=$1', [user.id]);
      res.setHeader('Set-Cookie', sessionCookie(token, expires));
      res.json({ user: { id: user.id, email: user.email, display_name: user.display_name }, memberships: mem.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/auth/logout', async (req, res) => {
    await destroySession(pool, parseCookies(req)[COOKIE_NAME]).catch(() => {});
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.json({ success: true });
  });

  r.get('/api/auth/me', async (req, res) => {
    try {
      const user = await getSessionUser(pool, parseCookies(req)[COOKIE_NAME]);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      res.json({ user: { id: user.id, email: user.email, display_name: user.display_name }, memberships: user.memberships });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Self-service password reset. Always returns ok (no account enumeration).
  // Delivery: SMTP_* env sends the link; otherwise the token is server-logged
  // for DEV ONLY (set ALLOW_DEBUG_RESET=1 to also return it — never in prod).
  r.post('/api/auth/forgot', rateLimit({ windowMs: 60_000, max: 5 }), async (req, res) => {
    const { email } = req.body || {};
    try {
      if (email) {
        const user = (await pool.query('SELECT id FROM users WHERE email=$1', [String(email).toLowerCase()])).rows[0];
        if (user) {
          const crypto = (await import('crypto')).default;
          const token = crypto.randomBytes(32).toString('hex');
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          await pool.query(
            "INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3, CURRENT_TIMESTAMP + INTERVAL '1 hour')",
            [`pr_${Date.now()}`, user.id, hash]
          );
          if (process.env.SMTP_HOST) {
            console.log(`[auth] password reset for ${email} (SMTP not wired to a mailer yet — token withheld)`);
          } else {
            console.log(`[auth] DEV-ONLY password reset token for ${email}: ${token}`);
          }
          if (process.env.ALLOW_DEBUG_RESET === '1') return res.json({ success: true, debugToken: token });
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/auth/reset', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password || String(password).length < 10) {
      return res.status(400).json({ error: 'token + 10-char password required' });
    }
    try {
      const crypto = (await import('crypto')).default;
      const hash = crypto.createHash('sha256').update(String(token)).digest('hex');
      const row = (await pool.query(
        'SELECT * FROM password_resets WHERE token_hash=$1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL',
        [hash])).rows[0];
      if (!row) return res.status(400).json({ error: 'invalid or expired token' });
      await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',
        [await bcrypt.hash(String(password), 12), row.user_id]);
      await pool.query('UPDATE password_resets SET used_at=CURRENT_TIMESTAMP WHERE id=$1', [row.id]);
      await pool.query('DELETE FROM sessions WHERE user_id=$1', [row.user_id]); // log out everywhere
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
