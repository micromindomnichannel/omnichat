// Server-side sessions. The cookie holds a random token; only its SHA-256 is
// stored (a DB read never yields a usable session). httpOnly + SameSite cookies
// keep XSS from stealing sessions. Set COOKIE_SAMESITE=None (+HTTPS) when the
// frontend is cross-site (e.g. Vercel app + VPS API).
import crypto from 'crypto';

const SESSION_DAYS = 7;
export const COOKIE_NAME = 'orbit_session';
const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(pool, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await pool.query('INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)',
    [rid('ses'), userId, hashToken(token), expires]);
  return { token, expires };
}

export async function destroySession(pool, token) {
  if (!token) return;
  await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
}

export async function getSessionUser(pool, token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [hashToken(token)]
  );
  if (!rows.length) return null;
  const mem = await pool.query('SELECT workspace_id, role FROM workspace_members WHERE user_id=$1', [rows[0].id]);
  return { ...rows[0], memberships: mem.rows };
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token, expires) {
  const secure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === '1';
  const sameSite = process.env.COOKIE_SAMESITE || (secure ? 'None' : 'Lax');
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${SESSION_DAYS * 86400}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
