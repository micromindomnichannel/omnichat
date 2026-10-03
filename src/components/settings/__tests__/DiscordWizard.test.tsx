// DiscordWizard: guided Developer Portal flow — external create step,
// pasted-token validate & connect, gateway listener status, no webhook.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscordWizard } from '../DiscordWizard';

describe('DiscordWizard', () => {
  const showToast = vi.fn();
  const onDone = vi.fn();
  const props = { workspaceId: 'default', showToast, onDone };

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  });

  it('shows the Developer Portal create step with intent + invite guidance', () => {
    render(<DiscordWizard {...props} />);
    expect(screen.getByText('Connect Discord Bot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open developer portal/i })).toBeInTheDocument();
    expect(screen.getByText(/message content intent/i)).toBeInTheDocument();
    expect(screen.getByText(/view channel/i)).toBeInTheDocument();
  });

  it('opens the Developer Portal in a new tab without navigating away', () => {
    const openSpy = vi.fn();
    (window as any).open = openSpy;
    render(<DiscordWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /open developer portal/i }));
    expect(openSpy).toHaveBeenCalledWith('https://discord.com/developers/applications', '_blank', 'noopener');
  });

  it('requires a token before validating', () => {
    render(<DiscordWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));
    expect(showToast).toHaveBeenCalledWith('Paste the bot token from the Developer Portal first', 'danger');
  });

  it('sends botToken and shows connected state with gateway note', async () => {
    let sentBody: any = null;
    (globalThis as any).fetch = vi.fn(async (_url: string, opts: any) => {
      sentBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          account: { id: 'acc_dc', channel: 'discord', username: 'orbitbot', status: 'active' },
          status: 'active',
          test: { status: 'test_ok' },
        }),
      };
    });
    render(<DiscordWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.change(screen.getByPlaceholderText(/bot token \(developer portal/i), { target: { value: 'DC_TOKEN' } });
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));

    await waitFor(() => expect(screen.getByText(/connected as @orbitbot/i)).toBeInTheDocument());
    expect(sentBody.botToken).toBe('DC_TOKEN');
    expect(sentBody.pageAccessToken).toBeUndefined();
    expect(screen.getByText(/gateway listener started/i)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('discord active — test test ok', 'success');
  });

  it('surfaces invalid-token errors without advancing', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 'invalid_bot_token', error: 'Discord token invalid (unauthorized)' }),
    }));
    render(<DiscordWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.change(screen.getByPlaceholderText(/bot token \(developer portal/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Discord token invalid (unauthorized)', 'danger');
    });
    expect(screen.queryByText(/connected as/i)).not.toBeInTheDocument();
  });
});
