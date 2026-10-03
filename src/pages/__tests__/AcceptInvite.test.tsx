import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AcceptInvite } from '../AcceptInvite';

function renderAccept(token: string | null) {
  return render(
    <MemoryRouter initialEntries={[token ? `/accept-invite?token=${token}` : '/accept-invite']}>
      <AcceptInvite />
    </MemoryRouter>
  );
}

describe('AcceptInvite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('warns when the token is missing', () => {
    renderAccept(null);
    expect(screen.getByText(/missing invitation token/i)).toBeInTheDocument();
  });

  it('shows invalid-link copy when lookup fails', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    renderAccept('bad-token');
    expect(await screen.findByText(/invalid|unreachable/i)).toBeInTheDocument();
  });

  it('renders the invite and joins on accept', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/accept')) {
        return { ok: true, json: async () => ({ success: true, workspace_id: 'ws_1', role: 'agent' }) };
      }
      return {
        ok: true,
        json: async () => ({ email: 'agent@biz.com', role: 'agent', workspaceName: 'Luna Store' }),
      };
    });
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', { value: { assign: assignSpy, href: 'http://localhost/' }, writable: true });

    renderAccept('tok_123');
    expect(await screen.findByText(/Luna Store/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/choose a password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /accept & join workspace/i }));
    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/choose a password/i), { target: { value: 'superSecurePassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /accept & join workspace/i }));
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith('/overview'));
    expect(localStorage.getItem('orbit_authenticated')).toBe('true');
  });
});
