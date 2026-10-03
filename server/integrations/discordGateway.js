// Discord gateway manager: one discord.js Client per active discord account.
// The gateway is the ONLY inbound path (Discord offers no per-message HTTP
// webhook). Each client logs in with the tenant's vaulted bot token, listens
// for messageCreate, and feeds the shared persist -> AI -> send pipeline
// (handleNormalized, owned by webhooks/routes.js — imported, never duplicated).
// A dead token kills only its own client; every account is isolated by key.
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { decryptSecret } from '../credentials/crypto.js';
import { handleNormalized } from '../webhooks/routes.js';
import { parseDiscordMessage } from './discord.js';

const clients = new Map(); // accountId -> Client

async function tokenFor(pool, account) {
  if (!account?.credential_id) return null;
  const row = (await pool.query('SELECT encrypted_secret FROM credentials WHERE id=$1', [account.credential_id])).rows[0];
  if (!row) return null;
  try {
    return decryptSecret(row.encrypted_secret);
  } catch {
    return null;
  }
}

export async function startDiscordAccount(pool, account) {
  if (!account?.id || clients.has(account.id)) return clients.get(account.id) || null;
  const botToken = await tokenFor(pool, account);
  if (!botToken) return null;
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
  });
  client.on('messageCreate', async (msg) => {
    try {
      const parsed = parseDiscordMessage(msg);
      if (!parsed) return;
      // Re-resolve the account live: disconnects stop intake immediately.
      const acc = (await pool.query(
        "SELECT * FROM channel_accounts WHERE id=$1 AND status='active'",
        [account.id]
      )).rows[0];
      if (!acc) return;
      await handleNormalized(pool, 'discord', acc, {
        senderId: parsed.senderId,
        text: parsed.text,
        mid: parsed.mid,
      }, {
        discordAuthor: parsed.authorId,
        discordGuild: parsed.guildId,
        profileName: parsed.authorName,
      });
    } catch (err) {
      console.error('[discord-gateway] handle error:', err.message);
    }
  });
  client.on('error', (err) => console.error(`[discord-gateway:${account.id}] client error:`, err.message));
  try {
    await client.login(botToken);
  } catch (err) {
    console.error(`[discord-gateway:${account.id}] login failed:`, err.message);
    try { await client.destroy(); } catch { /* already dead */ }
    return null;
  }
  clients.set(account.id, client);
  return client;
}

export async function stopDiscordAccount(accountId) {
  const client = clients.get(accountId);
  if (!client) return;
  clients.delete(accountId);
  try { await client.destroy(); } catch { /* already dead */ }
}

export function discordClientCount() {
  return clients.size;
}

export function isDiscordListening(accountId) {
  const client = clients.get(accountId);
  return Boolean(client && client.isReady && client.isReady());
}

// Boot: one listener per active discord account. Failures are per-account
// (never break boot) and logged for the operator.
export async function startDiscordGateway(pool) {
  let rows = [];
  try {
    rows = (await pool.query(
      "SELECT * FROM channel_accounts WHERE channel='discord' AND status='active' ORDER BY updated_at DESC"
    )).rows;
  } catch (err) {
    console.warn('[discord-gateway] boot query skipped:', err.message);
    return 0;
  }
  let started = 0;
  for (const acc of rows) {
    try {
      if (await startDiscordAccount(pool, acc)) started += 1;
    } catch (err) {
      console.error(`[discord-gateway:${acc.id}] boot failed:`, err.message);
    }
  }
  if (started) console.log(`[discord-gateway] listening on ${started} account(s)`);
  return started;
}
