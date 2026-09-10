import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const child = spawn('node', [path.join(__dirname, '..', 'src', 'server.js')], {
  env: { ...process.env, MICROMIND_BASE_URL: 'http://127.0.0.1:9' },
  stdio: ['pipe', 'pipe', 'pipe'],
});
child.stderr.on('data', (d) => process.stderr.write(`[srv-err] ${d}`));

let buf = '';
const pending = new Map();
let nextId = 1;
child.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch { /* ignore */ }
  }
});

function send(msg) {
  return new Promise((resolve) => {
    pending.set(msg.id, resolve);
    child.stdin.write(JSON.stringify(msg) + '\n');
  });
}
const call = (id, method, params = {}) => send({ jsonrpc: '2.0', id, method, params });

const results = [];
const check = (n, ok, extra = '') => {
  results.push(`${n}: ${ok ? 'PASS' : 'FAIL'} ${extra}`);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${extra}`);
};

await call(1, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } });
check('initialize', true);
const tools = await call(2, 'tools/list');
const names = (tools.result?.tools || []).map((t) => t.name);
check('tools registered (22)', names.length === 22, `got=${names.length}`);
for (const need of ['micromind_health', 'micromind_create_folder', 'micromind_clone_flow', 'micromind_mint_key', 'micromind_predict', 'micromind_delete_flow', 'micromind_revoke_key']) {
  check(`tool ${need}`, names.includes(need));
}
// destructive gate without spawning network: missing confirm must fail locally
const del = await call(3, 'tools/call', { name: 'micromind_delete_flow', arguments: { id: 'flow_1' } });
check('delete without CONFIRM rejected', del.result?.isError === true);
// health (no network needed in none mode)
const h = await call(4, 'tools/call', { name: 'micromind_health', arguments: {} });
check('health tool', h.result && !h.result.isError, JSON.stringify(h.result?.content?.[0]?.text || '').slice(0, 80));

child.kill();
setTimeout(() => process.exit(results.some((r) => r.includes('FAIL')) ? 1 : 0), 500);
