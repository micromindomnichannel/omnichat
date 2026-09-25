// Login regression suite for the 2026-09-25 redirect loop:
// the session guard resolves once on mount, so post-auth MUST hard-navigate
// (window.location.assign) instead of client-side navigate — otherwise App
// bounces back to /login on the stale 'out' state.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

const assignSpy = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: assignSpy },
  writable: true,
});

function fillAndSubmit(email: string, password: string) {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByPlaceholderText(/admin@orbit-platform.com/i), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: password } });
  // Submit the form element directly (see note in the empty-submit test).
  const form = screen.getByRole('button', { name: /sign in to orbit/i }).closest('form');
  if (!form) throw new Error('login form not found');
  fireEvent.submit(form);
}

beforeEach(() => {
  assignSpy.mockClear();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Login', () => {
  it('blocks empty submit without touching the network', () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );
    // Submit the form element directly: jsdom does not implement implicit
    // submission via button click, so fireEvent.click would never reach onSubmit.
    const form = screen.getByRole('button', { name: /sign in to orbit/i }).closest('form');
    if (!form) throw new Error('login form not found');
    fireEvent.submit(form);
    expect(screen.getByText(/enter your email and password/i)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('on success caches session and HARD-navigates to /overview', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: { email: 'owner@biz.com', display_name: 'Owner' }, memberships: [{ workspace_id: 'default', role: 'owner' }] }),
    }));
    fillAndSubmit('owner@biz.com', 'supersecret12');
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith('/overview'));
    expect(localStorage.getItem('orbit_authenticated')).toBe('true');
    expect(JSON.parse(localStorage.getItem('orbit_memberships') || '[]')).toEqual([
      { workspace_id: 'default', role: 'owner' },
    ]);
  });

  it('on invalid credentials shows the server error and stays put', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ error: 'Invalid email or password.' }),
    }));
    fillAndSubmit('owner@biz.com', 'wrongpassword1');
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('on unreachable backend explains instead of hanging', async () => {
    (globalThis as any).fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    fillAndSubmit('owner@biz.com', 'supersecret12');
    await waitFor(() => expect(screen.getByText(/cannot reach the backend/i)).toBeInTheDocument());
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
