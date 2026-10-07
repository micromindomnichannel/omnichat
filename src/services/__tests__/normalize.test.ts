// formatListTime: raw ISO backend timestamps render friendly in the list;
// already-friendly strings pass through untouched.
import { describe, it, expect } from 'vitest';
import {
  formatListTime, formatThreadTime, normalizeConversation,
  avgResponseMs, formatDurationMs, countBySender, countLeads,
  activeChannelList, recentChannelActivity,
} from '../normalize';

const NOW = new Date('2026-10-03T20:40:00.000Z').getTime();

describe('formatListTime', () => {
  it('formats recent ISO timestamps relatively', () => {
    expect(formatListTime('2026-10-03T20:39:30.000Z', NOW)).toBe('just now');
    expect(formatListTime('2026-10-03T20:35:00.000Z', NOW)).toBe('5m');
    expect(formatListTime('2026-10-03T18:40:00.000Z', NOW)).toBe('2h');
  });

  it('formats older timestamps as Yesterday / weekday / date', () => {
    expect(formatListTime('2026-10-02T20:00:00.000Z', NOW)).toBe('Yesterday');
    expect(formatListTime('2026-09-30T12:00:00.000Z', NOW)).toBe('Wed');
    expect(formatListTime('2026-09-27T23:23:06+0000', NOW)).toMatch(/^(Mon|Sun|Sep 2)/);
    expect(formatListTime('2026-09-20T10:00:00.000Z', NOW)).toMatch(/20/);
    expect(formatListTime('2026-09-20T10:00:00.000Z', NOW)).not.toContain('T');
  });

  it('passes through friendly strings and empties', () => {
    expect(formatListTime('2 min ago', NOW)).toBe('2 min ago');
    expect(formatListTime('', NOW)).toBe('');
    expect(formatListTime(null, NOW)).toBe('');
  });
});

describe('normalizeConversation time', () => {
  it('never leaves a raw ISO lastMessageTime', () => {
    const c = normalizeConversation({ id: 'x', last_message_time: '2026-10-03T01:56:35.653Z' });
    expect(c.lastMessageTime).not.toContain('T');
    expect(c.updatedAt).toBe('2026-10-03T01:56:35.653Z'); // raw kept for logic
  });

  it('passes through the channel account id for per-account joins', () => {
    const c = normalizeConversation({ id: 'x', channel_account_id: 'ch_1' });
    expect(c.channelAccountId).toBe('ch_1');
  });
});

describe('formatThreadTime', () => {
  const NOW = new Date('2026-10-03T20:40:00.000Z').getTime();
  it('renders short local times, never raw ISO', () => {
    const out = formatThreadTime('2026-10-03T20:39:30.000Z', NOW);
    expect(out).not.toContain('T');
    expect(out).toMatch(/11:39|20:39|8:39/);
    expect(formatThreadTime('2026-10-02T20:00:00.000Z', NOW)).toMatch(/Yesterday/);
    expect(formatThreadTime('not a date', NOW)).toBe('not a date');
    expect(formatThreadTime('', NOW)).toBe('');
  });
});

describe('inbox metrics', () => {
  const convs: any[] = [
    { id: 'a', channel: 'messenger', intent: 'purchase', status: 'ai_handling', updatedAt: '2026-10-03T20:00:00Z' },
    { id: 'b', channel: 'instagram', intent: 'support', status: 'human', updatedAt: '2026-10-03T19:00:00Z' },
    { id: 'c', channel: 'messenger', intent: 'booking', status: 'resolved', updatedAt: '2026-10-02T10:00:00Z' },
  ];
  const msgs: any[] = [
    { id: 'm1', conversationId: 'a', sender: 'customer', timestamp: '2026-10-03T20:00:00Z' },
    { id: 'm2', conversationId: 'a', sender: 'ai', timestamp: '2026-10-03T20:00:05Z' },
    { id: 'm3', conversationId: 'b', sender: 'customer', timestamp: '2026-10-03T19:00:00Z' },
    { id: 'm4', conversationId: 'b', sender: 'human', timestamp: '2026-10-03T19:02:00Z' },
    { id: 'm5', conversationId: 'c', sender: 'customer', timestamp: '2026-10-02T10:00:00Z' },
  ];

  it('counts leads, channels, and senders from stored rows', () => {
    expect(countLeads(convs)).toBe(2);
    expect(activeChannelList(convs).sort()).toEqual(['instagram', 'messenger']);
    expect(countBySender(msgs)).toEqual({ customer: 3, ai: 1, human: 1, system: 0 });
  });

  it('averages AI/human first-response latency, null when unpairable', () => {
    // (5s + 120s) / 2 = 62.5s -> 62500ms; conv c has no reply
    expect(avgResponseMs(msgs)).toEqual({ avgMs: 62500, samples: 2 });
    expect(avgResponseMs([])).toEqual({ avgMs: null, samples: 0 });
    expect(formatDurationMs(null)).toBe('Not available yet');
    expect(formatDurationMs(5000)).toBe('5s');
    expect(formatDurationMs(125000)).toBe('2m 5s');
  });

  it('reports latest activity per channel, newest first', () => {
    const act = recentChannelActivity(convs);
    expect(act.map((a) => a.channel)).toEqual(['messenger', 'instagram']);
    expect(act[0]).toMatchObject({ threads: 2 });
  });
});
