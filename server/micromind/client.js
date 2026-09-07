// ORBIT MicroMind client — backend-to-MicroMind only. Never import from frontend.
// Management APIs (chatflow/credential/folder/key CRUD) authenticate via the
// provisioner identity (server/micromind/provisioner.js): provisioner JWT,
// else static MICROMIND_API_KEY, else none. Expired tokens re-login once + retry.
// Runtime prediction authenticates with the FLOW's key (per-tenant, vaulted in
// ORBIT): enforced flows 401 without it; open flows ignore the header.
import { getManagementHeaders, refreshProvisioner } from './provisioner.js';

const BASE_URL = (process.env.MICROMIND_BASE_URL || 'https://core.aimicromind.com/api/v1').replace(/\/$/, '');

async function rawRequest(method, path, headers, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
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

// Management request: retry once after provisioner re-login on 401.
async function request(method, path, body) {
  try {
    return await rawRequest(method, path, await getManagementHeaders(), body);
  } catch (err) {
    if (err.status !== 401) throw err;
    await refreshProvisioner().catch(() => {});
    return rawRequest(method, path, await getManagementHeaders(), body);
  }
}

// ---- Chatflow CRUD ----
export const createChatflow = (payload) => request('POST', '/chatflows', payload);
export const getChatflow = (id) => request('GET', `/chatflows/${id}`);
export const updateChatflow = (id, payload) => request('PUT', `/chatflows/${id}`, payload);
export const deleteChatflow = (id) => request('DELETE', `/chatflows/${id}`);

// ---- Credential CRUD ----
export const createCredential = (payload) => request('POST', '/credentials', payload);
export const getCredential = (id) => request('GET', `/credentials/${id}`);
export const updateCredential = (id, payload) => request('PUT', `/credentials/${id}`, payload);
export const deleteCredential = (id) => request('DELETE', `/credentials/${id}`);

// ---- Folder CRUD (verified live: POST /api/v1/folders -> 201 + {id}) ----
export const createFolder = (payload) => request('POST', '/folders', payload);
export const listFolders = () => request('GET', '/folders');
export const deleteFolder = (id) => request('DELETE', `/folders/${id}`);

// ---- Prediction API keys (verified live: member-mintable, user-bound) ----
export const createApiKey = (keyName) => request('POST', '/apikey', { keyName });
export const listApiKeys = () => request('GET', '/apikey');
export const deleteApiKey = (id) => request('DELETE', `/apikey/${id}`);

// ---- Runtime prediction ----
// sessionId MUST be deterministic per tenant+channel+customer:
//   `${workspaceId}:${channel}:${senderId}` — never rely on Buffer Memory random id.
// vars inject per-workspace business context (must be allow-listed in
// Chatflow Configuration -> Security for override to take effect).
// apiKey = the flow's prediction key (per-tenant, from the ORBIT vault).
// Enforced flows 401 without it; open flows ignore the header. No refresh
// retry here — tenant keys don't refresh; surface 401/403 to the caller.
export async function predict(chatflowId, { question, sessionId, vars, history, apiKey } = {}) {
  const overrideConfig = {};
  if (sessionId) overrideConfig.sessionId = sessionId;
  if (vars) overrideConfig.vars = vars;
  const body = { question };
  if (Object.keys(overrideConfig).length) body.overrideConfig = overrideConfig;
  if (history) body.history = history;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return rawRequest('POST', `/prediction/${chatflowId}`, headers, body);
}

export const config = {
  get baseUrl() { return BASE_URL; },
  hasApiKey: () => Boolean(process.env.MICROMIND_API_KEY),
};
