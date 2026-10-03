// formatListTime: raw ISO backend timestamps render friendly in the list;
// already-friendly strings pass through untouched.
import { describe, it, expect } from 'vitest';
import { formatListTime, normalizeConversation } from '../normalize';

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
});
