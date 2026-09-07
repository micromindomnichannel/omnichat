// Generic MicroMind gateway for every NON-channel AI feature:
// executive-report insights, knowledge-base answers, and anything else that
// needs reasoning over workspace data. Channel replies use predict() directly
// with their own flows; everything else funnels through here so the website has
// exactly ONE AI integration point with ONE fallback contract.
//
// Flow resolution: MICROMIND_ANALYST_FLOW_ID (dedicated analyst flow — create
// one in MicroMind when ready) falls back to MICROMIND_MESSENGER_FLOW_ID
// (works for Q&A once its OpenRouter credential is fixed).
// When MicroMind is unreachable/misconfigured, callers MUST fall back to local
// logic — never 500 an AI feature because the model is down.
import { predict, config } from './client.js';

export function analystFlowId() {
  return process.env.MICROMIND_ANALYST_FLOW_ID || process.env.MICROMIND_MESSENGER_FLOW_ID || null;
}

export function analystConfigured() {
  return Boolean(analystFlowId());
}

// Low-level ask: returns { text, source: 'micromind' }. Throws on any failure
// (missing flow id, network, model 500) so callers can apply their fallback.
// The shared analyst flow is key-enforced: pass MICROMIND_ANALYST_API_KEY
// (one key linked to the analyst flow) or requests 401.
export async function askAnalyst(question, { vars, sessionId, history } = {}) {
  const flowId = analystFlowId();
  if (!flowId) {
    const err = new Error('askAnalyst: no analyst flow configured (MICROMIND_ANALYST_FLOW_ID)');
    err.code = 'no_analyst_flow';
    throw err;
  }
  const out = await predict(flowId, {
    question,
    sessionId: sessionId || `default:analyst:${Date.now()}`,
    vars,
    history,
    apiKey: process.env.MICROMIND_ANALYST_API_KEY || undefined,
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
