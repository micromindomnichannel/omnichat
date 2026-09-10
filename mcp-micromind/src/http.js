// Shared MicroMind HTTP layer for the MCP server.
// Management calls carry the provisioner JWT (auto-refreshed, single-flight),
// else static MICROMIND_API_KEY, else none. Prediction calls carry a per-call
// Bearer key supplied by the caller (tenant flow key). Secrets never logged.
import { getManagementHeaders, refreshProvisioner } from './auth.js';
import { BASE_URL } from './config.js';

export class MicroMindError extends Error {
  constructor(method, path, status, data) {
    super(`MicroMind ${method} ${path} -> ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function raw(method, path, headers, body) {
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
    data = { raw: String(text).slice(0, 500) };
  }
  if (!res.ok) throw new MicroMindError(method, path, res.status, data);
  return data;
}

// Management request with one transparent retry after provisioner re-login.
export async function api(method, path, body) {
  try {
    return await raw(method, path, await getManagementHeaders(), body);
  } catch (err) {
    if (err.status !== 401) throw err;
    await refreshProvisioner().catch(() => {});
    return raw(method, path, await getManagementHeaders(), body);
  }
}

// Prediction request with an explicit per-call key (or none for open flows).
// No refresh retry: flow keys don't refresh; 401/403 surface to the caller.
export async function predictRaw(flowId, body, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return raw('POST', `/prediction/${flowId}`, headers, body);
}
