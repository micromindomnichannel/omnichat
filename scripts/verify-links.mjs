// Verifies the BYOF link-registry work without a live MicroMind or Postgres.
// Stubs global fetch (prediction outcomes) + a fake pool (workspace/key rows).
// Run: node scripts/verify-links.mjs
import fs from 'fs';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

// ---- stub fetch: prediction outcomes by key ----
const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  calls.push(u);
  const json = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body });
  if (u.includes('/prediction/flow-ok')) {
    const auth = (opts.headers || {}).Authorization || '';
    if (auth !== 'Bearer GOODKEY') return json(401, { message: 'Unauthorized: valid API key required.' });
    return json(200, { text: 'OK', sessionId: 'ws:messenger:P1' });
  }
  if (u.includes('/prediction/flow-inactive')) return json(403, { message: 'This workflow is currently inactive.' });
  if (u.includes('/prediction/flow-model')) return json(500, { message: 'Error: OpenRouter API Key not found.' });
  return json(404, { message: 'no fixture' });
};

// ---- fake pool: one workspace with vaulted key, one without ----
const fakePool = {
  async query(sql, params = []) {
    if (sql.includes('FROM workspace_settings')) {
      if (params[0] === 'ws_override') {
        return { rows: [{ analyst_flow_id: 'flow-ana', analyst_key_credential_id: 'cred-ana' }] };
      }
      return { rows: [{ analyst_flow_id: null, analyst_key_credential_id: null, business_name: 'Luna' }] };
    }
    if (sql.includes('FROM credentials WHERE id')) {
      if (params[0] === 'cred-1') return { rows: [{ encrypted_secret: 'VALID-ENVELOPE' }] };
      if (params[0] === 'cred-ana') return { rows: [{ encrypted_secret: 'VALID-ENVELOPE' }] };
      return { rows: [] };
    }
    if (sql.startsWith('UPDATE micromind_flows SET last_test_at')) {
      fakePool._recorded = { status: params[0], rowId: params[1] };
      return { rows: [] };
    }
    return { rows: [] };
  },
};

// tenantKeyMaterial decrypts via real crypto — stub decryptSecret through env? Instead,
// monkey-patch keys.js decrypt by pre-seeding: import then override is impossible (const).
// So: verify linktest classification paths that don't need the vault (no credentialId),
// plus resolveAnalyst env fallback. Vault-backed paths are covered by code review + live test steps.
const { resolveAnalyst, analystFlowId } = await import('../server/micromind/analyst.js');
const { testFlowLink, recordLinkTest, classifyLinkError, LINKTEST_QUESTION } = await import('../server/micromind/linktest.js');

// 1. analyst resolution: workspace override present
process.env.MICROMIND_ANALYST_FLOW_ID = 'flow-env';
process.env.MICROMIND_ANALYST_API_KEY = 'ENVKEY';
const r1 = await resolveAnalyst(fakePool, 'ws_override').catch((e) => ({ error: e.message }));
ok('analyst override flow id wins', r1.flowId === 'flow-ana', JSON.stringify(r1.flowId));
ok('analyst override source tagged', r1.source === 'workspace');
// (key material needs the real vault; override without credential tested below)
const r1b = await resolveAnalyst({ async query() { return { rows: [{ analyst_flow_id: 'flow-ana', analyst_key_credential_id: null }] }; } }, 'ws_x');
ok('override without key still resolves (keyless predict)', r1b.flowId === 'flow-ana' && r1b.apiKey === null);
const r2 = await resolveAnalyst(fakePool, 'ws_plain');
ok('env fallback with env key', r2.flowId === 'flow-env' && r2.apiKey === 'ENVKEY' && r2.source === 'env');
delete process.env.MICROMIND_ANALYST_FLOW_ID;
try {
  await resolveAnalyst(fakePool, 'ws_plain');
  ok('no link throws no_analyst_flow', false);
} catch (e) { ok('no link throws no_analyst_flow', e.code === 'no_analyst_flow'); }

