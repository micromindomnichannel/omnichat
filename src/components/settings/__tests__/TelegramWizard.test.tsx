// TelegramWizard: guided BotFather flow — external create step, pasted-token
// validate & connect, auto webhook status, manual fallback only when needed.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TelegramWizard } from '../TelegramWizard';

describe('TelegramWizard', () => {
  const showToast = vi.fn();
  const onDone = vi.fn();
  const props = { workspaceId: 'default', showToast, onDone };

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  });

  it('shows the BotFather create step with exact commands', () => {
    render(<TelegramWizard {...props} />);
    expect(screen.getByText('Connect Telegram Bot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open @botfather/i })).toBeInTheDocument();
    expect(screen.getByText('/newbot')).toBeInTheDocument();
    expect(screen.getByText(/username ending in bot/i)).toBeInTheDocument();
  });

  it('opens BotFather in a new tab without navigating away', () => {
    const openSpy = vi.fn();
    (window as any).open = openSpy;
    render(<TelegramWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /open @botfather/i }));
    expect(openSpy).toHaveBeenCalledWith('https://t.me/BotFather', '_blank', 'noopener');
  });

  it('requires a token before validating', () => {
    render(<TelegramWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));
    expect(showToast).toHaveBeenCalledWith('Paste the bot token from @BotFather first', 'danger');
  });

  it('sends botToken (not page token) and shows connected state with auto webhook', async () => {
    let sentBody: any = null;
    (globalThis as any).fetch = vi.fn(async (_url: string, opts: any) => {
      sentBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          account: { id: 'acc_tg', channel: 'telegram', username: 'luna_store_bot', status: 'active' },
          status: 'active',
          test: { status: 'test_ok' },
          intake: { attempted: true, ok: true, url: 'https://api.example/webhooks/telegram' },
        }),
      };
    });
    render(<TelegramWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.change(screen.getByPlaceholderText(/bot token from @botfather/i), { target: { value: '123:ABC' } });
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));

    await waitFor(() => expect(screen.getByText(/connected as @luna_store_bot/i)).toBeInTheDocument());
    expect(sentBody.botToken).toBe('123:ABC');
    expect(sentBody.pageAccessToken).toBeUndefined();
    expect(screen.getByText(/webhook registered automatically/i)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('telegram active — test test ok', 'success');
  });

  it('shows the one-time manual fallback only when auto-registration fails', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        account: { id: 'acc_tg', channel: 'telegram', username: 'luna_store_bot', status: 'active' },
        status: 'active',
        test: { status: 'skipped' },
        intake: { attempted: true, ok: false, error: 'backend URL not configured', url: 'https://api.example/webhooks/telegram' },
        webhookSecret: 'once-only-secret',
      }),
    }));
    render(<TelegramWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.change(screen.getByPlaceholderText(/bot token from @botfather/i), { target: { value: '123:ABC' } });
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));

    await waitFor(() => expect(screen.getByText(/didn't complete/i)).toBeInTheDocument());
    expect(screen.getByText(/once-only-secret/)).toBeInTheDocument();
  });

  it('surfaces invalid-token errors without advancing', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 'invalid_bot_token', error: 'Telegram token invalid (Unauthorized)' }),
    }));
    render(<TelegramWizard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /i have my token/i }));
    fireEvent.change(screen.getByPlaceholderText(/bot token from @botfather/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /validate & connect/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Telegram token invalid (Unauthorized)', 'danger');
    });
    expect(screen.queryByText(/connected as/i)).not.toBeInTheDocument();
  });
});
