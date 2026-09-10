// Generic per-tenant flow provisioner: workspace x channel -> dedicated MicroMind flow.
// Channel configs mirror the trigger/prompt contract of each template:
//   messenger: {senderPsid}/{input} via messengerTrigger (verify default orbit_messenger_2026)
//   instagram: {senderIgsid}/{input} via instagramTrigger (verify default orbit_instagram_verify)
//   whatsapp: {senderWaId}/{input} via whatsappTrigger (per-tenant phoneNumberId injected)
//   telegram: {senderTgId}/{input} via telegramTrigger (botToken NEVER injected — backend owns webhook+send)
//   gmail: manual/BYOF only (per-tenant gmailOAuth2 cannot be provisioned automatically)
// Runtime calls must pass matching overrideConfig.vars so the prompt fills when the
// flow is invoked through the prediction API instead of its own webhook trigger.
//
// SENDING ARCHITECTURE (read before changing): the backend ALWAYS sends replies
// itself via provider APIs (Graph, WhatsApp Cloud, Bot API) using the tenant
// secret from the ORBIT vault, with reply text taken from prediction output.
// Cloned flows must therefore never hold tenant channel secrets and must never
// execute channel send-tools — otherwise customers get double messages and
// tenant tokens leak into MicroMind. buildTenantFlowData enforces this by
// stripping send-tool nodes from agent tool lists (telegram only today;
// messenger/instagram templates are left byte-identical to avoid changing
// currently-working flows).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createChatflow, updateChatflow } from './client.js';
import { ensureTenantFolder } from './folders.js';
import { ensureTenantKey, getKeyRecordId, linkKeyToFlow } from './keys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CHANNELS = {
  messenger: {
    templateFile: 'messenger.json',
    templateVersion: 'v1',
    defaultVerifyToken: 'orbit_messenger_2026',
    sessionPrefix: 'messenger',
    // vars the prediction call must supply for this template's prompt
    runtimeVars: (senderId, text) => ({ senderPsid: senderId, input: text }),
  },
  instagram: {
    templateFile: 'instagram.json',
    templateVersion: 'v1',
    defaultVerifyToken: 'orbit_instagram_verify',
    sessionPrefix: 'instagram',
    runtimeVars: (senderId, text) => ({ senderIgsid: senderId, input: text }),
  },
  // ---- Placeholder slices: wiring exists (BYOF connect, webhooks, senders),
  // but no verified template export yet. provisionChannelFlow throws template_pending.
  // NOTE: gmail stays manual/BYOF permanently — each merchant's gmailOAuth2
  // credential can only be granted by that merchant inside MicroMind GUI.
  whatsapp: {
    templateFile: 'whatsapp.json',
    templateVersion: 'v1-draft',
    defaultVerifyToken: 'orbit_whatsapp_verify',
    sessionPrefix: 'whatsapp',
    runtimeVars: (senderId, text) => ({ senderWaId: senderId, input: text }),
  },
  telegram: {
    templateFile: 'telegram.json',
    templateVersion: 'v1-draft',
    defaultVerifyToken: null, // telegram uses webhook_secret instead
    sessionPrefix: 'telegram',
    runtimeVars: (senderId, text) => ({ senderTgId: senderId, input: text }),
  },
  gmail: {
    templateFile: null,
    placeholder: true,
    templateVersion: 'v0-todo',
    defaultVerifyToken: null,
    sessionPrefix: 'gmail',
    runtimeVars: (senderId, text) => ({ senderGmail: senderId, input: text }),
  },
};

// Tool node names whose instances must be REMOVED from agent tool lists in
// clones (backend owns all sending; see header). Keyed by channel; channels
// absent here keep template tools byte-identical.
const STRIP_SEND_TOOLS = {
  telegram: ['telegramTool', 'telegramBot'],
};

function templatePending(channel) {
  const err = new Error(`No verified ${channel} template yet — connect with micromindFlowId (bring-your-own-flow)`);
  err.code = 'template_pending';
  err.status = 400;
  return err;
}

export function loadTemplate(channel) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  if (cfg.placeholder || !cfg.templateFile) throw templatePending(channel);
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'templates', cfg.templateFile), 'utf8'));
}

// DB-first template load: an uploaded operator export (flow_templates) wins
// over the shipped file, so template updates need no code deploy. Returns
// { template, version, source: 'db' | 'file' }. Throws template_pending when
// neither exists (gmail) — same contract as loadTemplate.
export async function loadTemplateAsync(pool, channel) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  try {
    const row = (await pool.query(
      'SELECT version, status, flow_data FROM flow_templates WHERE channel=$1',
      [channel])).rows[0];
    if (row?.flow_data && (row.status === 'verified' || row.status === 'draft')) {
      return { template: row.flow_data, version: row.version, source: 'db' };
    }
  } catch { /* fall through to file */ }
  if (cfg.placeholder || !cfg.templateFile) throw templatePending(channel);
  return {
    template: JSON.parse(fs.readFileSync(path.join(__dirname, 'templates', cfg.templateFile), 'utf8')),
    version: templateVersionFor(channel),
    source: 'file',
  };
}

// Template registry manifest (templates/manifest.json): version + status per
// channel. Clones record the manifest version at provision time so Admin can
// flag stale clones when an export is updated. Existing clones never
// auto-reclone (badge-only policy).
export function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'templates', 'manifest.json'), 'utf8'));
  } catch {
    return {};
  }
}

