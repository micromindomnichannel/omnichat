// Generic MicroMind gateway for every NON-channel AI feature:
// executive-report insights, knowledge-base answers, and anything else that
// needs reasoning over workspace data. Channel replies use predict() directly
// with their own flows; everything else funnels through here so the website has
// exactly ONE AI integration point with ONE fallback contract.
//
// Flow resolution (BYOF-everything model):
//   1. Per-workspace override: workspace_settings.analyst_flow_id +
//      analyst_key_credential_id (vaulted tenant key). Set when a workspace
//      links its own analyst flow; NULL = not overridden.
//   2. Shared env link: MICROMIND_ANALYST_FLOW_ID + MICROMIND_ANALYST_API_KEY.
//   3. Legacy fallback: MICROMIND_MESSENGER_FLOW_ID (no key).
// When MicroMind is unreachable/misconfigured, callers MUST fall back to local
// logic — never 500 an AI feature because the model is down.
import { predict, config } from './client.js';
import { tenantKeyMaterial } from './keys.js';

export function analystFlowId() {
  return process.env.MICROMIND_ANALYST_FLOW_ID || process.env.MICROMIND_MESSENGER_FLOW_ID || null;
}

export function analystConfigured() {
  return Boolean(analystFlowId());
}

// Resolve the analyst link for a workspace: per-workspace override first,
// shared env link second. Returns { flowId, apiKey, source } or throws
// no_analyst_flow. apiKey is live material (use immediately, never persist
// outside the vault or return through APIs).
export async function resolveAnalyst(pool, workspaceId) {
  try {
    const row = (await pool.query(
      'SELECT analyst_flow_id, analyst_key_credential_id FROM workspace_settings WHERE workspace_id=$1',
      [workspaceId])).rows[0];
    if (row?.analyst_flow_id) {
      const apiKey = row.analyst_key_credential_id
        ? await tenantKeyMaterial(pool, row.analyst_key_credential_id).catch(() => null)
        : null;
      return { flowId: row.analyst_flow_id, apiKey, source: 'workspace' };
    }
  } catch { /* fall through to env link */ }
  const flowId = analystFlowId();
  if (!flowId) {
    const err = new Error('askAnalyst: no analyst flow configured (link one per workspace or set MICROMIND_ANALYST_FLOW_ID)');
    err.code = 'no_analyst_flow';
    throw err;
  }
  return { flowId, apiKey: process.env.MICROMIND_ANALYST_API_KEY || undefined, source: 'env' };
}

// Low-level ask: returns { text, source: 'micromind' }. Throws on any failure
// (missing flow id, network, model 500) so callers can apply their fallback.
// Pass pool + workspaceId to use the workspace analyst override; without them
// the shared env link is used (back-compat for existing callers).
export async function askAnalyst(question, { pool = null, workspaceId = null, vars, sessionId, history } = {}) {
  let flowId;
  let apiKey;
  if (pool && workspaceId) {
    const resolved = await resolveAnalyst(pool, workspaceId);
    flowId = resolved.flowId;
    apiKey = resolved.apiKey;
  } else {
    flowId = analystFlowId();
    if (!flowId) {
      const err = new Error('askAnalyst: no analyst flow configured (MICROMIND_ANALYST_FLOW_ID)');
      err.code = 'no_analyst_flow';
      throw err;
    }
    apiKey = process.env.MICROMIND_ANALYST_API_KEY || undefined;
  }
  const out = await predict(flowId, {
    question,
    sessionId: sessionId || `${workspaceId || 'default'}:analyst:${Date.now()}`,
    vars,
    history,
    apiKey,
  });
  const text = String(out?.text || out?.json?.answer || '').trim();
  if (!text) {
    const err = new Error('askAnalyst: empty model response');
    err.code = 'empty_response';
    throw err;
  }
  return { text, source: 'micromind', flowId };
}

export function analystStatus() {
  return { configured: analystConfigured(), baseUrl: config.baseUrl, flowId: analystFlowId() };
}
