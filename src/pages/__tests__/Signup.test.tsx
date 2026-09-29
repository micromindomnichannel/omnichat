import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Signup } from '../Signup';

function mockFetchOnce(impl: (url: any, opts: any) => any) {
  (globalThis as any).fetch = vi.fn(impl);
  return (globalThis as any).fetch;
}

const ok = (body: any) => mockFetchOnce(async () => ({ ok: true, json: async () => body }));

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Signup />
    </MemoryRouter>
  );
}

function fillStep1(name = 'Ann Nour', email = 'a@b.c', password = 'supersecret12') {
  fireEvent.change(screen.getByPlaceholderText('Ahmed Hassan'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('ahmed@mybusiness.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Create a secure password'), { target: { value: password } });
}

function submitCurrentForm() {
  const forms = document.querySelectorAll('form');
  fireEvent.submit(forms[forms.length - 1]);
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('Signup step 1', () => {
  it('gates empty fields without network', () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    renderSignup();
    submitCurrentForm();
    expect(screen.getByText(/fill in all required fields/i)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it('gates short passwords without network', () => {
    const f = vi.fn();
    (globalThis as any).fetch = f;
    renderSignup();
    fillStep1('Ann Nour', 'a@b.c', 'short');
    submitCurrentForm();
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it('success advances to OTP step and surfaces a dev code when provided', async () => {
    ok({ success: true, debugCode: '424242' });
    renderSignup();
    fillStep1();
    submitCurrentForm();
    await waitFor(() => expect(screen.getByText('Verify your email')).toBeInTheDocument());
    expect(screen.getByText('424242')).toBeInTheDocument();
  });

  it('server errors display verbatim', async () => {
    ok({ error: 'email taken' });
    renderSignup();
    fillStep1();
    submitCurrentForm();
    await waitFor(() => expect(screen.getByText(/email taken/i)).toBeInTheDocument());
  });

  it('unreachable backend explains (the reported signup failure)', async () => {
    mockFetchOnce(async () => { throw new TypeError('Failed to fetch'); });
    renderSignup();
    fillStep1();
    submitCurrentForm();
    await waitFor(() => expect(screen.getByText(/cannot reach the backend/i)).toBeInTheDocument());
  });
});

describe('Signup OTP verify', () => {
  async function reachOtpStep() {
    ok({ success: true });
    renderSignup();
    fillStep1();
    submitCurrentForm();
    await waitFor(() => expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument());
  }

  it('gates malformed codes without network', async () => {
    const f = vi.fn();
    await reachOtpStep();
    (globalThis as any).fetch = f;
    // Non-digits are stripped by the input; empty submit hits the format gate.
    // (The helper paragraph also mentions "6-digit code" — match the error copy.)
    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '' } });
    submitCurrentForm();
    expect(screen.getByText('Enter the 6-digit code from your email.')).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it('success caches session and advances to business step', async () => {
    await reachOtpStep();
    ok({ user: { email: 'a@b.c' }, memberships: [{ workspace_id: 'default', role: 'owner' }] });
    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '123456' } });
    submitCurrentForm();
    await waitFor(() => expect(screen.getByText('Set up your business')).toBeInTheDocument());
    expect(localStorage.getItem('orbit_authenticated')).toBe('true');
    expect(JSON.parse(localStorage.getItem('orbit_memberships') || '[]')).toEqual([
      { workspace_id: 'default', role: 'owner' },
    ]);
  });

  it('wrong code shows the server message and stays', async () => {
    await reachOtpStep();
    ok({ error: 'incorrect code' });
    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '000000' } });
    submitCurrentForm();
    await waitFor(() => expect(screen.getByText(/incorrect code/i)).toBeInTheDocument());
    expect(localStorage.getItem('orbit_authenticated')).toBeNull();
  });

  it('resend arms a 30s cooldown (no accidental double-send)', async () => {
    await reachOtpStep();
    const btn = screen.getByRole('button', { name: /resend in 30s/i });
    expect(btn).toBeDisabled();
  });
});