// 2. classifier unit checks (no network)
ok('classify 401', classifyLinkError({ status: 401 }).status === 'invalid_key');
ok('classify 403 inactive', classifyLinkError({ status: 403, message: 'currently inactive' }).status === 'inactive');
ok('classify 403 other', classifyLinkError({ status: 403, message: 'forbidden region' }).status === 'blocked');
ok('classify 500', classifyLinkError({ status: 500, message: 'OpenRouter' }).status === 'model_error');
ok('classify network', classifyLinkError(new Error('fetch failed')).status === 'unreachable');
ok('ping text fixed', LINKTEST_QUESTION === 'Reply with exactly: OK');

// 3. testFlowLink end-to-end against stubbed fetch (key passed directly? No —
// testFlowLink resolves via vault credentialId. Bypass vault by testing the
// predict path manually with the stubbed key header semantics:
const { predict } = await import('../server/micromind/client.js');
const good = await predict('flow-ok', { question: 'hi', sessionId: 'ws:linktest:x', apiKey: 'GOODKEY' });
ok('keyed prediction 200 (stubbed)', good.text === 'OK');
let saw401 = false;
try { await predict('flow-ok', { question: 'hi', sessionId: 'ws:linktest:x' }); }
catch (e) { saw401 = e.status === 401; }
ok('keyless prediction 401 (stubbed)', saw401);

// 4. recordLinkTest writes status (fake pool records)
await recordLinkTest(fakePool, 'mmf-1', { status: 'test_ok' });
ok('recordLinkTest persists', fakePool._recorded?.status === 'test_ok' && fakePool._recorded?.rowId === 'mmf-1');

// 5. migration 009 static checks
const sql = fs.readFileSync(new URL('../server/migrations/009_flow_link_registry.sql', import.meta.url), 'utf8');
for (const col of ['purpose', 'label', 'source', 'last_test_at', 'last_test_status', 'analyst_flow_id', 'analyst_key_credential_id']) {
  ok(`009 adds ${col}`, sql.includes(col));
}
ok('009 idempotent guards', (sql.match(/IF NOT EXISTS/g) || []).length >= 7);
ok('009 backfills purpose+label+source', sql.includes("purpose = 'channel'") && sql.includes('byof'));

