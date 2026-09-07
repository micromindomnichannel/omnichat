// Generic per-tenant flow provisioner: workspace x channel -> dedicated MicroMind flow.
// Channel configs mirror the trigger/prompt contract of each template:
//   messenger: {senderPsid}/{input} via messengerTrigger (verify default orbit_messenger_2026)
//   instagram: {senderIgsid}/{input} via instagramTrigger (verify default orbit_instagram_verify)
// Runtime calls must pass matching overrideConfig.vars so the prompt fills when the
// flow is invoked through the prediction API instead of its own webhook trigger.
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
  whatsapp: {
    templateFile: null,
    placeholder: true,
    templateVersion: 'v0-todo',
    defaultVerifyToken: 'orbit_whatsapp_verify',
    sessionPrefix: 'whatsapp',
    runtimeVars: (senderId, text) => ({ senderWaId: senderId, input: text }),
  },
  telegram: {
    templateFile: null,
    placeholder: true,
    templateVersion: 'v0-todo',
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

export function buildTenantFlowData(channel, template, { verifyToken, businessName, aiTone, language } = {}) {
  const flow = JSON.parse(JSON.stringify(template));
  for (const node of flow.nodes || []) {
    const inputs = node?.data?.inputs;
    if (!inputs) continue;
    if (String(node.data.name || '').toLowerCase().includes('trigger') && verifyToken && 'verifyToken' in inputs) {
      inputs.verifyToken = verifyToken;
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
  }
  return flow;
}

export const buildSessionId = (workspaceId, channel, senderId) =>
  `${workspaceId}:${CHANNELS[channel]?.sessionPrefix || channel}:${senderId}`;

export async function provisionChannelFlow(channel, { name, verifyToken, businessName, aiTone, language } = {}) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  if (cfg.placeholder) throw templatePending(channel);
  const flowData = buildTenantFlowData(channel, loadTemplate(channel), { verifyToken, businessName, aiTone, language });
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
  { name, verifyToken, businessName, aiTone, language } = {}) {
  const cfg = CHANNELS[channel];
  if (!cfg) throw new Error(`Unknown channel for provisioning: ${channel}`);
  if (cfg.placeholder) throw templatePending(channel);

  const { folderId } = await ensureTenantFolder(pool, workspaceId, businessName);
  const { credentialId } = await ensureTenantKey(pool, workspaceId);
  const flowData = buildTenantFlowData(channel, loadTemplate(channel), { verifyToken, businessName, aiTone, language });
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
