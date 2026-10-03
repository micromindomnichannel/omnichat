// API client contract: request shape, credentials, and failure envelopes.
// authJson must surface {_network} / {_timeout} so pages can explain; fetchJson
// collapses to null only when unreachable.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

function mockFetchOnce(impl: (url: any, opts: any) => any) {
  (globalThis as any).fetch = vi.fn(impl);
  return (globalThis as any).fetch;
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('api.login', () => {
  it('POSTs credentials to /auth/login with cookies included', async () => {
    const f = mockFetchOnce(async (url: string, opts: any) => ({
      ok: true,
      json: async () => ({ user: { email: 'a@b.c' }, memberships: [] }),
    }));
    const res = await api.login('a@b.c', 'supersecret12');
    expect(f).toHaveBeenCalledOnce();
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/auth/login');
    expect(opts.method).toBe('POST');
    expect(opts.credentials).toBe('include');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.c', password: 'supersecret12' });
    expect(res.user.email).toBe('a@b.c');
  });

  it('returns server error bodies (invalid credentials) instead of null', async () => {
    mockFetchOnce(async () => ({
      ok: true,
      json: async () => ({ error: 'Invalid email or password.' }),
    }));
    const res = await api.login('a@b.c', 'wrongpassword1');
    expect(res.error).toMatch(/invalid/i);
  });

  it('maps network failure to {_network:true} with the browser message', async () => {
    mockFetchOnce(async () => { throw new TypeError('Failed to fetch'); });
    const res = await api.login('a@b.c', 'supersecret12');
    expect(res._network).toBe(true);
    expect(res.message).toMatch(/fetch/i);
  });

  it('maps aborts to {_timeout:true}', async () => {
    mockFetchOnce(async () => {
      const e: any = new Error('The operation was aborted');
      e.name = 'TimeoutError';
      throw e;
    });
    const res = await api.login('a@b.c', 'supersecret12');
    expect(res._timeout).toBe(true);
  });
});

describe('api.me / fetchJson', () => {
  it('returns parsed JSON on ok', async () => {
    mockFetchOnce(async () => ({ ok: true, json: async () => ({ user: { email: 'a@b.c' } }) }));
    expect(await api.me()).toEqual({ user: { email: 'a@b.c' } });
  });

  it('returns null on unreachable (no guessing in UI)', async () => {
    mockFetchOnce(async () => { throw new TypeError('Failed to fetch'); });
    expect(await api.me()).toBeNull();
  });
});

describe('inbox refresh (stale-304 guard)', () => {
  it('getConversations bypasses the HTTP cache', async () => {
    const f = mockFetchOnce(async () => ({ ok: true, status: 200, json: async () => [] }));
    await api.getConversations();
    expect(f).toHaveBeenCalledOnce();
    expect(f.mock.calls[0][1].cache).toBe('no-store');
  });

  it('getThreadMessages bypasses the HTTP cache', async () => {
    const f = mockFetchOnce(async () => ({ ok: true, status: 200, json: async () => [] }));
    await api.getThreadMessages('conv_1');
    expect(f).toHaveBeenCalledOnce();
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/v1/conversations/conv_1/messages');
    expect(opts.cache).toBe('no-store');
  });

  it('retries once with no-store when a 304 surfaces, returning fresh data', async () => {
    const calls: any[] = [];
    mockFetchOnce(async (url: string, opts: any) => {
      calls.push(opts?.cache);
      if (calls.length === 1) return { ok: false, status: 304, json: async () => { throw new Error('no body'); } };
      return { ok: true, status: 200, json: async () => [{ id: 'conv_new' }] };
    });
    const res = await api.me();
    expect(res).toEqual([{ id: 'conv_new' }]);
    expect(calls).toEqual([undefined, 'no-store']);
  });

  it('returns null (keeps last state) when the no-store retry also fails', async () => {
    const f = mockFetchOnce(async () => ({ ok: false, status: 304, json: async () => null }));
    expect(await api.me()).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });
});
