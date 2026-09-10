// Connect-time link validation: sends the fixed harmless ping through a linked
// flow and maps the outcome to a stable status. Never throws — always returns
// a result object so connect/rotate flows can record it without failing.
// Status vocabulary: test_ok | invalid_key | inactive | model_error | unreachable.
import { predict } from './client.js';
import { tenantKeyMaterial } from './keys.js';

export const LINKTEST_QUESTION = 'Reply with exactly: OK';

export function classifyLinkError(err) {
  const status = err?.status;
  const msg = String(err?.message || '');
  if (status === 401) return { status: 'invalid_key', detail: 'prediction key rejected (401)' };
  if (status === 403) {
    return /inactive/i.test(msg)
      ? { status: 'inactive', detail: 'flow is inactive — flip ACTIVE in MicroMind' }
      : { status: 'blocked', detail: msg.slice(0, 200) };
  }
  if (status === 500) return { status: 'model_error', detail: msg.slice(0, 200) };
  return { status: 'unreachable', detail: msg.slice(0, 200) || 'network/model error' };
}

export async function testFlowLink(pool, { flowId, credentialId, workspaceId, purpose = 'channel' }) {
  const started = Date.now();
  if (!flowId) return { ok: false, status: 'no_flow', detail: 'no flow linked', latencyMs: 0 };
  let apiKey = null;
  try {
    if (credentialId) apiKey = await tenantKeyMaterial(pool, credentialId).catch(() => null);
  } catch { /* treat as keyless below */ }
  try {
    const out = await predict(flowId, {
      question: LINKTEST_QUESTION,
      sessionId: `${workspaceId}:linktest:${purpose}:${Date.now()}`,
      apiKey,
    });
    const text = String(out?.text || out?.json?.answer || '').trim();
    return { ok: true, status: 'test_ok', latencyMs: Date.now() - started, replyPreview: text.slice(0, 120) };
  } catch (err) {
    return { ok: false, ...classifyLinkError(err), latencyMs: Date.now() - started };
  }
}

export async function recordLinkTest(pool, flowRowId, result) {
  try {
    await pool.query(
      'UPDATE micromind_flows SET last_test_at=CURRENT_TIMESTAMP, last_test_status=$1 WHERE id=$2',
      [result.status, flowRowId]
    );
  } catch { /* observability must never break the request */ }
}
