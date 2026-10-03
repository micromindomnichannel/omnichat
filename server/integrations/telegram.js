// Telegram provider (bot-based).
// PLACEHOLDERS (runtime): bot token from @BotFather. Credential secret = bot token.
// Webhook: set via setWebhook with secret_token; stored per account in
// metadata.webhook_secret and checked on inbound. Template v1 verified —
// connect auto-provisions the tenant flow (no micromindFlowId needed).

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

// Zero-touch intake: point the bot at ORBIT (overwrites any MicroMind-direct
// webhook — that is the per-tenant cutover). Throws on failure; callers must
// treat this as best-effort and keep the manual fallback (secret + URL hint).
export async function setTelegramWebhook({ botToken, url, secret }) {
  if (!botToken) throw new Error('setTelegramWebhook: bot token required');
  if (!url) throw new Error('setTelegramWebhook: url required');
  const params = new URLSearchParams({ url });
  if (secret) params.set('secret_token', secret);
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?${params.toString()}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(`Telegram setWebhook -> ${data?.description || res.status}`);
  return data;
}

// Zero-touch offboarding: release the bot so updates stop hitting a dead
// endpoint (and the token can be re-pointed elsewhere). Never throws.
export async function deleteTelegramWebhook({ botToken }) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false };
  } catch {
    return { ok: false };
  }
}

// Diagnostics: where does Telegram deliver this bot's updates today?
// Returns { url, pending, lastError } — url empty means no webhook set.
export async function getTelegramWebhook({ botToken }) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(`Telegram getWebhookInfo -> ${data?.description || res.status}`);
  return {
    url: data.result?.url || '',
    pending: data.result?.pending_update_count || 0,
    lastError: data.result?.last_error_message || null,
  };
}
