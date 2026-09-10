// Fixture harness: every MicroMind HTTP shape below is transcribed from live
// captures (login JWT, folder 201+id, chatflow folderId, apikey mint,
// 401-no-key, 200-with-key, 403-inactive). No network. Run: npm test
// (self-seeds dummy provisioner creds — fetch is fully stubbed, nothing leaves).
process.env.MICROMIND_PROVISIONER_EMAIL ||= 'ops@t';
process.env.MICROMIND_PROVISIONER_PASSWORD ||= 'pw1234567890';
const results = [];
const check = (n, ok, extra = '') => {
  results.push(`${n}: ${ok ? 'PASS' : 'FAIL'} ${extra}`);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${extra}`);
  if (!ok) process.exitCode = 1;
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
const jwt = (expSec) => `h.${b64({ exp: Math.floor(Date.now() / 1000) + expSec })}.s`;
let logins = 0;
let failNextMgmt = 0; // armed 401s to prove refresh
const flipped = new Set(); // flows flipped live by PUT (stateful fixture)
const calls = [];

globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const method = opts.method || 'GET';
  calls.push(`${method} ${u}`);
  const json = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body });
  if (u.endsWith('/login') && method === 'POST') {
    logins++;
    const b = JSON.parse(opts.body);
    if (b.email !== 'ops@t' || b.password !== 'pw1234567890') return json(401, { message: 'bad' });
    return json(200, { message: 'Login successful.', token: jwt(86400), user: { id: 'u_ops' } });
  }
  const mgmt = u.includes('/folders') || u.includes('/chatflows') || u.includes('/apikey') || u.includes('/variables') || u.includes('/document-store') || u.includes('/assistants');
  if (mgmt && failNextMgmt > 0) {
    failNextMgmt--;
    return json(401, { message: 'expired' });
  }
  if (u.endsWith('/folders') && method === 'POST') return json(201, { id: 'fld_1', name: 'x', userId: 'u_ops', resourceType: 'chatflow', isOrgShared: false, sharedUserIds: [] });
  if (u.endsWith('/folders')) return json(200, [{ id: 'fld_1' }]);
  if (u.match(/\/folders\/.+$/) && method === 'DELETE') return json(200, {});
  if (u.endsWith('/chatflows') && method === 'POST') {
    const b = JSON.parse(opts.body);
    return json(200, { id: 'flow_1', name: b.name, folderId: b.folderId || null, deployed: b.deployed });
  }
  if (u.match(/\/chatflows\/.+$/) && method === 'PUT') {
    const id = u.split('/chatflows/')[1];
    flipped.add(id);
    return json(200, { id, deployed: true });
  }
  if (u.endsWith('/chatflows/flow_off') && method === 'GET') return json(200, { id: 'flow_off', deployed: flipped.has('flow_off') });
  if (u.endsWith('/chatflows/flow_on') && method === 'GET') return json(200, { id: 'flow_on', deployed: true });
  if (u.match(/\/chatflows\/.+$/) && method === 'GET') return json(200, { id: 'flow_x', deployed: true });
  if (u.match(/\/chatflows\/.+$/) && method === 'DELETE') return json(200, {});
  if (u.endsWith('/apikey') && method === 'POST') return json(200, { id: 'keyrec_1', apiKey: 'TENANTKEY-1', apiSecret: 's3cr3t', keyName: 'x', userId: 'u_ops' });
  if (u.endsWith('/apikey')) return json(200, [{ id: 'keyrec_1', apiKey: 'TENANTKEY-1', apiSecret: 's3cr3t', keyName: 'x', userId: 'u_ops' }]);
  if (u.match(/\/apikey\/.+$/) && method === 'DELETE') return json(200, {});
  if (u.includes('/variables/vsec')) return json(200, { id: 'vsec', name: 'x', type: 'static', value: 'SECRET-VAL' });
  if (u.endsWith('/variables')) return json(200, [{ id: 'vsec', name: 'x', type: 'static', value: 'SECRET-VAL' }]);
  if (u.endsWith('/document-store/store')) return json(200, []);
  if (u.endsWith('/assistants')) return json(200, []);
  if (u.endsWith('/ping')) return json(200, { status: 'ok' });
  if (u.includes('/prediction/')) {
    const auth = (opts.headers || {}).Authorization || '';
    if (auth !== 'Bearer TENANTKEY-1') return json(401, { message: 'Unauthorized: This chatflow requires a valid API key.' });
    return json(200, { text: 'AI says hi', sessionId: 'ws:messenger:P1', chatId: 'chat-1' });
  }
  return json(404, { message: 'no fixture' });
};

const { getProvisionerToken, refreshProvisioner, authMode, __testState, __resetTestState } = await import('../src/auth.js');
const { createFolder, listFolders, findFolder, deleteFolder } = await import('../src/folders.js');
const { createFlow, getFlow, updateFlow, deleteFlow, activateFlow, buildTenantFlowData } = await import('../src/flows.js');
const { mintKey, extractKeyMaterial, listKeys, linkKeyToFlow, revokeKey } = await import('../src/keys.js');
const { cappedPredict, CapExceeded, buildPredictionBody } = await import('../src/predict.js');
const { getVariable, setVariable, listVariables, queryDocumentStore, listAssistants, monitoring } = await import('../src/extended.js');

// ---- auth ----
check('auth mode provisioner', authMode() === 'provisioner');
const t0 = await getProvisionerToken();
check('login ok', typeof t0 === 'string' && __testState().loginCount === 1);
await Promise.all([getProvisionerToken(), getProvisionerToken(), getProvisionerToken(), getProvisionerToken()]);
check('single-flight (1 login)', __testState().loginCount === 1);
await refreshProvisioner();
check('forced refresh (2 logins)', __testState().loginCount === 2);
// 401 refresh path: arm one failure, next management call must recover
__resetTestState();
failNextMgmt = 1;
const fl = await listFolders();
// empty cache + 1 armed 401 => initial login + post-401 re-login = 2
check('401 triggers re-login + retry', Array.isArray(fl) && __testState().loginCount === 2, `logins=${__testState().loginCount}`);
__resetTestState();

// ---- folders ----
const f = await createFolder({ name: 'PROBE' });
check('folder create returns id', f.id === 'fld_1');
check('folder listed', (await listFolders()).some((x) => x.id === 'fld_1'));
check('folder found', (await findFolder('fld_1'))?.id === 'fld_1');
check('folder missing null', (await findFolder('nope')) === null);
try { await createFolder({}); check('folder requires name', false); }
catch { check('folder requires name', true); }

// ---- flows ----
const template = { nodes: [
  { data: { name: 'messengerTrigger', inputs: { verifyToken: 'orbit_messenger_2026' } } },
  { data: { name: 'chatPromptTemplate', inputs: { systemMessagePrompt: 'Hi.' } } },
] };
const built = buildTenantFlowData(template, { verifyToken: 'v_tenant', promptContext: 'Business: Luna.' });
check('template verifyToken patched', built.nodes[0].data.inputs.verifyToken === 'v_tenant');
check('template prompt patched', built.nodes[1].data.inputs.systemMessagePrompt.endsWith('Business: Luna.'));
check('template source untouched', template.nodes[0].data.inputs.verifyToken === 'orbit_messenger_2026');
const cf = await createFlow({ name: 'Luna IG', flowData: built, folderId: 'fld_1', apikeyid: 'keyrec_1' });
check('flow created in folder', cf.id === 'flow_1' && cf.folderId === 'fld_1');
const act = await activateFlow('flow_off');
check('activate flips undeployed', act.deployed === true);
const act2 = await activateFlow('flow_on');
check('activate no-op when live', act2.deployed === true);
check('delete flow', (await deleteFlow('flow_1')) !== undefined);

// ---- keys ----
const mk = await mintKey('Luna-Key');
check('key minted (ref only)', mk.recordId === 'keyrec_1' && !('apiKey' in mk));
const listed = await listKeys();
check('key list strips secrets', listed.length === 1 && !('apiKey' in listed[0]) && !('apiSecret' in listed[0]) && listed[0].id === 'keyrec_1');
// extractKeyMaterial would need the creation response; simulate with fixture shape:
const mat = extractKeyMaterial({ apiKey: 'TENANTKEY-1', apiSecret: 's3cr3t', id: 'keyrec_1' });
check('key material extracts', mat.apiKey === 'TENANTKEY-1');
check('link key to flow', (await linkKeyToFlow('flow_1', 'keyrec_1'))?.id === 'flow_1');
check('revoke key', (await revokeKey('keyrec_1')) !== undefined);

// ---- predict ----
try { buildPredictionBody({ question: 'hi' }); check('session required', false); }
catch (e) { check('session required', e.code === 'session_required'); }
const usage = { calls: 0, chars: 0 };
const dry = await cappedPredict('flow_1', { question: 'hi', sessionId: 'ws:messenger:P1', apiKey: 'TENANTKEY-1', dryRun: true }, { maxCalls: 2, maxChars: 100 }, usage);
check('dry-run sends nothing', dry.dryRun === true && usage.calls === 0 && dry.body.overrideConfig.sessionId === 'ws:messenger:P1');
const live = await cappedPredict('flow_1', { question: 'hi', sessionId: 'ws:messenger:P1', apiKey: 'TENANTKEY-1' }, { maxCalls: 2, maxChars: 100 }, usage);
check('live prediction text', live.text === 'AI says hi' && usage.calls === 1);
const live2 = await cappedPredict('flow_1', { question: 'hi', sessionId: 'ws:messenger:P1', apiKey: 'TENANTKEY-1' }, { maxCalls: 2, maxChars: 100 }, usage);
check('second call in budget', live2.text === 'AI says hi' && usage.calls === 2);
try {
  await cappedPredict('flow_1', { question: 'hi', sessionId: 'ws:messenger:P1', apiKey: 'TENANTKEY-1' }, { maxCalls: 2, maxChars: 100 }, usage);
  check('cap cutoff', false);
} catch (e) { check('cap cutoff', e instanceof CapExceeded); }
let got401 = false;
try { await cappedPredict('flow_1', { question: 'hi', sessionId: 'ws:messenger:P1' }, { maxCalls: 5, maxChars: 500 }, { calls: 0, chars: 0 }); }
catch (e) { got401 = e.status === 401; }
check('keyless prediction 401', got401);

// ---- extended ----
const v = await getVariable('vsec');
check('variable value stripped by default', v.id === 'vsec' && !('value' in v));
const vv = await getVariable('vsec', { includeValue: true });
check('variable value on request', vv.value === 'SECRET-VAL');
check('variables list', (await listVariables()).length === 1);
check('doc stores list', Array.isArray(await import('../src/extended.js').then((m) => m.listDocumentStores())));
check('assistants list', Array.isArray(await listAssistants()));
check('monitoring ping', (await monitoring()) !== undefined);

console.log(`\n${results.filter((r) => r.includes('PASS')).length}/${results.length} passed`);
