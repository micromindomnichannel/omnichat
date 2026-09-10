// MCP server: full user power over MicroMind with tiered confirmations.
// Transport: stdio (registered in the host's opencode.json).
// Tiers: read = free; write = requires the user's explicit ask (agent policy);
// destructive + secret writes = require confirm:'CONFIRM' IN THE CALL.
// First live prediction to any flow requires a dryRun preview first (enforced
// in code, per-process). All writes append to audit.log.jsonl. Secrets (keys,
// tokens, passwords, variable values) are redacted from every output.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMode, getProvisionerToken } from './auth.js';
import { createFolder, listFolders, findFolder, deleteFolder } from './folders.js';
import { createFlow, getFlow, updateFlow, deleteFlow, activateFlow, buildTenantFlowData } from './flows.js';
import { mintKey, extractKeyMaterial, listKeys, linkKeyToFlow, revokeKey } from './keys.js';
import { cappedPredict } from './predict.js';
import { listDocumentStores, queryDocumentStore, listVariables, getVariable, setVariable, listAssistants, monitoring } from './extended.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_FILE = process.env.MM_AUDIT_FILE || path.join(__dirname, '..', 'audit.log.jsonl');
const previewedFlows = new Set();

const SECRET_KEYS = new Set(['apiKey', 'apiSecret', 'token', 'password', 'secret', 'value']);
function redact(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SECRET_KEYS.has(k) ? '[REDACTED]' : redact(v);
  }
  return out;
}

function audit(tool, args, result) {
  const line = JSON.stringify({
    ts: new Date().toISOString(), tool, args: redact(args),
    ok: !(result instanceof Error), result: result instanceof Error ? result.message : undefined,
  });
  fs.appendFile(AUDIT_FILE, line + '\n', () => {});
}

function requireConfirm(args) {
  if (args?.confirm !== 'CONFIRM') {
    const err = new Error(`${args?.__tool || 'tool'}: destructive action requires confirm:'CONFIRM' in the call`);
    err.code = 'confirm_required';
    throw err;
  }
}

const server = new McpServer({ name: 'mcp-micromind', version: '1.0.0' });

// ---------- read tier ----------
server.tool('micromind_health', 'Auth mode, provisioner reachability (login test), no secrets.', {},
  async () => {
    const mode = authMode();
    let login = 'skipped';
    if (mode === 'provisioner') {
      try {
        await getProvisionerToken();
        login = 'ok';
      } catch (e) {
        login = `failed: ${e.message}`;
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify({ mode, login }) }] };
  });

server.tool('micromind_list_folders', 'List MicroMind folders (id, name, owner — no secrets).', {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(await listFolders()) }] }));

server.tool('micromind_list_flows', 'List chatflows. Best-effort: falls back to a clear error where unexposed.',
  { folderId: z.string().optional().describe('Filter to a folder id when supported') },
  async ({ folderId }) => {
    try {
      const { api } = await import('./http.js');
      const res = await api('GET', '/chatflows');
      const rows = Array.isArray(res) ? res : res?.data || [];
      const out = folderId ? rows.filter((f) => f.folderId === folderId) : rows;
      return { content: [{ type: 'text', text: JSON.stringify(out.map((f) => ({ id: f.id, name: f.name, folderId: f.folderId || null, deployed: !!f.deployed }))) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `list_flows unavailable: ${e.message}` }], isError: true };
    }
  });

server.tool('micromind_get_flow', 'Get one flow by id (metadata + structure summary).',
  { id: z.string().describe('Flow id') },
  async ({ id }) => {
    const f = await getFlow(id);
    const summary = {
      id: f.id, name: f.name, folderId: f.folderId || null, deployed: !!f.deployed,
      isPublic: !!f.isPublic, type: f.type || null,
      nodes: (f.flowData ? JSON.parse(typeof f.flowData === 'string' ? f.flowData : '{}') : {}).nodes?.map?.((n) => n?.data?.name).filter(Boolean) || [],
    };
    return { content: [{ type: 'text', text: JSON.stringify(summary) }] };
  });

server.tool('micromind_list_keys', 'List prediction keys (metadata only — values never shown).', {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(await listKeys()) }] }));

server.tool('micromind_list_variables', 'List variables (names/types only).', {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(await listVariables()) }] }));

server.tool('micromind_get_variable', 'Get variable metadata; value only with includeValue:true (user-determined).',
  { id: z.string(), includeValue: z.boolean().optional() },
  async ({ id, includeValue }) => ({ content: [{ type: 'text', text: JSON.stringify(await getVariable(id, { includeValue: !!includeValue })) }] }));

server.tool('micromind_list_assistants', 'List assistants.', {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(await listAssistants()) }] }));

server.tool('micromind_list_document_stores', 'List document stores.', {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(await listDocumentStores()) }] }));

server.tool('micromind_monitoring', 'Read-only platform check (default: ping).',
  { path: z.string().optional() },
  async ({ path }) => ({ content: [{ type: 'text', text: JSON.stringify(await monitoring({ path: path || '/ping' })) }] }));

// ---------- write tier (user ask required by policy) ----------
function write(name, desc, shape, fn) {
  server.tool(name, desc, shape, async (args) => {
    try {
      const result = await fn(args);
      audit(name, args, result);
      return { content: [{ type: 'text', text: JSON.stringify(redact(result)) }] };
    } catch (e) {
      audit(name, args, e);
      return { content: [{ type: 'text', text: `error: ${e.message}` }], isError: true };
    }
  });
}

