import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Settings } from '../Settings';

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

describe('Settings panels & workflows', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('orbit_authenticated', 'true');
    localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'default', role: 'owner' }]));
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => null }));
  });

  it('saves business profile with server success and offline fallbacks', async () => {
    // 1. Success case (PUT /settings)
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      if (opts?.method === 'PUT' && String(url).includes('/settings')) {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => null };
    });

    renderSettings();

    const saveBtn = screen.getByRole('button', { name: /save profile settings/i });
    fireEvent.click(saveBtn);
    expect(await screen.findByText('Business profile saved to server!')).toBeInTheDocument();

    // 2. Offline / null response case
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    fireEvent.click(saveBtn);
    expect(await screen.findByText('Profile saved locally (offline)')).toBeInTheDocument();
  });

  it('validates logo upload file types and processes upload', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/upload')) {
        return { ok: true, json: async () => ({ url: 'https://cdn.orbit.com/logo.png' }) };
      }
      return { ok: true, json: async () => null };
    });

    renderSettings();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Test invalid non-image file
    const txtFile = new File(['text'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });
    expect(await screen.findByText('Select an image file (PNG, JPG, WEBP)')).toBeInTheDocument();
  });

  it('displays fallback copy when plan data is unavailable', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => null }));
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Plan & Usage' }));
    expect(await screen.findByText(/plan data unavailable — backend unreachable/i)).toBeInTheDocument();
  });

  it('displays plan and usage data when backend returns active plan', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/plan')) {
        return {
          ok: true,
          json: async () => ({
            plan: { name: 'Enterprise', channels: 10, teamSeats: 25 },
            usage: { channelsActive: 6, channelsErrored: 1, processed30d: 4200 },
            billing: { note: 'Renews on 1st of month' }
          })
        };
      }
      return { ok: true, json: async () => null };
    });

    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Plan & Usage' }));
    expect(await screen.findByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('4200')).toBeInTheDocument();
    expect(screen.getByText(/renews on 1st of month/i)).toBeInTheDocument();
  });

  it('updates AI settings: engine toggle, tone, language, and custom escalation rules', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'AI Settings' }));

    expect(screen.getByText('ORBIT AI Copilot Engine')).toBeInTheDocument();

    // Change tone to Casual
    const casualBtn = screen.getByRole('button', { name: 'Casual' });
    fireEvent.click(casualBtn);

    // Change language to Both
    const bothBtn = screen.getByRole('button', { name: 'Both' });
    fireEvent.click(bothBtn);

    // Add custom handoff rule
    const ruleInput = screen.getByPlaceholderText(/add custom handoff rule/i);
    fireEvent.change(ruleInput, { target: { value: 'Escalate if order exceeds 5000 EGP' } });
    fireEvent.keyDown(ruleInput, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('Escalate if order exceeds 5000 EGP')).toBeInTheDocument();

    // Delete the added rule
    const deleteRuleBtn = screen.getByText('Escalate if order exceeds 5000 EGP').parentElement?.querySelector('button');
    expect(deleteRuleBtn).toBeTruthy();
    fireEvent.click(deleteRuleBtn!);

    expect(screen.queryByText('Escalate if order exceeds 5000 EGP')).not.toBeInTheDocument();
  });

  it('manages working hours and notifications settings with toast confirmations', async () => {
    renderSettings();

    // Working Hours Tab
    fireEvent.click(screen.getByRole('button', { name: 'Working Hours' }));
    const saveHoursBtn = screen.getByRole('button', { name: /save working hours/i });
    fireEvent.click(saveHoursBtn);
    expect(await screen.findByText('Working hours updated successfully')).toBeInTheDocument();

    // Notifications Tab
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const saveNotifBtn = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(saveNotifBtn);
    expect(await screen.findByText('Notification preferences saved')).toBeInTheDocument();
  });

  it('validates invite member modal and handles success & local fallback', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      if (opts?.method === 'POST' && String(url).includes('/users')) {
        return {
          ok: true,
          json: async () => ({
            user: { id: 'u_new', email: 'agent.sarah@orbit.com' }
          })
        };
      }
      return { ok: true, json: async () => null };
    });

    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Team Members' }));

    // Open Invite modal
    fireEvent.click(screen.getByRole('button', { name: /invite new member/i }));
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument();

    // 1. Validation error: password < 10 chars
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'agent.sarah@orbit.com' } });
    fireEvent.change(screen.getByPlaceholderText(/temporary password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Email + 10-char password required')).toBeInTheDocument();

    // 2. Valid submission
    fireEvent.change(screen.getByPlaceholderText(/temporary password/i), { target: { value: 'superSecurePassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Account created for agent.sarah@orbit.com')).toBeInTheDocument();
    expect(screen.queryByText('Invite Team Member')).not.toBeInTheDocument();
  });
});
