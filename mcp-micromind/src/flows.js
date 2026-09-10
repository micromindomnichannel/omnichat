// Flows: CRUD + clone-from-template + activation, all folder-aware.
// Creation contract (verified live): POST /chatflows accepts
// {name, flowData (stringified), folderId, deployed, isPublic, type}.
// Prediction-key linkage rides along as `apikeyid` (key record id).
import { api } from './http.js';

export async function createFlow({ name, flowData, folderId = null, deployed = true, apikeyid = null }) {
  if (!name) throw new Error('createFlow: name required');
  if (!flowData) throw new Error('createFlow: flowData required');
  const created = await api('POST', '/chatflows', {
    name,
    flowData: typeof flowData === 'string' ? flowData : JSON.stringify(flowData),
    ...(folderId ? { folderId } : {}),
    deployed,
    isPublic: false,
    ...(apikeyid ? { apikeyid } : {}),
    type: 'CHATFLOW',
  });
  if (!created?.id) throw new Error('createFlow: response carried no id');
  return created;
}

export async function getFlow(id) {
  if (!id) throw new Error('getFlow: id required');
  return api('GET', `/chatflows/${id}`);
}

export async function updateFlow(id, patch) {
  if (!id) throw new Error('updateFlow: id required');
  return api('PUT', `/chatflows/${id}`, patch || {});
}

export async function deleteFlow(id) {
  if (!id) throw new Error('deleteFlow: id required');
  return api('DELETE', `/chatflows/${id}`);
}

// Activation-assert: GET the flow; if not deployed, PUT the flip once and
// re-check. Returns { id, deployed } or throws activation_failed (never silent).
export async function activateFlow(id) {
  const flow = await getFlow(id);
  if (flow?.deployed) return { id, deployed: true };
  await updateFlow(id, { deployed: true });
  const again = await getFlow(id);
  if (!again?.deployed) {
    const err = new Error(`activateFlow: flow ${id} still not deployed after flip`);
    err.code = 'activation_failed';
    throw err;
  }
  return { id, deployed: true };
}

// Clone a template object with tenant patches (pure — no API calls).
// Supported patches: verifyToken (any *Trigger with the input),
// promptContext (appended to chatPromptTemplate system message).
export function buildTenantFlowData(template, { verifyToken, promptContext } = {}) {
  const flow = JSON.parse(JSON.stringify(template));
  for (const node of flow.nodes || []) {
    const inputs = node?.data?.inputs;
    if (!inputs) continue;
    if (String(node.data.name || '').toLowerCase().includes('trigger') && verifyToken && 'verifyToken' in inputs) {
      inputs.verifyToken = verifyToken;
    }
    if (node.data.name === 'chatPromptTemplate' && promptContext && typeof inputs.systemMessagePrompt === 'string') {
      inputs.systemMessagePrompt = `${inputs.systemMessagePrompt}\n\n${promptContext}`;
    }
  }
  return flow;
}
