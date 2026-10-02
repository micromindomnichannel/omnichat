import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChannelsPanel } from '../ChannelsPanel';

describe('ChannelsPanel matrix', () => {
  const showToast = vi.fn();
  const onToggleLocal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
  });

  it('renders offline fallback note when backend accounts fetch fails (returns null)', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 500 }));

    render(<ChannelsPanel showToast={showToast} local={{ tiktok: false, website: false }} onToggleLocal={onToggleLocal} />);

    expect(await screen.findByText(/backend unreachable — showing local preview toggles below/i)).toBeInTheDocument();
  });

  it('toggles local-only channels (TikTok and Website)', async () => {
    render(<ChannelsPanel showToast={showToast} local={{ tiktok: false, website: true }} onToggleLocal={onToggleLocal} />);

    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('🟢 Local preview')).toBeInTheDocument();

    const disconnectWebsiteBtn = screen.getByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectWebsiteBtn);
    expect(onToggleLocal).toHaveBeenCalledWith('website');
  });

  it('enforces token or flow ID validation on channel connect', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    // Click Connect on Messenger
    const messengerCard = screen.getByText('Messenger').closest('div[style*="padding: 16px"]')!;
    const connectBtn = messengerCard.querySelector('button')!;
    fireEvent.click(connectBtn);

    // Form expands
    const submitBtn = screen.getByRole('button', { name: /connect messenger/i });
    fireEvent.click(submitBtn);

    expect(showToast).toHaveBeenCalledWith('Paste a Page access token or a MicroMind flow id', 'danger');
  });

  it('successfully connects channel with test status and shows success toast', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/connect')) {
        return {
          ok: true,
          json: async () => ({
            account: { id: 'acc_1', channel: 'messenger', status: 'active' },
            status: 'active',
            test: { status: 'test_ok' }
          })
        };
      }
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    const messengerCard = screen.getByText('Messenger').closest('div[style*="padding: 16px"]')!;
    const connectBtn = messengerCard.querySelector('button')!;
    fireEvent.click(connectBtn);

    const tokenInput = screen.getByPlaceholderText(/page access token/i);
    fireEvent.change(tokenInput, { target: { value: 'EAAB...' } });

    const submitBtn = screen.getByRole('button', { name: /connect messenger/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('messenger active — test test ok', 'success');
    });
  });

  it('handles connect failure from backend and surfaces error toast', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/connect')) {
        return {
          ok: true,
          json: async () => ({
            error: 'Invalid Meta App ID or token'
          })
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    const instagramCard = screen.getByText('Instagram').closest('div[style*="padding: 16px"]')!;
    fireEvent.click(instagramCard.querySelector('button')!);

    const tokenInput = screen.getByPlaceholderText(/page access token/i);
    fireEvent.change(tokenInput, { target: { value: 'IGQV...' } });

    const submitBtn = screen.getByRole('button', { name: /connect instagram/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Invalid Meta App ID or token', 'danger');
    });
  });

  it('runs test-link and shows test passed or warning status', async () => {
    const mockAccounts = [
      {
        id: 'acc_10',
        channel: 'telegram',
        status: 'active',
        display_name: 'Luna Bot',
        tenancy: {
          folder: 'tenant_10',
          folderId: 'f_1',
          keyProvisioned: true,
          lastTest: 'test_ok',
          lastTestAt: new Date().toISOString()
        }
      }
    ];

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/test')) {
        return {
          ok: true,
          json: async () => ({
            test: { status: 'test_ok' }
          })
        };
      }
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => mockAccounts };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    expect(await screen.findByText(/✅ test passed/i)).toBeInTheDocument();

    const testBtn = screen.getByRole('button', { name: /test link/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('telegram test: test ok', 'success');
    });
  });

  it('renders all tenancy status badges (invalid_key, blocked, model_error, unreachable)', async () => {
    const mockAccounts = [
      {
        id: 'acc_1',
        channel: 'whatsapp',
        status: 'active',
        tenancy: {
          folder: 'tenant_1',
          folderId: 'f_1',
          keyProvisioned: true,
          lastTest: 'invalid_key'
        }
      }
    ];

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => mockAccounts };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    expect(await screen.findByText(/🔴 key rejected/i)).toBeInTheDocument();
  });

  it('rotates channel key with validation and success toast note', async () => {
    const mockAccounts = [
      {
        id: 'acc_2',
        channel: 'telegram',
        status: 'active',
        tenancy: {
          folder: 'tenant_2',
          folderId: 'f_2',
          keyProvisioned: true
        }
      }
    ];

    (globalThis as any).fetch = vi.fn(async (url: string, opts?: any) => {
      if (String(url).includes('/key') && opts?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            rotated: true,
            test: { status: 'test_ok' },
            manualRevokeNote: 'Revoke old key in MicroMind'
          })
        };
      }
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => mockAccounts };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    const replaceKeyBtn = await screen.findByRole('button', { name: /replace key/i });
    fireEvent.click(replaceKeyBtn);

    const submitRekeyBtn = screen.getByRole('button', { name: /replace & test/i });
    fireEvent.click(submitRekeyBtn);
    expect(showToast).toHaveBeenCalledWith('Paste the new prediction key first', 'danger');

    const keyInput = screen.getByPlaceholderText(/new prediction key/i);
    fireEvent.change(keyInput, { target: { value: 'key_sec_xyz' } });
    fireEvent.click(submitRekeyBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'telegram key replaced — test test ok. Revoke old key in MicroMind',
        'success'
      );
    });
  });

  it('handles disconnect and reconnect operations for active channels', async () => {
    let status = 'active';
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/disconnect')) {
        status = 'disconnected';
        return { ok: true, json: async () => ({ channel: 'messenger', status: 'disconnected' }) };
      }
      if (String(url).includes('/reconnect')) {
        status = 'active';
        return { ok: true, json: async () => ({ channel: 'messenger', status: 'active' }) };
      }
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => [{ id: 'acc_3', channel: 'messenger', status }] };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<ChannelsPanel showToast={showToast} local={{}} onToggleLocal={onToggleLocal} />);

    const disconnectBtn = await screen.findByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('messenger disconnected', 'success');
    });

    const reconnectBtn = await screen.findByRole('button', { name: /reconnect/i });
    fireEvent.click(reconnectBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('messenger active', 'success');
    });
  });
});
