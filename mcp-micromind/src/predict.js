// Capped predictions. Policy (locked):
// - Runs ONLY on the user's explicit ask per invocation (enforced by the tool
//   layer, which requires confirmation before calling).
// - Every call requires a spending cap: { maxCalls, maxChars }.
// - sessionId MUST be deterministic (workspace:channel:sender or an explicit
//   test id). Random/omitted sessionIds are rejected — an unscoped call would
//   mint orphan memory on the platform.
// - dryRun:true returns the exact request that WOULD be sent, sending nothing.
import { predictRaw } from './http.js';

export class CapExceeded extends Error {
  constructor(what, limit) {
    super(`Prediction cap exceeded: ${what} limit ${limit}`);
    this.code = 'cap_exceeded';
  }
}

export function buildPredictionBody({ question, sessionId, vars, history }) {
  if (!question) throw new Error('prediction: question required');
  if (!sessionId) {
    const err = new Error('prediction: deterministic sessionId required (refusing random memory)');
    err.code = 'session_required';
    throw err;
  }
  const overrideConfig = { sessionId };
  if (vars) overrideConfig.vars = vars;
  const body = { question, overrideConfig };
  if (history) body.history = history;
  return body;
}

// Run one capped prediction. usage = { calls, chars } accumulated by the caller
// across the user's approved budget; mutated in place. Returns { text, usage,
// capped } — capped:true means the budget ran out BEFORE sending.
export async function cappedPredict(flowId, opts, cap, usage) {
  const { question, sessionId, vars, history, apiKey, dryRun = false } = opts || {};
  const maxCalls = cap?.maxCalls ?? 1;
  const maxChars = cap?.maxChars ?? 4000;
  usage.calls = usage.calls || 0;
  usage.chars = usage.chars || 0;
  if (usage.calls >= maxCalls) throw new CapExceeded('calls', maxCalls);
  const body = buildPredictionBody({ question, sessionId, vars, history });
  if (dryRun) return { dryRun: true, flowId, body, keyed: Boolean(apiKey), usage };
  const out = await predictRaw(flowId, body, apiKey);
  usage.calls += 1;
  const text = String(out?.text || out?.json?.answer || '');
  usage.chars += text.length;
  if (usage.chars > maxChars) throw new CapExceeded('chars', maxChars);
  return { text, sessionId: out?.sessionId || sessionId, chatId: out?.chatId || null, usage, capped: false };
}
