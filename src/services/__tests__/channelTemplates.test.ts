// Channel template safety: verified telegram/discord exports must reach
// tenants with no secrets, no send-tools, and the ORBIT prompt intact.
// Pure file + transform checks — no network, no MicroMind calls.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CHANNELS,
  loadTemplate,
  loadManifest,
  templateVersionFor,
  buildTenantFlowData,
  buildSessionId,
  orbitSetupGuide,
// @ts-ignore — untyped server module (covered by these very tests)
// eslint-disable-next-line
} from '../../../server/micromind/provisionChannel.js';
import { toChannel } from '../normalize.js';

const nodesByName = (flow: any, name: string) =>
  (flow.nodes || []).filter((n: any) => n.data?.name === name);

describe('verified channel templates', () => {
  for (const channel of ['telegram', 'discord'] as const) {
    it(`${channel}: loads with empty agent tools and no secrets`, () => {
      const t = loadTemplate(channel);
      expect(t.nodes.length).toBeGreaterThan(3);
      for (const agent of nodesByName(t, 'toolAgent')) {
        expect(agent.data.inputs.tools ?? []).toEqual([]);
      }
      const raw = JSON.stringify(t);
      expect(raw).not.toMatch(/[0-9]{8,}:[\w-]{20,}/); // bot-token shape
      expect(raw).not.toMatch(/MTU0[\w-]+\.[\w-]+\.[\w-]+/); // discord token shape
      expect(raw).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/); // owner credential id
      for (const trig of (t.nodes || []).filter((n: any) => String(n.data?.name || '').toLowerCase().includes('trigger'))) {
        for (const v of Object.values(trig.data?.inputs || {})) {
          expect(String(v || '')).not.toMatch(/[0-9]{8,}:[\w-]{20,}/);
        }
      }
    });

    it(`${channel}: keeps the proven ORBIT prompt and model`, () => {
      const t = loadTemplate(channel);
      const prompt = nodesByName(t, 'chatPromptTemplate')[0];
      expect(prompt.data.inputs.systemMessagePrompt).toMatch(/ORBIT/);
      expect(prompt.data.inputs.systemMessagePrompt).toMatch(/human agent/i);
      expect(prompt.data.inputs.humanMessagePrompt).toBe('{input}');
      const model = nodesByName(t, 'chatOpenRouter')[0];
      expect(model.data.inputs?.modelName || model.data.inputs?.model).toMatch(/cohere/);
    });
  }

  it('discord runtime contract mirrors telegram (sender id + session)', () => {
    expect(CHANNELS.discord.runtimeVars('ch_1', 'hi')).toEqual({ senderDiscordId: 'ch_1', input: 'hi' });
    expect(CHANNELS.telegram.runtimeVars('tg_1', 'hi')).toEqual({ senderTgId: 'tg_1', input: 'hi' });
    expect(buildSessionId('ws1', 'discord', 'ch_1')).toBe('ws1:discord:ch_1');
    expect(buildSessionId('ws1', 'telegram', 'tg_1')).toBe('ws1:telegram:tg_1');
  });

  it('buildTenantFlowData stamps credentials + business context, blanks discord ids', () => {
    const prev = process.env.MICROMIND_OPENROUTER_CREDENTIAL_ID;
    process.env.MICROMIND_OPENROUTER_CREDENTIAL_ID = 'cred_shared_test';
    try {
      const out = buildTenantFlowData('discord', loadTemplate('discord'), {
        businessName: 'Luna Store', language: 'English', aiTone: 'friendly',
      });
      const model = nodesByName(out, 'chatOpenRouter')[0];
      expect(model.data.credential).toBe('cred_shared_test');
      const prompt = nodesByName(out, 'chatPromptTemplate')[0];
      expect(prompt.data.inputs.systemMessagePrompt).toMatch(/Luna Store/);
      const trig = nodesByName(out, 'discordTrigger')[0];
      expect(trig.data.inputs.botToken).toBe('');
      expect(trig.data.inputs.channelId).toBe('');
    } finally {
      if (prev === undefined) delete process.env.MICROMIND_OPENROUTER_CREDENTIAL_ID;
      else process.env.MICROMIND_OPENROUTER_CREDENTIAL_ID = prev;
    }
  });

  it('setup guides stay ORBIT-owned per transport', () => {
    const tg = orbitSetupGuide('telegram', 'https://api.example.com');
    expect(tg).toMatch(/setWebhook/);
    expect(tg).toMatch(/https:\/\/api\.example\.com\/webhooks\/telegram/);
    expect(tg).not.toMatch(/Meta Developer Portal/);
    const dc = orbitSetupGuide('discord');
    expect(dc).toMatch(/gateway/i);
    expect(dc).toMatch(/Message Content Intent/);
    expect(dc).not.toMatch(/core\.aimicromind\.com\/webhook/);
  });

  it('manifest marks telegram + discord verified v1', () => {
    const m = loadManifest();
    expect(m.telegram).toMatchObject({ file: 'telegram.json', version: 'v1', status: 'verified' });
    expect(m.discord).toMatchObject({ file: 'discord.json', version: 'v1', status: 'verified' });
    expect(templateVersionFor('telegram')).toBe('v1');
    expect(templateVersionFor('discord')).toBe('v1');
  });

  it("normalize keeps the discord identity (no 'website' fallback)", () => {
    expect(toChannel('discord')).toBe('discord');
    expect(toChannel('telegram')).toBe('telegram');
    expect(toChannel('carrier-pigeon')).toBe('website');
  });
});
