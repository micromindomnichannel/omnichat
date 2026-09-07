// Per-tenant prediction keys: one key per ORBIT workspace, linked to that
// tenant's flows via apikeyid, vaulted in credentials (provider
// 'micromind_prediction') like every other secret — never returned by any API.
// Verified live: member-mintable (POST /apikey), key enforced on prediction
// (401 without, 200 with). Blast radius of a leak = one tenant.
import { createApiKey, deleteApiKey, updateChatflow } from './client.js';
import { encryptSecret, decryptSecret } from '../credentials/crypto.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const PROVIDER = 'micromind_prediction';

function packKey(apiKey, apiSecret) {
  return encryptSecret(JSON.stringify({ apiKey, apiSecret: apiSecret || null }));
}

export function unpackKey(envelope) {
  try {
    const o = JSON.parse(decryptSecret(envelope));
    return { apiKey: o.apiKey, apiSecret: o.apiSecret || null };
  } catch {
    return { apiKey: null, apiSecret: null };
  }
}

// Resolve-or-mint the tenant key. Returns the VAULT credential id (never the key).
export async function ensureTenantKey(pool, workspaceId, label) {
  const existing = (await pool.query(
    'SELECT id FROM credentials WHERE workspace_id=$1 AND provider=$2 ORDER BY created_at DESC LIMIT 1',
    [workspaceId, PROVIDER])).rows[0];
  if (existing) return { credentialId: existing.id, created: false };
  const created = await createApiKey(label || `ORBIT tenant - ${workspaceId}`);
  if (!created?.apiKey) throw new Error('ensureTenantKey: key creation returned no apiKey');
  const credentialId = rid('cred');
  await pool.query(
    'INSERT INTO credentials (id, workspace_id, provider, encrypted_secret, metadata) VALUES ($1,$2,$3,$4,$5)',
    [credentialId, workspaceId, PROVIDER, packKey(created.apiKey, created.apiSecret),
     JSON.stringify({ keyId: created.id, keyName: created.keyName || null })]
  );
  return { credentialId, created: true };
}

// MicroMind key RECORD id for a vault credential (needed for apikeyid linking).
export async function getKeyRecordId(pool, credentialId) {
  if (!credentialId) return null;
  const row = (await pool.query('SELECT metadata FROM credentials WHERE id=$1', [credentialId])).rows[0];
  return row?.metadata?.keyId || null;
}
export async function tenantKeyMaterial(pool, credentialId) {
  if (!credentialId) return null;
  const row = (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [credentialId])).rows[0];
  if (!row) return null;
  const { apiKey } = unpackKey(row.encrypted_secret);
  return apiKey || null;
}

// Link a key (by MicroMind key RECORD id) to a flow so prediction enforces it.
export async function linkKeyToFlow(flowId, keyRecordId) {
  return updateChatflow(flowId, { apikeyid: keyRecordId });
}

// Full revoke: MicroMind-side delete + vault row delete. Flows linked to the
// key stop accepting predictions until relinked (by design).
export async function revokeTenantKey(pool, workspaceId, credentialId) {
  const row = (await pool.query(
    'SELECT id, metadata FROM credentials WHERE id=$1 AND workspace_id=$2 AND provider=$3',
    [credentialId, workspaceId, PROVIDER])).rows[0];
  if (!row) return { revoked: false };
  const keyId = row.metadata?.keyId;
  if (keyId) await deleteApiKey(keyId).catch(() => {});
  await pool.query('DELETE FROM credentials WHERE id=$1', [credentialId]);
  return { revoked: true };
}
