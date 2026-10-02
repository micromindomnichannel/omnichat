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

// ---- Page publishing (Scheduler "publish now"; merges ORBIT Posts duties
// into the main app). Requires a Page token carrying pages_manage_posts,
// minted under the production Meta app — tokens from other apps cannot post
// with this app's grants.
async function graphGet(pageAccessToken, path) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`, {
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = new Error(`Meta Graph ${path} -> ${data?.error?.message || `Graph ${res.status}`}`);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function publishPagePost({ pageAccessToken, pageId, message, link }) {
  if (!pageAccessToken) throw new Error('publishPagePost: missing page access token');
  if (!pageId) throw new Error('publishPagePost: pageId required');
  if (!message && !link) throw new Error('publishPagePost: message or link required');
  const body = {};
  if (message) body.message = String(message).slice(0, 5000);
  if (link) body.link = link;
  return graphPost(pageAccessToken, `/${pageId}/feed`, body); // -> { id: "<page>_<post>" }
}

// Instagram content publishing is two-step and REQUIRES a publicly reachable
// image_url (Meta fetches the bytes; localhost/ephemeral URLs fail here).
export async function publishInstagramMedia({ pageAccessToken, igId, imageUrl, caption }) {
  if (!pageAccessToken) throw new Error('publishInstagramMedia: missing page access token');
  if (!igId) throw new Error('publishInstagramMedia: IG business id required');
  if (!imageUrl) throw new Error('publishInstagramMedia: public imageUrl required');
  if (!/^https:\/\//i.test(imageUrl)) {
    throw new Error('publishInstagramMedia: imageUrl must be public https (Meta fetches it)');
  }
  const container = await graphPost(pageAccessToken, `/${igId}/media`, {
    image_url: imageUrl,
    ...(caption ? { caption: String(caption).slice(0, 2200) } : {}),
  });
  if (!container?.id) throw new Error('publishInstagramMedia: container creation returned no id');
  return graphPost(pageAccessToken, `/${igId}/media_publish`, { creation_id: container.id }); // -> { id: mediaId }
}

export async function getMessagingProfile({ pageAccessToken, senderId }) {
  if (!pageAccessToken || !senderId) return null;
  try {
    return await graphGet(pageAccessToken, `/${encodeURIComponent(senderId)}?fields=name,username`);
  } catch {
    return null;
  }
}

export { GRAPH_VERSION, graphGet };
