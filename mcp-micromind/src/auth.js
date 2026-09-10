// Provisioner identity for the MCP server (mirrors the ORBIT backend pattern).
// POST /api/v1/login {email,password} -> 200 {token (~24h JWT)}.
// Cached with 60s skew, single-flight login, explicit refresh on 401.
// Falls back to static MICROMIND_API_KEY when no provisioner email is set.
// NOTE: this module performs its own fetch and never imports http.js (cycle).
import { BASE_URL, PROVISIONER_EMAIL as EMAIL, PROVISIONER_PASSWORD as PASSWORD, STATIC_KEY } from './config.js';

let cached = null; // { token, expMs }
let inflight = null;
let loginCount = 0; // observable for tests

function decodeExpMs(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64').toString('utf8'));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

async function doLogin() {
  const res = await fetch(`${BASE_URL}/login`, {
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
  loginCount++;
  cached = { token: data.token, expMs: decodeExpMs(data.token) || Date.now() + 23 * 3600_000 };
  return cached.token;
}

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

export async function getManagementHeaders() {
  const h = {};
  const token = await getProvisionerToken().catch(() => null);
  if (token) h.Authorization = `Bearer ${token}`;
  else if (STATIC_KEY) h.Authorization = `Bearer ${STATIC_KEY}`;
  return h;
}

export function cachedAuthHeader() {
  if (cached && cached.expMs - 60_000 > Date.now()) return { Authorization: `Bearer ${cached.token}` };
  if (STATIC_KEY) return { Authorization: `Bearer ${STATIC_KEY}` };
  return null;
}

export function isProvisionerConfigured() {
  return Boolean(EMAIL && PASSWORD);
}

export function authMode() {
  if (EMAIL && PASSWORD) return 'provisioner';
  if (STATIC_KEY) return 'static';
  return 'none';
}

export function __testState() {
  return { loginCount, hasCached: Boolean(cached) };
}

export function __resetTestState() {
  cached = null;
  inflight = null;
  loginCount = 0;
}
