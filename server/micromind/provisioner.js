// Provisioner identity: the backend logs into MicroMind as the ops account
// (omni Channel) and holds the JWT, refreshing automatically.
// Verified live: POST /api/v1/login {email,password} -> 200 {token (24h JWT), user}.
// If no provisioner email is configured, falls back to the static
// MICROMIND_API_KEY token, then to unauthenticated (open instances).
import { config as clientConfig } from './client.js';

const EMAIL = process.env.MICROMIND_PROVISIONER_EMAIL || '';
const PASSWORD = process.env.MICROMIND_PROVISIONER_PASSWORD || '';
const STATIC_KEY = process.env.MICROMIND_API_KEY || '';

let cached = null; // { token, expMs }
let inflight = null;

function decodeExpMs(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64').toString('utf8'));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

async function doLogin() {
  const res = await fetch(`${clientConfig.baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const err = new Error(`MicroMind provisioner login -> ${res.status}`);
    err.status = res.status;
    throw err;
  }
  cached = { token: data.token, expMs: decodeExpMs(data.token) || Date.now() + 23 * 3600_000 };
  return cached.token;
}

// Single-flight login: concurrent 401s trigger exactly one re-login.
export async function getProvisionerToken({ force = false } = {}) {
  if (!EMAIL || !PASSWORD) return null;
  if (!force && cached && cached.expMs - 60_000 > Date.now()) return cached.token;
  if (!inflight) {
    inflight = doLogin().finally(() => { inflight = null; });
  }
  return inflight;
}

export async function refreshProvisioner() {
  cached = null;
  return getProvisionerToken();
}

// Management-call headers: provisioner JWT > static key > none.
export async function getManagementHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = await getProvisionerToken().catch(() => null);
  if (token) h.Authorization = `Bearer ${token}`;
  else if (STATIC_KEY) h.Authorization = `Bearer ${STATIC_KEY}`;
  return h;
}

export function authMode() {
  if (EMAIL && PASSWORD) return 'provisioner';
  if (STATIC_KEY) return 'static';
  return 'none';
}