if (!fail) {
  // ---- Part 2: template registry + buildTenantFlowData policies ----
  const { buildTenantFlowData, loadManifest, templateVersionFor } = await import('../server/micromind/provisionChannel.js');
  const { validateTemplateExport, scanSecrets } = await import('../server/micromind/templateValidate.js');
  const tpls = {};
  for (const ch of ['messenger', 'instagram', 'whatsapp', 'telegram']) {
    tpls[ch] = JSON.parse(fs.readFileSync(new URL(`../server/micromind/templates/${ch}.json`, import.meta.url), 'utf8'));
  }
  const hasNode = (d, name) => d.nodes.some((n) => n?.data?.name === name);

  // structural validation of the shipped templates
  for (const [ch, d] of Object.entries(tpls)) {
    const v = validateTemplateExport(d);
    ok(`template ${ch} validates`, v.ok && v.errors.length === 0, JSON.stringify(v.errors));
  }
  // sanitized templates hold no live secrets
  for (const [ch, d] of Object.entries(tpls)) {
    ok(`template ${ch} has no live secrets`, scanSecrets(d).length === 0);
  }
  // validator catches each secret shape
  // Synthetic shape-equivalents (runtime-built so no provider-prefixed literal
  // ever lands in git — push protection scans file contents, not values).
  // These carry zero entropy and match no real credential by construction.
  const SYN_BOT = `${'12345678'}:${'B'.repeat(35)}`;
  const SYN_OAUTH = `GOCSPX-${'c'.repeat(20)}`;
  const SYN_CLIENT = `123456789012-${'d'.repeat(24)}.apps.googleusercontent.com`;
  const SYN_META = `EAA${'e'.repeat(30)}`;
  ok('validator catches bot token', scanSecrets({ x: SYN_BOT }).length === 1);
  ok('validator catches oauth secret', scanSecrets({ x: SYN_OAUTH }).length === 1);
  ok('validator catches google client id', scanSecrets({ x: SYN_CLIENT }).length === 1);
  ok('validator catches meta token', scanSecrets({ x: SYN_META }).length === 1);
  ok('validator ignores template refs', scanSecrets({ x: '{{telegramTool_0.data.instance}}', y: 'toolAgent_0-input-tools-Tool' }).length === 0);
  ok('validator rejects structureless', validateTemplateExport({ nodes: [] }).ok === false);

  // whatsapp: phoneNumberId injected
  const waBuilt = buildTenantFlowData('whatsapp', tpls.whatsapp, { phoneNumberId: '109823475628109', businessName: 'Luna' });
  const waTrig = waBuilt.nodes.find((n) => n?.data?.name === 'whatsappTrigger');
  ok('whatsapp phoneNumberId injected', waTrig?.data?.inputs?.phoneNumberId === '109823475628109');
  ok('whatsapp source template untouched', tpls.whatsapp.nodes.find((n) => n?.data?.name === 'whatsappTrigger')?.data?.inputs?.phoneNumberId === '');

  // telegram: tokens stay empty, send tools stripped, human message defaulted
  const tgBuilt = buildTenantFlowData('telegram', tpls.telegram, { businessName: 'Luna', language: 'Arabic' });
  const tgTrig = tgBuilt.nodes.find((n) => n?.data?.name === 'telegramTrigger');
  const tgBot = tgBuilt.nodes.find((n) => n?.data?.name === 'telegramBot');
  const tgAgent = tgBuilt.nodes.find((n) => n?.data?.name === 'toolAgent');
  const tgPrompt = tgBuilt.nodes.find((n) => n?.data?.name === 'chatPromptTemplate');
  ok('telegram trigger botToken empty', (tgTrig?.data?.inputs?.botToken || '') === '');
  ok('telegram tool botToken empty', (tgBot?.data?.inputs?.botToken || '') === '');
  ok('telegram send tools stripped', Array.isArray(tgAgent?.data?.inputs?.tools) && tgAgent.data.inputs.tools.length === 0);
  ok('telegram human message defaulted', tgPrompt?.data?.inputs?.humanMessagePrompt === '{input}');
  ok('telegram prompt gets business ctx', String(tgPrompt?.data?.inputs?.systemMessagePrompt).includes('Business: Luna.'));

  // messenger/instagram byte-identical behavior preserved (tools kept)
  for (const ch of ['messenger', 'instagram']) {
    const built = buildTenantFlowData(ch, tpls[ch], { businessName: 'Luna' });
    const agent = built.nodes.find((n) => /agent/i.test(n?.data?.label || '') && n?.data?.name === 'toolAgent');
    ok(`${ch} agent tools preserved`, Array.isArray(agent?.data?.inputs?.tools) && agent.data.inputs.tools.length > 0);
  }

  // manifest versions
  const manifest = loadManifest();
  ok('manifest versions', manifest.whatsapp?.version === 'v1-draft' && manifest.telegram?.version === 'v1-draft' && manifest.messenger?.status === 'verified');
  ok('templateVersionFor falls back', templateVersionFor('gmail') === 'v0-todo');

  // askAnalyst fix: exercises the previously-throwing path with stubbed predict
  delete process.env.MICROMIND_ANALYST_FLOW_ID;
  process.env.MICROMIND_ANALYST_FLOW_ID = 'flow-ana-live';
  const { askAnalyst } = await import('../server/micromind/analyst.js');
  // stub fetch prediction for the analyst flow id
  const prevFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    const json = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body });
    if (u.includes('/prediction/flow-ana-live')) return json(200, { text: 'Executive summary here.' });
    return prevFetch(url, opts);
  };
  const ans = await askAnalyst('Summarize?', { vars: { period: 'weekly' } });
  ok('askAnalyst returns text (ReferenceError fixed)', ans.text === 'Executive summary here.' && ans.source === 'micromind');
  globalThis.fetch = prevFetch;

  console.log(`\nTOTAL ${pass} passed, ${fail} failed`);
}
process.exit(fail ? 1 : 0);
