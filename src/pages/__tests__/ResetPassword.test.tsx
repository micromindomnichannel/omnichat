import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResetPassword } from '../ResetPassword';

const ok = (body: any) => {
  (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => body }));
  return (globalThis as any).fetch;
};

function renderReset(token: string | null) {
  const entry = token ? `/reset?token=${token}` : '/reset';
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ResetPassword />
    </MemoryRouter>
  );
}

function submitNewPassword(pw: string) {
  fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: pw } });
  fireEvent.submit(document.querySelector('form')!);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ResetPassword', () => {
  it('warns on a missing token and disables submit', () => {
    renderReset(null);
    expect(screen.getByText(/missing reset token/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled();
  });

  it('gates short passwords without network', () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    renderReset('tok123');
    submitNewPassword('short');
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it('success swaps the form for a back-to-signin action', async () => {
    const f = ok({ success: true });
    renderReset('tok123');
    submitNewPassword('newsupersecret');
    // Done state renders the action (the message string itself is not shown).
    await waitFor(() => expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument());
    const [url, opts] = f.mock.calls[0];
    expect(String(url)).toContain('/auth/reset');
    expect(JSON.parse(opts.body)).toEqual({ token: 'tok123', password: 'newsupersecret' });
  });

  it('expired token shows the server message', async () => {
    ok({ error: 'invalid or expired token' });
    renderReset('staletoken');
    submitNewPassword('newsupersecret');
    await waitFor(() => expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument());
  });

  it('unreachable backend explains instead of hanging', async () => {
    (globalThis as any).fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    renderReset('tok123');
    submitNewPassword('newsupersecret');
    await waitFor(() => expect(screen.getByText(/backend unreachable/i)).toBeInTheDocument());
  });
});
