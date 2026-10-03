import { graphGet } from './graph.js';
import crypto from 'crypto';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const customerKey = (workspaceId, channel, senderId) =>
  `${channel}_${crypto.createHash('sha256').update(`${workspaceId}:${channel}:${senderId}`).digest('hex').slice(0, 40)}`;

function nameFrom(profile, fallback) {
  return profile?.name || profile?.username || fallback;
}

export async function syncMetaConversations(pool, {
  workspaceId, accountId, channel, pageId, businessId, pageAccessToken,
}) {
  if (!pageId || !pageAccessToken) return { conversations: 0, messages: 0 };
  const platform = channel === 'instagram' ? 'instagram' : 'messenger';
  const list = await graphGet(pageAccessToken, `/${pageId}/conversations?platform=${platform}&limit=100`);
  let conversations = 0;
  let messages = 0;
  for (const item of list?.data || []) {
    if (!item?.id) continue;
    const detail = await graphGet(pageAccessToken, `/${item.id}?fields=messages.limit(20){id,created_time,from,to,message}`).catch(() => null);
    const rows = detail?.messages?.data || [];
    const latest = rows[rows.length - 1];
    const sender = latest?.from?.id && String(latest.from.id) !== String(businessId || pageId)
      ? latest.from : null;
    const senderId = sender?.id ? String(sender.id) : `conversation-${item.id}`;
    const priorCustomer = (await pool.query(
      "SELECT customer_id FROM conversations WHERE workspace_id=$1 AND channel=$2 AND ai_context->>'senderId'=$3 ORDER BY updated_at DESC LIMIT 1",
      [workspaceId, channel, senderId]
    )).rows[0];
    const customerId = priorCustomer?.customer_id || customerKey(workspaceId, channel, senderId);
    const customerName = nameFrom(sender, `Customer ${senderId.slice(-6)}`);
    await pool.query(
      "INSERT INTO customers (id, workspace_id, name, channels, status) VALUES ($1,$2,$3,$4,'New') ON CONFLICT (id) DO UPDATE SET name=CASE WHEN customers.name LIKE 'Customer %' THEN EXCLUDED.name ELSE customers.name END",
      [customerId, workspaceId, customerName, [channel]]
    );
    const existing = (await pool.query(
      'SELECT id FROM conversations WHERE workspace_id=$1 AND channel_account_id=$2 AND external_conversation_id=$3 LIMIT 1',
      [workspaceId, accountId, item.id]
    )).rows[0];
    const conv = existing || (await pool.query(
      `INSERT INTO conversations (id, workspace_id, customer_id, channel, channel_account_id, external_conversation_id, unread_count, ai_enabled, status, intent, last_message, last_message_time, ai_context)
       VALUES ($1,$2,$3,$4,$5,$6,0,true,'ai_handling','support',$7,$8,$9) RETURNING id`,
      [rid('conv'), workspaceId, customerId, channel, accountId, item.id,
       latest?.message || '', latest?.created_time || item.updated_time || new Date().toISOString(),
       JSON.stringify({ provider: channel, imported: true, senderId })]
    )).rows[0];
    conversations += existing ? 0 : 1;
    for (const message of rows) {
      if (!message?.id || !message.message) continue;
      const duplicate = (await pool.query(
        'SELECT 1 FROM messages WHERE conversation_id=$1 AND sender_external_id=$2 LIMIT 1',
        [conv.id, message.id]
      )).rows[0];
      if (duplicate) continue;
      const fromBusiness = String(message.from?.id || '') === String(businessId || pageId);
      await pool.query(
        "INSERT INTO messages (id, workspace_id, conversation_id, sender, sender_external_id, content, timestamp, source) VALUES ($1,$2,$3,$4,$5,$6,$7,'meta_sync')",
        [rid('m'), workspaceId, conv.id, fromBusiness ? 'ai' : 'customer', message.id, message.message,
         message.created_time || new Date().toISOString()]
      );
      messages += 1;
    }
  }
  return { conversations, messages };
}
