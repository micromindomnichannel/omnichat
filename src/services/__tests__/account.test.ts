// Account-management API contracts: signup OTP, reset, logout, upload, delete.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOnce(impl: (url: any, opts: any) => any) {
  (globalThis as any).fetch = vi.fn(impl);
  return (globalThis as any).fetch;
}

const ok = (body: any) => mockFetchOnce(async () => ({ ok: true, json: async () => body }));

describe('signup OTP', () => {
  it('request-code posts email+password+displayName', async () => {
    const f = ok({ success: true });
    const res = await api.signupRequestCode('a@b.c', 'supersecret12', 'Ann');
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/auth/signup/request-code');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.c', password: 'supersecret12', displayName: 'Ann' });
    expect(res.success).toBe(true);
  });

  it('verify posts email+code and returns user+memberships', async () => {
    const f = ok({ user: { email: 'a@b.c' }, memberships: [{ workspace_id: 'default', role: 'owner' }] });
    const res = await api.signupVerify('a@b.c', '123456');
    expect(String(f.mock.calls[0][0])).toContain('/auth/signup/verify');
    expect(res.user.email).toBe('a@b.c');
  });

  it('surfaces rate-limit/server errors verbatim', async () => {
    ok({ error: 'too many attempts' });
    expect((await api.signupVerify('a@b.c', '000000')).error).toMatch(/too many/);
  });
});

describe('password reset', () => {
  it('forgotPassword posts the email', async () => {
    const f = ok({ success: true });
    await api.forgotPassword('a@b.c');
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/auth/forgot');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.c' });
  });

  it('resetPassword posts token+password', async () => {
    const f = ok({ success: true });
    const res = await api.resetPassword('tok123', 'newsupersecret');
    expect(String(f.mock.calls[0][0])).toContain('/auth/reset');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ token: 'tok123', password: 'newsupersecret' });
    expect(res.success).toBe(true);
  });

  it('unreachable forgot returns {_network}', async () => {
    mockFetchOnce(async () => { throw new TypeError('Failed to fetch'); });
    expect((await api.forgotPassword('a@b.c'))._network).toBe(true);
  });
});

describe('logout + delete', () => {
  it('logout POSTs and returns success', async () => {
    const f = ok({ success: true });
    expect((await api.logout()).success).toBe(true);
    expect(String(f.mock.calls[0][0])).toContain('/auth/logout');
  });

  it('deleteAccount uses DELETE on /auth/account', async () => {
    const f = ok({ success: true });
    const res = await api.deleteAccount();
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/auth/account');
    expect(opts.method).toBe('DELETE');
    expect(opts.credentials).toBe('include');
    expect(res.success).toBe(true);
  });

  it('deleteAccount surfaces server errors', async () => {
    ok({ error: 'unauthorized' });
    expect((await api.deleteAccount()).error).toMatch(/unauthorized/);
  });
});

describe('uploadImage', () => {
  it('POSTs base64 to the backend-relative /upload and returns the url', async () => {
    const f = ok({ success: true, url: 'https://cdn/x.png' });
    const res = await api.uploadImage('data:image/png;base64,AAA');
    const [url, opts] = f.mock.calls[0];
    // Backend-relative: built from the configured API base (localhost fallback
    // in test env), never a second hardcoded host beside the client base.
    expect(String(url)).toMatch(/\/upload$/);
    expect(JSON.parse(opts.body)).toEqual({ imageBase64: 'data:image/png;base64,AAA' });
    expect(res.url).toBe('https://cdn/x.png');
  });
});
