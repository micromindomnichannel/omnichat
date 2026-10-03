import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Signup } from '../Signup';

const assignSpy = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: assignSpy },
  writable: true,
});

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

describe('Signup step 3: merged business form (single writer)', () => {
  async function reachBusinessStep() {
    const mockOk = (body: any) => {
      (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => body }));
    };
    // Step 1 → OTP: request-code returns success (no user yet).
    mockOk({ success: true });
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Signup />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Ahmed Hassan'), { target: { value: 'Ann Nour' } });
    fireEvent.change(screen.getByPlaceholderText('ahmed@mybusiness.com'), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByPlaceholderText('Create a secure password'), { target: { value: 'supersecret12' } });
    fireEvent.submit(document.querySelectorAll('form')[0]);
    await waitFor(() => expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument());
    // OTP → business: verify returns the session.
    mockOk({ user: { email: 'a@b.c' }, memberships: [] });
    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '123456' } });
    fireEvent.submit(document.querySelectorAll('form')[0]);
    await waitFor(() => expect(screen.getByText('Set up your business')).toBeInTheDocument());
  }

  beforeEach(() => {
    assignSpy.mockClear();
  });

  it('renders every merged field exactly once (no duplicate inputs)', async () => {
    await reachBusinessStep();
    expect(screen.getByPlaceholderText('e.g. Cairo Fashion Store')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Briefly describe what you sell or offer...')).toBeInTheDocument();
    expect(screen.getByText('Business Type *')).toBeInTheDocument();
    expect(screen.getByText('Country / Region')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
    // Exactly one business-name input across the whole page.
    expect(screen.getAllByPlaceholderText('e.g. Cairo Fashion Store')).toHaveLength(1);
  });

  it('gates empty business name without network', async () => {
    const f = vi.fn();
    await reachBusinessStep();
    (globalThis as any).fetch = f;
    const forms = document.querySelectorAll('form');
    fireEvent.submit(forms[forms.length - 1]);
    expect(screen.getByText('Please enter your business name.')).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it('guards logo type and size with exact messages', async () => {
    await reachBusinessStep();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [pdf], configurable: true });
    fireEvent.change(fileInput);
    expect(screen.getByText('Logo must be an image file (PNG, JPG, WEBP).')).toBeInTheDocument();
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [big], configurable: true });
    fireEvent.change(fileInput);
    expect(screen.getByText('Logo must be smaller than 5MB.')).toBeInTheDocument();
  });

  it('submit posts the full profile once and navigates to onboarding', async () => {
    await reachBusinessStep();
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ business_name: 'Cairo Fashion Store' }) }));
    (globalThis as any).fetch = f;
    fireEvent.change(screen.getByPlaceholderText('e.g. Cairo Fashion Store'), { target: { value: 'Cairo Fashion Store' } });
    fireEvent.change(screen.getByPlaceholderText('Briefly describe what you sell or offer...'), { target: { value: 'Fashion retail' } });
    const forms = document.querySelectorAll('form');
    fireEvent.submit(forms[forms.length - 1]);
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith('/onboarding'));
    type FetchCall = [string, { body?: string }];
    const calls = f.mock.calls as unknown as FetchCall[];
    const settingsCalls = calls.filter(([u]) => String(u).includes('/settings'));
    expect(settingsCalls).toHaveLength(1);
    const sentBody = settingsCalls[0]?.[1]?.body;
    expect(sentBody).toBeTruthy();
    expect(JSON.parse(String(sentBody))).toEqual({
      business_name: 'Cairo Fashion Store',
      industry: 'Retail & E-Commerce',
      description: 'Fashion retail',
      logo_url: undefined,
      country: 'Egypt',
    });
  });
});
