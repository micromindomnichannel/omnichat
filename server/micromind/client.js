// ORBIT MicroMind client — backend-to-MicroMind only. Never import from frontend.
// Covers P0 management APIs (chatflow + credential CRUD) and runtime prediction,
// verified against C:\MicroMind-Doc swagger + the reference Messenger flow.

const BASE_URL = (process.env.MICROMIND_BASE_URL || 'https://core.aimicromind.com/api/v1').replace(/\/$/, '');
const API_KEY = process.env.MICROMIND_API_KEY || '';

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  if (API_KEY) h.Authorization = `Bearer ${API_KEY}`;
  return h;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`MicroMind ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- Chatflow CRUD (P0) ----
export const createChatflow = (payload) => request('POST', '/chatflows', payload);
export const getChatflow = (id) => request('GET', `/chatflows/${id}`);
export const updateChatflow = (id, payload) => request('PUT', `/chatflows/${id}`, payload);
export const deleteChatflow = (id) => request('DELETE', `/chatflows/${id}`);

// ---- Credential CRUD (P0) ----
export const createCredential = (payload) => request('POST', '/credentials', payload);
export const getCredential = (id) => request('GET', `/credentials/${id}`);
export const updateCredential = (id, payload) => request('PUT', `/credentials/${id}`, payload);
export const deleteCredential = (id) => request('DELETE', `/credentials/${id}`);

// ---- Runtime prediction ----
// sessionId MUST be deterministic per tenant+channel+customer:
//   `${workspaceId}:messenger:${senderPsid}` — never rely on Buffer Memory random id.
// vars inject per-workspace business context (must be allow-listed in
// Chatflow Configuration -> Security for override to take effect).
export async function predict(chatflowId, { question, sessionId, vars, history } = {}) {
  const overrideConfig = {};
  if (sessionId) overrideConfig.sessionId = sessionId;
  if (vars) overrideConfig.vars = vars;
  const body = { question };
  if (Object.keys(overrideConfig).length) body.overrideConfig = overrideConfig;
  if (history) body.history = history;
  return request('POST', `/prediction/${chatflowId}`, body);
}

export const config = { get baseUrl() { return BASE_URL; }, hasApiKey: () => Boolean(API_KEY) };
