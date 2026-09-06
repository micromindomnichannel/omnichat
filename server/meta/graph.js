// Meta Graph API sender (Messenger + Instagram). Backend-only — page access token
// is decrypted transiently from the vault and never logged or returned.
// Docs: Messenger Send API + Instagram Messaging API share the /me/messages shape
// with recipient:{id} = PSID (messenger) or IGSID (instagram).
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

async function graphPost(pageAccessToken, path, body) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pageAccessToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data?.error?.message || `Graph ${res.status}`;
    const err = new Error(`Meta Graph ${path} -> ${msg}`);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data; // { recipient_id, message_id }
}

export async function sendTextMessage({ pageAccessToken, recipientId, text }) {
  if (!pageAccessToken) throw new Error('sendTextMessage: missing page access token');
  if (!recipientId || !text) throw new Error('sendTextMessage: recipientId + text required');
  return graphPost(pageAccessToken, '/me/messages', {
    recipient: { id: recipientId },
    messaging_type: 'RESPONSE',
    message: { text: String(text).slice(0, 1900) },
  });
}

export async function sendImageMessage({ pageAccessToken, recipientId, imageUrl }) {
  if (!pageAccessToken) throw new Error('sendImageMessage: missing page access token');
  return graphPost(pageAccessToken, '/me/messages', {
    recipient: { id: recipientId },
    messaging_type: 'RESPONSE',
    message: { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } },
  });
}

export { GRAPH_VERSION };
