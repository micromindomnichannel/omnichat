// Backward-compatible wrapper: provisionMessenger.js -> generic provisionChannel('messenger').
import {
  CHANNELS,
  loadTemplate,
  buildTenantFlowData,
  buildSessionId,
  provisionChannelFlow,
  updateChannelFlow,
} from './provisionChannel.js';

export { CHANNELS, loadTemplate, buildSessionId, provisionChannelFlow, updateChannelFlow };
export const loadMessengerTemplate = () => loadTemplate('messenger');
export const buildTenantFlowDataCompat = (template, opts) => buildTenantFlowData('messenger', template, opts);
export { buildTenantFlowDataCompat as buildTenantFlowData };

export async function provisionMessengerFlow({ name, verifyToken, businessName, aiTone, language } = {}) {
  return provisionChannelFlow('messenger', { name, verifyToken, businessName, aiTone, language });
}

export async function updateMessengerFlow(flowId, patch) {
  return updateChannelFlow(flowId, patch);
}

export const PLACEHOLDERS = {
  verifyToken: 'orbit_messenger_2026',
  pageId: '<PAGE_ID>',
  pageToken: '<PAGE_ACCESS_TOKEN>',
};
