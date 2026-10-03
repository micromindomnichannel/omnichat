// Zero-touch intake helpers: Telegram webhook registration + provider
// parsers/senders. All network mocked — asserts request shape + failure policy
// (auto-registration must never fail a connect; disconnect must never throw).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseTelegramUpdate,
  sendTelegramText,
  setTelegramWebhook,
  deleteTelegramWebhook,
  getTelegramWebhook,
// @ts-ignore — untyped server module (covered by these very tests)
// eslint-disable-next-line
} from '../../../server/integrations/telegram.js';
import {
  parseDiscordMessage,
  sendDiscordText,
  discoverDiscordBot,
// @ts-ignore — untyped server module (covered by these very tests)
// eslint-disable-next-line
} from '../../../server/integrations/discord.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('telegram intake', () => {
  it('setWebhook posts url + secret_token, returns Telegram result', async () => {
    const calls: Array<[string, any]> = [];
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push([url, opts]);
      return { ok: true, json: async () => ({ ok: true, result: true, description: 'Webhook was set' }) };
    });
    const out = await setTelegramWebhook({ botToken: 'TOK', url: 'https://api.example.com/webhooks/telegram', secret: 's3cr3t' });
    expect(out.ok).toBe(true);
    expect(calls[0][0]).toContain('/botTOK/setWebhook');
    expect(calls[0][0]).toContain(encodeURIComponent('https://api.example.com/webhooks/telegram'));
    expect(calls[0][0]).toContain('secret_token=s3cr3t');
  });

  it('setWebhook throws on Telegram rejection (caller records manual fallback)', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true, json: async () => ({ ok: false, description: 'Unauthorized' }),
    }));
    await expect(setTelegramWebhook({ botToken: 'BAD', url: 'https://x/y' })).rejects.toThrow(/Unauthorized/);
  });

  it('setWebhook validates inputs before touching the network', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    (globalThis as any).fetch = spy;
    await expect(setTelegramWebhook({ botToken: '', url: 'https://x/y' })).rejects.toThrow(/bot token required/);
    await expect(setTelegramWebhook({ botToken: 'TOK', url: '' })).rejects.toThrow(/url required/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('deleteWebhook never throws (offboarding is best-effort)', async () => {
    (globalThis as any).fetch = vi.fn(async () => { throw new Error('net down'); });
    await expect(deleteTelegramWebhook({ botToken: 'TOK' })).resolves.toEqual({ ok: false });
  });

  it('getWebhookInfo surfaces url + pending + last error', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, result: { url: 'https://core.example/tg/abc', pending_update_count: 3, last_error_message: 'timeout' } }),
    }));
    const info = await getTelegramWebhook({ botToken: 'TOK' });
    expect(info).toEqual({ url: 'https://core.example/tg/abc', pending: 3, lastError: 'timeout' });
  });

  it('parseTelegramUpdate keeps text messages, drops the rest', () => {
    const upd = { update_id: 7, message: { chat: { id: 42 }, from: { id: 9 }, text: 'hello' } };
    expect(parseTelegramUpdate(upd)).toEqual([{ chatId: '42', fromId: '9', text: 'hello', updateId: 'tg_7' }]);
    expect(parseTelegramUpdate({ update_id: 8, message: { chat: { id: 1 } } })).toEqual([]);
    expect(parseTelegramUpdate({})).toEqual([]);
  });

  it('sendTelegramText validates the token first', async () => {
    const spy = vi.fn();
    (globalThis as any).fetch = spy;
    await expect(sendTelegramText({ botToken: '', chatId: '1', text: 'hi' })).rejects.toThrow(/bot token required/);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('discord intake', () => {
  it('parseDiscordMessage ignores bots and empty content, keys by channel', () => {
    const msg = { id: 'm1', channelId: 'ch9', content: '  hello  ', author: { id: 'u1', username: 'Sara', bot: false }, guildId: 'g1' };
    expect(parseDiscordMessage(msg)).toEqual({
      senderId: 'ch9', text: 'hello', mid: 'dc_m1', authorId: 'u1', authorName: 'Sara', guildId: 'g1',
    });
    expect(parseDiscordMessage({ ...msg, author: { ...msg.author, bot: true } })).toBeNull();
    expect(parseDiscordMessage({ ...msg, content: '   ' })).toBeNull();
    expect(parseDiscordMessage(null)).toBeNull();
  });

  it('sendDiscordText posts to the message channel, validates inputs', async () => {
    const calls: Array<[string, any]> = [];
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push([url, opts]);
      return { ok: true, json: async () => ({ id: 'sent1' }) };
    });
    const out = await sendDiscordText({ botToken: 'DTOK', channelId: 'ch9', text: 'hi there' });
    expect(out).toEqual({ id: 'sent1' });
    expect(calls[0][0]).toBe('https://discord.com/api/v10/channels/ch9/messages');
    expect(JSON.parse(calls[0][1].body)).toEqual({ content: 'hi there' });
    expect(calls[0][1].headers.Authorization).toBe('Bot DTOK');
    await expect(sendDiscordText({ botToken: '', channelId: 'ch9', text: 'x' })).rejects.toThrow(/bot token required/);
    await expect(sendDiscordText({ botToken: 'T', channelId: '', text: 'x' })).rejects.toThrow(/channel id required/);
  });

  it('discoverDiscordBot returns null instead of throwing', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ id: '123', username: 'ORBIT' }) }));
    expect(await discoverDiscordBot('TOK')).toEqual({ id: '123', username: 'ORBIT', bot: true });
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) }));
    expect(await discoverDiscordBot('BAD')).toBeNull();
    (globalThis as any).fetch = vi.fn(async () => { throw new Error('net down'); });
    expect(await discoverDiscordBot('TOK')).toBeNull();
  });
});