export function templateVersionFor(channel) {
  const entry = loadManifest()[channel];
  if (entry?.version) return entry.version;
  return CHANNELS[channel]?.templateVersion || 'v1';
}

// Async variant honoring DB-uploaded templates (for version stamping at provision).
export async function templateVersionForAsync(pool, channel) {
  try {
    const row = (await pool.query('SELECT version FROM flow_templates WHERE channel=$1', [channel])).rows[0];
    if (row?.version) return row.version;
  } catch { /* fall through */ }
  return templateVersionFor(channel);
}

export function templateStatusFor(channel) {
  return loadManifest()[channel]?.status || (CHANNELS[channel]?.placeholder ? 'manual' : 'verified');
}

export function buildTenantFlowData(channel, template, { verifyToken, businessName, aiTone, language, phoneNumberId } = {}) {
  const flow = JSON.parse(JSON.stringify(template));
  const strip = STRIP_SEND_TOOLS[channel] || [];
  for (const node of flow.nodes || []) {
    const inputs = node?.data?.inputs;
    if (!inputs) continue;
    if (String(node.data.name || '').toLowerCase().includes('trigger') && verifyToken && 'verifyToken' in inputs) {
      inputs.verifyToken = verifyToken;
    }
    // WhatsApp: tenant's Phone Number ID goes into the trigger filter.
    if (node.data.name === 'whatsappTrigger' && phoneNumberId && 'phoneNumberId' in inputs) {
      inputs.phoneNumberId = phoneNumberId;
    }
    // Telegram: botToken inputs stay EMPTY by policy — backend registers the
    // webhook and sends via Bot API itself. A token here would let MicroMind
    // hijack the bot's updates away from ORBIT on activation. Strip just in case.
    if (node.data.name === 'telegramTrigger' && 'botToken' in inputs) {
      inputs.botToken = '';
    }
    if (node.data.name === 'telegramBot' && 'botToken' in inputs) {
      inputs.botToken = '';
    }
    // Backend-send policy: remove channel send-tools from agent tool lists so
    // prediction returns text exactly once (no double-send, no token leakage).
    if (node.data.name === 'toolAgent' && Array.isArray(inputs.tools) && strip.length) {
      inputs.tools = inputs.tools.filter(
        (t) => !strip.some((toolName) => String(t).includes(toolName))
      );
    }
    if (node.data.name === 'chatPromptTemplate' && (businessName || aiTone || language)) {
      const ctx = [
        businessName ? `Business: ${businessName}.` : '',
        language ? `Reply in: ${language}.` : '',
        aiTone ? `Tone: ${aiTone}.` : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (ctx && typeof inputs.systemMessagePrompt === 'string') {
        inputs.systemMessagePrompt = `${inputs.systemMessagePrompt}\n\n${ctx}`;
      }
    }
    // Prediction-API contract: an empty human message starves the agent of the
    // question, so default it to {input} (matches whatsapp template pattern).
    if (node.data.name === 'chatPromptTemplate' && typeof inputs.humanMessagePrompt === 'string' && !inputs.humanMessagePrompt.trim()) {
      inputs.humanMessagePrompt = '{input}';
    }
  }
  return flow;
}

export const buildSessionId = (workspaceId, channel, senderId) =>
  `${workspaceId}:${CHANNELS[channel]?.sessionPrefix || channel}:${senderId}`;

export async function provisionChannelFlow(channel, { name, verifyToken, businessName, aiTone, language, phoneNumberId } = {}) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  if (cfg.placeholder) throw templatePending(channel);
  const flowData = buildTenantFlowData(channel, loadTemplate(channel), { verifyToken, businessName, aiTone, language, phoneNumberId });
  return createChatflow({
    name: name || `ORBIT ${channel} - ${businessName || 'workspace'}`,
    flowData: JSON.stringify(flowData),
    deployed: true,
    isPublic: false,
    type: 'CHATFLOW',
  });
}

export async function updateChannelFlow(flowId, patch) {
  return updateChatflow(flowId, patch);
}

// Full zero-touch tenant provisioning: folder -> key -> flow-in-folder + key link.
// pool-backed (persists folder ID, vaults the prediction key, returns everything
// the channel_accounts/micromind_flows rows need). Template-missing channels
// still throw template_pending before any MicroMind call.
export async function provisionTenantChannelFlow(pool, workspaceId, channel,
  { name, verifyToken, businessName, aiTone, language, phoneNumberId } = {}) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  if (cfg.placeholder) throw templatePending(channel);

  const { folderId } = await ensureTenantFolder(pool, workspaceId, businessName);
  const { credentialId } = await ensureTenantKey(pool, workspaceId);
  const { template } = await loadTemplateAsync(pool, channel);
  const flowData = buildTenantFlowData(channel, template, { verifyToken, businessName, aiTone, language, phoneNumberId });
  const flow = await createChatflow({
    name: name || `ORBIT ${channel} - ${businessName || workspaceId}`,
    flowData: JSON.stringify(flowData),
    folderId,
    deployed: true,
    isPublic: false,
    type: 'CHATFLOW',
  });
  if (!flow?.id) throw new Error('provisionTenantChannelFlow: flow creation returned no id');
  const keyRecordId = await getKeyRecordId(pool, credentialId);
  if (keyRecordId) await linkKeyToFlow(flow.id, keyRecordId).catch(() => {});
  return { flow, folderId, credentialId, keyLinked: Boolean(keyRecordId) };
}