write('micromind_create_folder', 'Create a tenant folder. Returns id for folderId use.',
  { name: z.string(), description: z.string().optional() },
  ({ name, description }) => createFolder({ name, description }));

write('micromind_clone_flow', 'Create a flow from a template object with tenant patches (verifyToken, promptContext), folderId, deployed=true, optional apikeyid.',
  {
    name: z.string(), template: z.any().describe('Exported flow JSON object ({nodes, edges})'),
    folderId: z.string().nullable().optional(), verifyToken: z.string().optional(),
    promptContext: z.string().optional(), apikeyid: z.string().optional(),
  },
  ({ name, template, folderId, verifyToken, promptContext, apikeyid }) =>
    createFlow({ name, flowData: buildTenantFlowData(template, { verifyToken, promptContext }), folderId, deployed: true, apikeyid }));

write('micromind_update_flow', 'PATCH a flow (e.g. rename, flip deployed). Prefer activateFlow for activation.',
  { id: z.string(), patch: z.any() },
  ({ id, patch }) => updateFlow(id, patch));

write('micromind_activate_flow', 'Ensure a flow is deployed: GET-assert, PUT flip once, re-assert. Throws activation_failed if it sticks.',
  { id: z.string() },
  ({ id }) => activateFlow(id));

write('micromind_mint_key', 'Mint a per-tenant prediction key. Returns the RECORD id only — the value goes straight to the approved vault write, never to chat.',
  { keyName: z.string() },
  async ({ keyName }) => mintKey(keyName));

write('micromind_link_key', 'Link a key record to a flow (apikeyid) so predictions enforce it.',
  { flowId: z.string(), keyRecordId: z.string() },
  ({ flowId, keyRecordId }) => linkKeyToFlow(flowId, keyRecordId));

write('micromind_set_variable', 'Set a variable value (user-determined; value redacted from output).',
  { id: z.string(), value: z.string() },
  async ({ id, value }) => {
    await setVariable(id, value);
    return { id, updated: true };
  });

write('micromind_predict', 'Capped prediction. Requires: explicit user ask (policy), cap {maxCalls,maxChars}, deterministic sessionId. First live send per flow requires dryRun:true preview first (enforced). apiKey = tenant flow key (never displayed).',
  {
    flowId: z.string(), question: z.string(), sessionId: z.string(),
    vars: z.any().optional(), apiKey: z.string().optional().describe('Tenant flow key — redacted everywhere'),
    cap: z.object({ maxCalls: z.number(), maxChars: z.number() }),
    dryRun: z.boolean().optional(),
  },
  async ({ flowId, question, sessionId, vars, apiKey, cap, dryRun }) => {
    if (!dryRun && !previewedFlows.has(flowId)) {
      const err = new Error(`micromind_predict: dryRun preview required before first live send to flow ${flowId}`);
      err.code = 'preview_required';
      throw err;
    }
    const bucket = budgetFor(flowId);
    if (!dryRun) {
      if (bucket.calls >= cap.maxCalls) {
        const err = new Error(`Prediction cap exceeded: calls limit ${cap.maxCalls} for flow ${flowId}`);
        err.code = 'cap_exceeded';
        throw err;
      }
      if (bucket.chars >= cap.maxChars) {
        const err = new Error(`Prediction cap exceeded: chars limit ${cap.maxChars} for flow ${flowId}`);
        err.code = 'cap_exceeded';
        throw err;
      }
    }
    const out = await cappedPredict(flowId, { question, sessionId, vars, apiKey, dryRun: !!dryRun }, cap, bucket);
    if (dryRun) previewedFlows.add(flowId);
    return { ...out, budget: { ...bucket } };
  });

write('micromind_query_documents', 'Semantic query against a document store.',
  { id: z.string(), query: z.string(), k: z.number().optional() },
  ({ id, query, k }) => queryDocumentStore(id, { query, k }));

// ---------- destructive tier (confirm:'CONFIRM' enforced in code) ----------
const budgets = new Map(); // flowId -> { calls, chars }: running spend per flow

function budgetFor(flowId) {
  if (!budgets.has(flowId)) budgets.set(flowId, { calls: 0, chars: 0 });
  return budgets.get(flowId);
}

write('micromind_delete_flow', 'DESTRUCTIVE: delete a flow. Requires confirm:"CONFIRM".',
  { id: z.string(), confirm: z.string() },
  (args) => { requireConfirm({ ...args, __tool: 'micromind_delete_flow' }); return deleteFlow(args.id).then(() => ({ id: args.id, deleted: true })); });

write('micromind_revoke_key', 'DESTRUCTIVE: delete a prediction key record. Linked flows stop accepting predictions. Requires confirm:"CONFIRM".',
  { recordId: z.string(), confirm: z.string() },
  (args) => { requireConfirm({ ...args, __tool: 'micromind_revoke_key' }); return revokeKey(args.recordId).then(() => ({ recordId: args.recordId, revoked: true })); });

write('micromind_delete_folder', 'DESTRUCTIVE: delete a folder. Requires confirm:"CONFIRM".',
  { id: z.string(), confirm: z.string() },
  (args) => { requireConfirm({ ...args, __tool: 'micromind_delete_folder' }); return deleteFolder(args.id).then(() => ({ id: args.id, deleted: true })); });

const transport = new StdioServerTransport();
await server.connect(transport);
