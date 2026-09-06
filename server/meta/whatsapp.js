// WhatsApp Cloud API provider.
// PLACEHOLDERS (runtime): Meta app with whatsapp_business_messaging permission,
// a phone-number-id, and a system-user access token. Credential secret = token;
// credential metadata = { phone_number_id }. Webhook verify token per account.
// Template auto-provisioning is PENDING (no verified flow export yet) — connect
// works bring-your-own-flow (micromindFlowId) until then.
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

// Pure: Cloud API webhook body -> [{ from, text, mid, phoneNumberId }]
export function parseWhatsAppWebhook(body) {
  const out = [];
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (value.messaging_product !== 'whatsapp') continue;
      const phoneNumberId = value.metadata?.phone_number_id;
      for (const m of value.messages || []) {
        if (m.type !== 'text' || !m.text?.body) continue;
        out.push({ from: String(m.from), text: String(m.text.body).slice(0, 2000), mid: String(m.id), phoneNumberId });
      }
    }
  }
  return out;
}

export async function sendWhatsAppText({ token, phoneNumberId, to, text }) {
  if (!token || !phoneNumberId) throw new Error('sendWhatsAppText: token + phoneNumberId required');
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: String(text).slice(0, 1900) } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`WhatsApp send -> ${data?.error?.message || res.status}`);
  return data;
}
