// Prediction keys: POST /apikey {keyName} -> {id, apiKey, apiSecret, ...}
// (verified live, member-mintable, user-bound). One key per tenant, linked to
// that tenant's flows via apikeyid. INVARIANT: key VALUES never leave this
// module except toward the API or an explicitly approved vault write — tool
// outputs carry references (record ids) only.
import { api } from './http.js';
import { updateFlow } from './flows.js';

export async function mintKey(keyName) {
  if (!keyName) throw new Error('mintKey: keyName required');
  const created = await api('POST', '/apikey', { keyName });
  if (!created?.apiKey || !created?.id) throw new Error('mintKey: response carried no apiKey/id');
  return { recordId: created.id, keyName: created.keyName || keyName };
}

// Extract key material for vaulting. CALLERS MUST treat the result as a live
// secret: encrypt immediately, never log, never return through tools.
export function extractKeyMaterial(created) {
  if (!created?.apiKey) throw new Error('extractKeyMaterial: no apiKey in creation response');
  return { apiKey: created.apiKey, apiSecret: created.apiSecret || null, recordId: created.id || null };
}

export async function listKeys() {
  const res = await api('GET', '/apikey');
  const rows = Array.isArray(res) ? res : res?.data || [];
  // Strip secrets at the boundary: tool-visible rows carry metadata only.
  return rows.map((k) => ({ id: k.id, keyName: k.keyName, userId: k.userId || null, updatedDate: k.updatedDate || null }));
}

export async function linkKeyToFlow(flowId, keyRecordId) {
  if (!flowId || !keyRecordId) throw new Error('linkKeyToFlow: flowId + keyRecordId required');
  return updateFlow(flowId, { apikeyid: keyRecordId });
}

export async function revokeKey(recordId) {
  if (!recordId) throw new Error('revokeKey: recordId required');
  return api('DELETE', `/apikey/${recordId}`);
}
