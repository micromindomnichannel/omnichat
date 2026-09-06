// Telegram provider (bot-based).
// PLACEHOLDERS (runtime): bot token from @BotFather. Credential secret = bot token.
// Webhook: set via setWebhook with secret_token; stored per account in
// metadata.webhook_secret and checked on inbound. Template auto-provisioning is
// PENDING — connect works bring-your-own-flow (micromindFlowId) until then.

// Pure: Bot API update -> [{ chatId, fromId, text, updateId }] (text messages only)
export function parseTelegramUpdate(body) {
  const out = [];
  const msg = body?.message;
  if (msg?.text) {
    out.push({
      chatId: String(msg.chat.id),
      fromId: String(msg.from?.id || msg.chat.id),
      text: String(msg.text).slice(0, 2000),
      updateId: body.update_id != null ? `tg_${body.update_id}` : `tg_${Date.now()}`,
    });
  }
  return out;
}

export async function sendTelegramText({ botToken, chatId, text }) {
  if (!botToken) throw new Error('sendTelegramText: bot token required');
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 3900) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(`Telegram send -> ${data?.description || res.status}`);
  return data;
}
