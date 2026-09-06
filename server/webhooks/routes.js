// Provider webhooks: provider -> ORBIT -> MicroMind -> provider.
// ORBIT owns each provider webhook URL. Every event is journaled in
// webhook_events for idempotency: retries must never duplicate messages.
// Flow: identify channel account -> workspace -> store raw event -> persist
// customer/conversation/message -> predict(flow, sessionId, vars) -> provider send.
//
// Messenger/Instagram: Meta hub handshake + messaging[] payloads (verified template).
// WhatsApp: Meta hub handshake + Cloud API changes[] (BYOF flow until template lands).
// Telegram: Bot API updates, X-Telegram-Bot-Api-Secret-Token checked (BYOF).
// Gmail: 501 placeholder (needs Google OAuth + Pub/Sub).
//
// NOTE (MVP): processing is inline before the 200. Meta tolerates ~20s; move to a
// queue when volume grows. Secrets are decrypted transiently, never logged.
import express from 'express';
import { decryptSecret } from '../credentials/crypto.js';
import { CHANNELS, buildSessionId } from '../micromind/provisionChannel.js';
import { predict } from '../micromind/client.js';
import { sendTextMessage } from '../meta/graph.js';
import { verifyMetaSignature } from '../meta/verify.js';
import { webhookLimit } from '../middleware/rateLimit.js';
import { parseWhatsAppWebhook, sendWhatsAppText } from '../meta/whatsapp.js';
import { parseTelegramUpdate, sendTelegramText } from '../integrations/telegram.js';
import { gmailPending } from '../integrations/gmail.js';

const WORKSPACE = 'default'; // MVP stub — same single-workspace rule as channels
const META_HANDSHAKE = ['messenger', 'instagram', 'whatsapp'];
const KNOWN = [...META_HANDSHAKE, 'telegram', 'gmail'];
const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

async function findAccountByVerifyToken(pool, provider, token) {
  const { rows } = await pool.query(
    "SELECT * FROM channel_accounts WHERE channel=$1 AND workspace_id=$2 AND metadata->>'verify_token'=$3 LIMIT 1",
    [provider, WORKSPACE, token]
  );
  return rows[0] || null;
}

async function activeAccount(pool, provider) {
  const { rows } = await pool.query(
    "SELECT * FROM channel_accounts WHERE channel=$1 AND workspace_id=$2 AND status='active' ORDER BY updated_at DESC LIMIT 1",
    [provider, WORKSPACE]
  );
  return rows[0] || null;
}

export function webhooksRouter(pool) {
  const r = express.Router();

  // Meta verification handshake (messenger/instagram/whatsapp).
  r.get('/webhooks/:provider', async (req, res) => {
    const { provider } = req.params;
    if (provider === 'gmail') return res.status(501).json({ code: 'gmail_pending' });
    if (!META_HANDSHAKE.includes(provider)) return res.sendStatus(404);
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode !== 'subscribe' || !token) return res.sendStatus(403);
    try {
      const acc = await findAccountByVerifyToken(pool, provider, String(token));
      if (!acc && String(token) !== CHANNELS[provider].defaultVerifyToken) return res.sendStatus(403);
    } catch {
      // DB unreachable: still answer handshakes against template defaults.
      if (String(token) !== CHANNELS[provider].defaultVerifyToken) return res.sendStatus(403);
    }
    return res.status(200).send(challenge);
  });

  // Inbound events. Meta providers require a valid app signature when
  // META_APP_SECRET is configured (forgery would mint fake chats + paid AI calls).
  r.post('/webhooks/:provider', webhookLimit, async (req, res) => {
    const { provider } = req.params;
    if (provider === 'gmail') return res.status(501).json({ code: 'gmail_pending', error: gmailPending().message });
    if (!KNOWN.includes(provider)) return res.sendStatus(404);
    if ((provider === 'messenger' || provider === 'instagram' || provider === 'whatsapp') && !verifyMetaSignature(req)) {
      return res.sendStatus(403);
    }
    try {
      if (provider === 'messenger' || provider === 'instagram') {
        for (const entry of req.body?.entry || []) {
          for (const item of entry.messaging || []) {
            try {
              await handleMetaMessaging(pool, provider, item);
            } catch (err) {
              console.error(`[webhook:${provider}] handle error:`, err.message);
            }
          }
        }
      } else if (provider === 'whatsapp') {
        for (const m of parseWhatsAppWebhook(req.body)) {
          try {
            await handleNormalized(pool, provider, { senderId: m.from, text: m.text, mid: m.mid });
          } catch (err) {
            console.error('[webhook:whatsapp] handle error:', err.message);
          }
        }
      } else if (provider === 'telegram') {
        const account = await activeAccount(pool, 'telegram');
        const expected = account?.metadata?.webhook_secret;
        const got = req.get('X-Telegram-Bot-Api-Secret-Token');
        if (expected && got !== expected) return res.sendStatus(403);
        for (const u of parseTelegramUpdate(req.body)) {
          try {
            await handleNormalized(pool, provider, { senderId: u.chatId, text: u.text, mid: u.updateId }, { telegramFrom: u.fromId });
          } catch (err) {
            console.error('[webhook:telegram] handle error:', err.message);
          }
        }
      }
    } catch (err) {
      console.error(`[webhook:${provider}] fatal:`, err.message);
    }
    res.status(200).send('EVENT_RECEIVED');
  });

  return r;
}

async function handleMetaMessaging(pool, provider, item) {
  const msg = item.message;
  // Ignore echoes, delivery/read receipts, non-text.
  if (!msg || msg.is_echo || !msg.text) return;
  const senderId = String(item.sender?.id || '');
  if (!senderId) return;
  await handleNormalized(pool, provider, {
    senderId,
    text: String(msg.text).slice(0, 2000),
    mid: String(msg.mid || `${provider}_${Date.now()}`),
  });
}

