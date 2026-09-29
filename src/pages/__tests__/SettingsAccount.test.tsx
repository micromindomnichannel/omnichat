import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Settings } from '../Settings';

const assignSpy = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: assignSpy },
  writable: true,
});

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <StoreProvider>
        <VerticalProvider>
          <Settings />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  assignSpy.mockClear();
  vi.restoreAllMocks();
  localStorage.clear();
  localStorage.setItem('orbit_authenticated', 'true');
  localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'default', role: 'owner' }]));
  (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => null }));
});

describe('Settings danger zone', () => {
  it('sign-out destroys the server session, clears cache, and leaves', async () => {
    const f = (globalThis as any).fetch;
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(f).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'), expect.anything()
    ));
    expect(localStorage.getItem('orbit_authenticated')).toBeNull();
    expect(assignSpy).not.toHaveBeenCalled(); // logout uses client-side navigate
  });

  it('delete requires two clicks (no accidental wipes)', async () => {
    const f = (globalThis as any).fetch;
    renderSettings();
    const btn = screen.getByRole('button', { name: /delete account/i });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeInTheDocument();
    expect(f).not.toHaveBeenCalledWith(expect.stringContaining('/auth/account'), expect.anything());
  });

  it('confirmed delete calls the API, clears cache, and hard-navigates to login', async () => {
    const f = (globalThis as any).fetch;
    f.mockImplementation(async (url: string) => ({ ok: true, json: async () => ({ success: true }) }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.click(screen.getByRole('button', { name: /click again to confirm/i }));
    await waitFor(() => expect(f).toHaveBeenCalledWith(
      expect.stringContaining('/auth/account'),
      expect.objectContaining({ method: 'DELETE' })
    ));
    expect(localStorage.getItem('orbit_authenticated')).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('failed delete keeps the session and explains', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/auth/account')) {
        return { ok: true, json: async () => ({ error: 'unauthorized' }) };
      }
      return { ok: true, json: async () => null };
    });
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.click(screen.getByRole('button', { name: /click again to confirm/i }));
    await waitFor(() => expect(screen.getByText(/unauthorized|delete failed/i)).toBeInTheDocument());
    expect(localStorage.getItem('orbit_authenticated')).toBe('true');
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
