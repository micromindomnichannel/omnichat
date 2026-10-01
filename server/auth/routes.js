// Auth endpoints. Registration is OPEN only while zero users exist (bootstrap);
// afterwards accounts are created by owners via POST /api/v1/admin/users.
// First-time signup requires email OTP verification (request-code -> verify).
// Login is rate-limited (anti-brute-force). Sessions are httpOnly cookies.
import express from 'express';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSessionUser, parseCookies, sessionCookie, clearSessionCookie, COOKIE_NAME } from './sessions.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { sendMail, mailConfigured } from '../mailer.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginLimit = rateLimit({ windowMs: 60_000, max: 10 });
const otpRequestLimit = rateLimit({ windowMs: 60_000, max: 5 });
const otpVerifyLimit = rateLimit({ windowMs: 60_000, max: 10 });

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const newOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

export function authRouter(pool) {
  const r = express.Router();

  // Step 1: validate + create a pending OTP row + email the 6-digit code.
  // Stores the bcrypt-hashed password now so verify needs only email+code.
  r.post('/api/auth/signup/request-code', otpRequestLimit, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    const displayName = req.body?.displayName;
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'valid email required' });
    if (!password || String(password).length < 10) return res.status(400).json({ error: 'password min 10 chars' });
    try {
      const taken = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
      if (taken.rows.length) return res.status(409).json({ error: 'email taken' });
      const crypto = (await import('crypto')).default;
      const code = newOtpCode();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      await pool.query('DELETE FROM signup_otps WHERE email=$1', [email]); // one active row per email
      await pool.query(
        `INSERT INTO signup_otps (id, email, code_hash, password_hash, display_name, expires_at)
         VALUES ($1,$2,$3,$4,$5, CURRENT_TIMESTAMP + INTERVAL '${OTP_TTL_MIN} minutes')`,
        [`otp_${crypto.randomUUID()}`, email, codeHash, await bcrypt.hash(String(password), 12), displayName || email.split('@')[0]]
      );
      const debugOtp = process.env.ALLOW_DEBUG_OTP === '1';
      const sent = debugOtp ? { delivered: false, debugOnly: true } : await sendMail({
        to: email,
        subject: 'Your ORBIT verification code',
        text: `Your ORBIT verification code is: ${code}\nIt expires in ${OTP_TTL_MIN} minutes. If you did not request this, ignore this email.`,
      });
      const out = { success: true, expiresInSec: OTP_TTL_MIN * 60, delivered: sent.delivered };
      if (debugOtp) out.debugCode = code;
      res.json(out);
    } catch (err) {
      if (String(err?.message || '').startsWith('Email delivery failed')) {
        return res.status(503).json({
          code: 'email_delivery_failed',
          error: 'Verification email could not be sent. Check the email service configuration and try again.',
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Step 2: verify code -> create user (+owner if first) -> session cookie.
  r.post('/api/auth/signup/verify', otpVerifyLimit, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    if (!email || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'email + 6-digit code required' });
    try {
      const row = (await pool.query(
        'SELECT * FROM signup_otps WHERE email=$1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
        [email])).rows[0];
      if (!row) return res.status(400).json({ error: 'no pending verification for this email — request a new code' });
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ error: 'code expired — request a new one' });
      }
      if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
        return res.status(429).json({ error: 'too many attempts — request a new code' });
      }
      const crypto = (await import('crypto')).default;
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      if (codeHash !== row.code_hash) {
        await pool.query('UPDATE signup_otps SET attempts = attempts + 1 WHERE id=$1', [row.id]);
        return res.status(400).json({ error: 'incorrect code' });
      }
      const id = rid('u');
      const workspaceId = rid('ws');
      await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4)',
        [id, email, row.password_hash, row.display_name || email.split('@')[0]]);
      // Self-service signups receive an isolated workspace. The legacy
      // default workspace remains available to existing owner-managed users.
      await pool.query(
        'INSERT INTO workspaces (id, name, plan) VALUES ($1,$2,$3)',
        [workspaceId, `${row.display_name || email.split('@')[0]} Workspace`, 'pro']);
      await pool.query(
        `INSERT INTO workspace_settings (workspace_id, business_name)
         VALUES ($1,$2) ON CONFLICT (workspace_id) DO NOTHING`,
        [workspaceId, row.display_name || 'ORBIT Omnichannel Business']);
      await pool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [workspaceId, id, 'owner']);
      await pool.query('UPDATE signup_otps SET used_at=CURRENT_TIMESTAMP WHERE id=$1', [row.id]);
      await pool.query('DELETE FROM signup_otps WHERE email=$1 AND id<>$2', [email, row.id]);
      const { token, expires } = await createSession(pool, id);
      res.setHeader('Set-Cookie', sessionCookie(token));
      res.json({ user: { id, email }, memberships: [{ workspace_id: workspaceId, role: 'owner' }] });
    } catch (err) {
      if (String(err.message).includes('duplicate')) return res.status(409).json({ error: 'email taken' });
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy single-step signup removed (410 Gone) — email OTP is mandatory.
  // Kept as an explicit tombstone so old bundles fail loudly, not silently.
  r.post('/api/auth/signup', async (_req, res) => {
    res.status(410).json({ error: 'signup moved to email verification', flow: ['POST /api/auth/signup/request-code', 'POST /api/auth/signup/verify'] });
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
      res.setHeader('Set-Cookie', sessionCookie(token));
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

  // Self-service account deletion. Removes the user, all their sessions,
  // memberships, and reset artifacts. Workspace/business/channel data is
  // SHARED tenant property and is deliberately left intact (an ownerless
  // workspace keeps running for remaining members; last-human-out cleanup is
  // an explicit admin action, not a side effect). Returns 401 without session.
  r.delete('/api/auth/account', async (req, res) => {
    try {
      const user = await getSessionUser(pool, parseCookies(req)[COOKIE_NAME]);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      await pool.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
      await pool.query('DELETE FROM workspace_members WHERE user_id=$1', [user.id]);
      await pool.query('DELETE FROM password_resets WHERE user_id=$1', [user.id]);
      await pool.query('DELETE FROM users WHERE id=$1', [user.id]);
      res.setHeader('Set-Cookie', clearSessionCookie());
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/auth/reset', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {    const { token, password } = req.body || {};
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
