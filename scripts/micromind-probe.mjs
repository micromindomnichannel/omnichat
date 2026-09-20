// P0 MicroMind verification probe. Usage:
//   node scripts/micromind-probe.mjs
//   (adds management CRUD checks when MICROMIND_PROVISIONER_EMAIL/PASSWORD
//   or MICROMIND_API_KEY is set — reads .env automatically)
// Reads MICROMIND_BASE_URL / MICROMIND_API_KEY from env.
import dotenv from 'dotenv';
dotenv.config();
const { getChatflow, createChatflow, updateChatflow, deleteChatflow, predict, config } =
  await import('../server/micromind/client.js');
const { authMode } = await import('../server/micromind/provisioner.js');

const REFERENCE_FLOW_ID = process.env.MICROMIND_MESSENGER_FLOW_ID || 'f4a7c66d-dc4c-4f0b-b12d-4b6ca91fe0c8';
const results = [];
const ok = (name, detail) => results.push({ name, status: 'PASS', detail });
const fail = (name, detail) => results.push({ name, status: 'FAIL', detail });

// 1. Runtime prediction against the reference Messenger flow.
try {
  const out = await predict(REFERENCE_FLOW_ID, { question: 'Hey, how are you?' });
  ok('prediction', `flow ${REFERENCE_FLOW_ID} replied: ${JSON.stringify(out).slice(0, 200)}`);
} catch (e) {
  fail('prediction', e.message);
}

// 2. Management CRUD — requires provisioner login or MICROMIND_API_KEY.
if (authMode() !== 'none') {
  try {
    const created = await createChatflow({ name: 'ORBIT P0 probe - DELETE ME', flowData: JSON.stringify({ nodes: [], edges: [] }), deployed: false, type: 'CHATFLOW' });
    ok('createFlow', `id=${created.id}`);
    const got = await getChatflow(created.id);
    ok('getFlow', `name=${got.name}`);
    await updateChatflow(created.id, { name: 'ORBIT P0 probe - updated' });
    ok('updateFlow', 'renamed');
    await deleteChatflow(created.id);
    ok('deleteFlow', 'removed');
  } catch (e) {
    fail('management-crud', e.message);
  }
} else {
  results.push({ name: 'management-crud', status: 'SKIP', detail: 'no provisioner creds or MICROMIND_API_KEY; prediction-only run' });
  try {
    await getChatflow(REFERENCE_FLOW_ID);
    ok('getFlow-unauth', 'management GET reachable without key');
  } catch (e) {
    fail('getFlow-unauth', e.message);
  }
}

console.log(JSON.stringify({ baseUrl: config.baseUrl, results }, null, 2));
if (results.some((r) => r.status === 'FAIL')) process.exitCode = 1;
