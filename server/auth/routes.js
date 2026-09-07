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
    const { email, password, displayName } = req.body || {};
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
    const { email, password } = req.body || {};
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

  return r;
}
