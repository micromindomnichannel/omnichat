// Extended reads (+ safe writes): document stores, variables, assistants,
// analytics. Endpoints follow the documented REST shapes; all calls are
// management-authenticated. Variable VALUES are treated as sensitive as keys:
// reads return metadata by default, values only on explicit request.
import { api } from './http.js';

export async function listDocumentStores() {
  const res = await api('GET', '/document-store/store');
  return Array.isArray(res) ? res : res?.data || [];
}

export async function queryDocumentStore(id, { query, k = 4 } = {}) {
  if (!id || !query) throw new Error('queryDocumentStore: id + query required');
  return api('POST', '/document-store/vectorstore/query', { id, query, k });
}

export async function listVariables() {
  const res = await api('GET', '/variables');
  const rows = Array.isArray(res) ? res : res?.data || [];
  return rows.map((v) => ({ id: v.id, name: v.name, type: v.type || null }));
}

export async function getVariable(id, { includeValue = false } = {}) {
  if (!id) throw new Error('getVariable: id required');
  const v = await api('GET', `/variables/${id}`);
  if (!v || typeof v !== 'object') return v;
  if (!includeValue) {
    const { value, ...meta } = v;
    return meta;
  }
  return v;
}

export async function setVariable(id, value) {
  if (!id) throw new Error('setVariable: id required');
  return api('PUT', `/variables/${id}`, { value });
}

export async function listAssistants() {
  const res = await api('GET', '/assistants');
  return Array.isArray(res) ? res : res?.data || [];
}

export async function getAssistant(id) {
  if (!id) throw new Error('getAssistant: id required');
  return api('GET', `/assistants/${id}`);
}

// Monitoring reads. Exact analytics endpoints vary by deployment; failures
// surface as errors (never fabricated numbers).
export async function monitoring({ path = '/ping' } = {}) {
  return api('GET', path);
}
