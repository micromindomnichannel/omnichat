// Template export validation for operator uploads (admin template registry).
// Pure function — no network, no DB. Returns { ok, errors[], hits[] }.
// Structural: non-empty nodes + trigger + agent + model + memory present.
// Prompt style is open: v1 templates use chatPromptTemplate; v2 (Dood reference)
// drives the agent via its own systemMessage — either satisfies the contract
// because business context injection (buildTenantFlowData) handles both.
// Secrets: known live-secret shapes anywhere in string values, skipping
// Flowise template references ({{...}}, .data.instance, -*-input-/output- ids).
const SECRET_SHAPES = [
  { name: 'telegram-bot-token', re: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { name: 'google-oauth-secret', re: /GOCSPX-[A-Za-z0-9_-]{10,}/ },
  { name: 'google-client-id', re: /\b\d+-[A-Za-z0-9]+\.apps\.googleusercontent\.com\b/ },
  { name: 'meta-token', re: /\bEAA[A-Za-z0-9]{20,}\b/ },
  { name: 'openrouter-key', re: /\bsk-or-v1-[A-Za-z0-9]{10,}\b/ },
];

function isTemplateRef(s) {
  return s.includes('{{') || s.includes('.data.instance') || s.includes('-input-') || s.includes('-output-');
}

export function scanSecrets(flow) {
  const hits = [];
  const walk = (o, trail) => {
    if (typeof o === 'string') {
      if (isTemplateRef(o)) return;
      for (const { name, re } of SECRET_SHAPES) {
        if (re.test(o)) { hits.push({ shape: name, at: trail, preview: `${o.slice(0, 24)}…` }); break; }
      }
    } else if (Array.isArray(o)) {
      o.forEach((v, i) => walk(v, `${trail}[${i}]`));
    } else if (o && typeof o === 'object') {
      Object.entries(o).forEach(([k, v]) => walk(v, trail ? `${trail}.${k}` : k));
    }
  };
  walk(flow, 'flowData');
  return hits;
}

export function validateTemplateExport(flow) {
  const errors = [];
  if (!flow || !Array.isArray(flow.nodes) || !flow.nodes.length) {
    return { ok: false, errors: ['flowData must be a flow export object with a non-empty nodes array'], hits: [] };
  }
  const names = flow.nodes.map((n) => String(n?.data?.name || ''));
  const lower = names.map((n) => n.toLowerCase());
  if (!lower.some((n) => n.includes('trigger'))) errors.push('missing trigger node');
  if (!names.includes('chatPromptTemplate') && !lower.some((n) => n.includes('agent'))) {
    errors.push('missing prompt contract (chatPromptTemplate or agent systemMessage)');
  }
  if (!lower.some((n) => n.includes('agent'))) errors.push('missing agent node');
  if (!lower.some((n) => n.includes('chat') || n.includes('llm') || n.includes('model'))) errors.push('missing model node');
  if (!lower.some((n) => n.includes('memory'))) errors.push('missing memory node');
  const hits = scanSecrets(flow);
  return { ok: errors.length === 0 && hits.length === 0, errors, hits };
}
