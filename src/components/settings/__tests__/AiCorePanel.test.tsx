// AiCorePanel: analyst/folder/knowledge status (owner/admin data, null-safe)
// plus a safe test prompt with an honest source badge. Never renders keys,
// tokens, or vault material — the endpoints used return status + answers only.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiCorePanel } from '../AiCorePanel';

describe('AiCorePanel', () => {
  const showToast = vi.fn();
  const props = { workspaceId: 'default', showToast };

  beforeEach(() => vi.clearAllMocks());

  it('shows analyst + folder + knowledge status from backend surfaces', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/admin/micromind')) {
        return { ok: true, json: async () => ({ analyst: { flowSet: true, override: 'env' }, folder: { id: 'folder_abc123', status: 'ready' } }) };
      }
      if (String(url).includes('/knowledge')) {
        return { ok: true, json: async () => ([{ id: 'k1' }, { id: 'k2' }]) };
      }
      return { ok: true, json: async () => ({}) };
    });
    render(<AiCorePanel {...props} />);
    await waitFor(() => expect(screen.getByText('Configured (env)')).toBeInTheDocument());
    expect(screen.getByText(/ready \(folder_a/)).toBeInTheDocument();
    expect(screen.getByText('Local match always available')).toBeInTheDocument();
  });

  it('degrades honestly for non-admin viewers (no analyst data)', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: 'forbidden' }) }));
    render(<AiCorePanel {...props} />);
    await waitFor(() => expect(screen.getByText(/owner\/admin only/i)).toBeInTheDocument());
  });

  it('runs a safe test prompt and badges a local answer honestly', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/knowledge/ask')) {
        return { ok: true, json: async () => ({ answer: 'We ship in 1-3 days.', source: 'local-match' }) };
      }
      return { ok: true, json: async () => [] };
    });
    render(<AiCorePanel {...props} />);
    fireEvent.change(screen.getByLabelText('Safe test prompt'), { target: { value: 'shipping time?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await waitFor(() => expect(screen.getByText('We ship in 1-3 days.')).toBeInTheDocument());
    expect(screen.getByText('🟡 Local match')).toBeInTheDocument();
  });

  it('requires a question before asking', () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
    render(<AiCorePanel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    expect(showToast).toHaveBeenCalledWith('Type a test question first', 'danger');
  });
});
