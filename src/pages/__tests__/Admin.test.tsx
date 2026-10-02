import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Admin } from '../Admin';

describe('Admin dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when admin overview is null or pending', () => {
    (globalThis as any).fetch = vi.fn(async () => new Promise(() => {})); // Never resolves

    render(<Admin />);

    expect(screen.getByText(/loading admin… \(backend unreachable\?\)/i)).toBeInTheDocument();
  });

  it('renders safely when database is down (dbUp: false) with empty table fallbacks', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/overview')) {
        return {
          ok: true,
          json: async () => ({
            dbUp: false,
            workspaces: [],
            channels: [],
            flows: [],
            messages24h: [],
            errors24h: 0
          })
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(<Admin />);

    expect(await screen.findByText(/Internal only — DB down\./i)).toBeInTheDocument();
    // Tables without data render "No data."
    const noDataElements = screen.getAllByText('No data.');
    expect(noDataElements.length).toBeGreaterThan(0);
  });

  it('renders stats and all 5 tables when backend is live and healthy', async () => {
    const mockOverview = {
      dbUp: true,
      workspaces: [{ id: 'ws_1' }, { id: 'ws_2' }],
      channels: [{ n: 4 }],
      flows: [{ n: 3 }],
      messages24h: [{ n: 180 }],
      errors24h: 2
    };

    const mockMm = {
      dbUp: true,
      provisioner: { mode: 'vault_direct' },
      analyst: { flowSet: true, override: 'env' },
      folder: { id: 'fld_xyz123', status: 'ready' }
    };

    const mockChannels = [
      {
        channel: 'instagram',
        display_name: 'Luna Store IG',
        status: 'active',
        micromind_flow_id: 'flow_101',
        folder_status: 'ready',
        key_provisioned: true,
        last_test: 'test_ok',
        conversations: 45,
        last_webhook: '2026-10-02 12:00',
        last_sync: '2026-10-02 12:05'
      }
    ];

    const mockFlows = [
      {
        purpose: 'commerce_inquiry',
        label: 'Commerce Auto-Checkout',
        external_flow_id: 'flow_101',
        source: 'template_v2',
        key_linked: true,
        last_test_status: 'test_ok',
        last_test_at: '2026-10-02T10:00:00Z',
        status: 'published',
        updated_at: '2026-10-02'
      }
    ];

    const mockErrors = {
      webhooks: [
        {
          provider: 'meta_instagram',
          external_event_id: 'evt_998',
          status: 'signature_mismatch',
          created_at: '2026-10-02 11:30'
        }
      ]
    };

    const mockUsage = [
      {
        provider: 'meta_graph',
        day: '2026-10-02T00:00:00Z',
        events: 120,
        processed: 118
      }
    ];

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/overview')) return { ok: true, json: async () => mockOverview };
      if (String(url).includes('/micromind')) return { ok: true, json: async () => mockMm };
      if (String(url).includes('/channels')) return { ok: true, json: async () => mockChannels };
      if (String(url).includes('/flows')) return { ok: true, json: async () => mockFlows };
      if (String(url).includes('/errors')) return { ok: true, json: async () => mockErrors };
      if (String(url).includes('/usage')) return { ok: true, json: async () => mockUsage };
      return { ok: true, json: async () => ({}) };
    });

    render(<Admin />);

    expect(await screen.findByText(/Internal only — DB up\./i)).toBeInTheDocument();

    // Stats
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();

    // Table 1: MicroMind control plane
    expect(screen.getByRole('heading', { name: 'MicroMind control plane' })).toBeInTheDocument();
    expect(screen.getByText('vault_direct')).toBeInTheDocument();

    // Table 2: Channels
    expect(screen.getByRole('heading', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByText('Luna Store IG')).toBeInTheDocument();

    // Table 3: Flows
    expect(screen.getByRole('heading', { name: 'MicroMind flows' })).toBeInTheDocument();
    expect(screen.getByText('Commerce Auto-Checkout')).toBeInTheDocument();

    // Table 4: Errors
    expect(screen.getByRole('heading', { name: 'Errors (24h)' })).toBeInTheDocument();
    expect(screen.getByText('signature_mismatch')).toBeInTheDocument();

    // Table 5: Usage
    expect(screen.getByRole('heading', { name: 'Usage (30d)' })).toBeInTheDocument();
    expect(screen.getByText('meta_graph')).toBeInTheDocument();
  });
});