// Shared persist -> AI -> send pipeline for one normalized inbound message.
async function handleNormalized(pool, provider, { senderId, text, mid }, extra = {}) {
  // Idempotency first.
  const ins = await pool.query(
    'INSERT INTO webhook_events (id, provider, external_event_id, workspace_id, payload, status) VALUES ($1,$2,$3,$4,$5,\'received\') ON CONFLICT (external_event_id) DO NOTHING RETURNING id',
    [rid('whe'), provider, mid, WORKSPACE, JSON.stringify({ senderId, text: String(text).slice(0, 500), ...extra }).slice(0, 8000)]
  );
  if (!ins.rows.length) {
    await pool.query("UPDATE webhook_events SET status='duplicate' WHERE external_event_id=$1", [mid]);
    return;
  }

  const account = await activeAccount(pool, provider);
  if (!account) {
    await pool.query("UPDATE webhook_events SET status='no_channel' WHERE external_event_id=$1", [mid]);
    return;
  }
  await pool.query('UPDATE webhook_events SET channel_account_id=$1 WHERE external_event_id=$2', [account.id, mid]);

  const customerId = `${WORKSPACE}:${provider}:${senderId}`;
  await pool.query(
    'INSERT INTO customers (id, workspace_id, name, channels, status) VALUES ($1,$2,$3,$4,\'New\') ON CONFLICT (id) DO NOTHING',
    [customerId, WORKSPACE, `Customer ${senderId.slice(-6)}`, [provider]]
  );

  let conv;
  const found = await pool.query(
    'SELECT * FROM conversations WHERE workspace_id=$1 AND channel_account_id=$2 AND external_conversation_id=$3 LIMIT 1',
    [WORKSPACE, account.id, senderId]
  );
  if (found.rows.length) {
    conv = found.rows[0];
  } else {
    const made = await pool.query(
      `INSERT INTO conversations (id, workspace_id, customer_id, channel, channel_account_id, external_conversation_id, unread_count, ai_enabled, status, intent, last_message, last_message_time, ai_context)
       VALUES ($1,$2,$3,$4,$5,$6,0,true,'ai_handling','support',$7,$8,$9) RETURNING *`,
      [rid('conv'), WORKSPACE, customerId, provider, account.id, senderId, text,
       new Date().toISOString(), JSON.stringify({ provider, senderId, ...extra })]
    );
    conv = made.rows[0];
  }

  await pool.query(
    "INSERT INTO messages (id, workspace_id, conversation_id, sender, sender_external_id, content, timestamp, source) VALUES ($1,$2,$3,'customer',$4,$5,$6,'webhook')",
    [rid('m'), WORKSPACE, conv.id, senderId, text, new Date().toISOString()]
  );
  await pool.query(
    'UPDATE conversations SET last_message=$1, unread_count = unread_count + 1, updated_at=CURRENT_TIMESTAMP WHERE id=$2',
    [text, conv.id]
  );
  await pool.query("UPDATE webhook_events SET status='processed', processed_at=CURRENT_TIMESTAMP WHERE external_event_id=$1", [mid]);

  // AI reply (only when AI-handled and a flow is attached).
  if (conv.ai_enabled === false || !account.micromind_flow_id) return;
  try {
    const ws = (await pool.query('SELECT * FROM workspace_settings WHERE workspace_id=$1', [WORKSPACE])).rows[0] || {};
    const out = await predict(account.micromind_flow_id, {
      question: text,
      sessionId: buildSessionId(WORKSPACE, provider, senderId),
      vars: {
        ...CHANNELS[provider].runtimeVars(senderId, text),
        business_name: ws.business_name || undefined,
        ai_tone: ws.ai_tone || undefined,
        language: ws.language || undefined,
      },
    });
    const reply = String(out?.text || out?.json?.answer || '').slice(0, 1900) || 'Thanks for reaching out! An agent will follow up shortly.';
    await pool.query(
      "INSERT INTO messages (id, workspace_id, conversation_id, sender, content, timestamp, agent_name, source) VALUES ($1,$2,$3,'ai',$4,$5,'ORBIT AI','ai')",
      [rid('m'), WORKSPACE, conv.id, reply, new Date().toISOString()]
    );
    await pool.query('UPDATE conversations SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [reply, conv.id]);

    if (account.credential_id) {
      const cred = (await pool.query('SELECT encrypted_secret, metadata FROM credentials WHERE id=$1', [account.credential_id])).rows[0];
      if (cred) {
        const secret = decryptSecret(cred.encrypted_secret);
        await sendProviderReply(provider, account, cred, secret, senderId, reply);
      }
    }
  } catch (err) {
    console.error(`[webhook:${provider}] AI reply failed:`, err.message);
    await pool.query(
      "INSERT INTO messages (id, workspace_id, conversation_id, sender, content, timestamp, source) VALUES ($1,$2,$3,'system',$4,$5,'webhook')",
      [rid('m'), WORKSPACE, conv.id, `AI reply failed: ${String(err.message).slice(0, 200)}`, new Date().toISOString()]
    );
  }
}

async function sendProviderReply(provider, account, cred, secret, senderId, text) {
  if (provider === 'messenger' || provider === 'instagram') {
    return sendTextMessage({ pageAccessToken: secret, recipientId: senderId, text });
  }
  if (provider === 'whatsapp') {
    const phoneNumberId = cred.metadata?.phone_number_id || account.metadata?.phone_number_id;
    return sendWhatsAppText({ token: secret, phoneNumberId, to: senderId, text });
  }
  if (provider === 'telegram') {
    return sendTelegramText({ botToken: secret, chatId: senderId, text });
  }
  throw gmailPending('Gmail send');
}
