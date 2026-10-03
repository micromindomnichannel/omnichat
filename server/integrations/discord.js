// Discord provider (bot-based, gateway inbound + REST send).
// Credential secret = bot token (Discord Developer Portal -> Bot -> Token).
// Inbound arrives via the gateway listener (discordGateway.js), NOT an HTTP
// webhook — Discord has no per-message inbound webhook. Replies go out via
// REST to the message's channel. Template v1 verified — connect
// auto-provisions the tenant flow (no micromindFlowId needed).

const API = 'https://discord.com/api/v10';

// Bot identity discovery (best-effort at connect): token -> { id, username }.
// Never throws — connect must survive a Discord outage.
export async function discoverDiscordBot(botToken) {
  try {
    const res = await fetch(`${API}/users/@me`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) return null;
    const me = await res.json().catch(() => ({}));
    if (!me?.id) return null;
    return { id: String(me.id), username: me.username || null, bot: me.bot !== false };
  } catch {
    return null;
  }
}

// Pure: gateway message -> normalized event. Returns null for anything the
// pipeline must ignore (own/bot messages, empty content).
// Conversation identity mirrors telegram (per-chat): senderId = channel id,
// author carried in extra for naming (never as the conversation key).
export function parseDiscordMessage(msg) {
  if (!msg || msg.author?.bot) return null;
  const text = String(msg.content || '').trim().slice(0, 2000);
  if (!text) return null;
  const channelId = String(msg.channelId || msg.channel?.id || '');
  if (!channelId) return null;
  return {
    senderId: channelId,
    text,
    mid: `dc_${msg.id}`,
    authorId: String(msg.author?.id || ''),
    authorName: msg.author?.username || msg.author?.globalName || null,
    guildId: msg.guildId ? String(msg.guildId) : null,
  };
}

export async function sendDiscordText({ botToken, channelId, text }) {
  if (!botToken) throw new Error('sendDiscordText: bot token required');
  if (!channelId) throw new Error('sendDiscordText: channel id required');
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: String(text).slice(0, 1900) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Discord send -> ${data?.message || res.status}`);
  return data;
}
