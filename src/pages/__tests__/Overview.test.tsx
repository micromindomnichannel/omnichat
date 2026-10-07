// Overview live pulse: every metric derives from backend rows in range —
// no demo numbers, honest empty states, channel separation preserved.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Overview } from '../Overview';

const minuteAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

function mockBootstrap(data: any) {
  (globalThis as any).fetch = vi.fn(async (url: string) => {
    if (String(url).includes('/bootstrap')) {
      return { ok: true, json: async () => data };
    }
    return { ok: true, json: async () => [] };
  });
}

const populated = () => ({
  products: [{ id: 'p1', name: 'Serum', price: 500, stock: 20, category: 'General', image: '', variants: [] }],
  services: [],
  customers: [
    { id: 'c1', name: 'Sara Adel', channels: ['messenger'] },
    { id: 'c2', name: 'Omar Farouk', channels: ['instagram'] },
  ],
  conversations: [
    {
      id: 'conv_m1', customer_id: 'c1', channel: 'messenger', status: 'ai_handling',
      intent: 'purchase', last_message: 'Is it in stock?', last_message_time: minuteAgo(5),
      unread_count: 2, updated_at: minuteAgo(5), ai_context: {},
    },
    {
      id: 'conv_i1', customer_id: 'c2', channel: 'instagram', status: 'human',
      intent: 'support', last_message: 'Thanks!', last_message_time: minuteAgo(65),
      unread_count: 0, updated_at: minuteAgo(65), ai_context: {},
    },
  ],
  messages: [
    { id: 'm1', conversation_id: 'conv_m1', sender: 'customer', content: 'hi', timestamp: minuteAgo(65), source: 'webhook' },
    { id: 'm2', conversation_id: 'conv_m1', sender: 'ai', content: 'hello', timestamp: minuteAgo(64), source: 'ai' },
  ],
  orders: [], appointments: [], automations: [], faqs: [],
});

function renderOverview() {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <Overview />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Overview live pulse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom has no ResizeObserver; recharts ResponsiveContainer needs the stub.
    (globalThis as any).ResizeObserver = vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }));
  });

  it('renders backend-derived metrics, channel mix, and activity', async () => {
    mockBootstrap(populated());
    renderOverview();
    await waitFor(() => expect(screen.getByText('Live inbox pulse (last 7 days)')).toBeInTheDocument());
    // Metric stats (labels + values rendered as separate nodes; assert labels + key values)
    expect(screen.getByText('Threads')).toBeInTheDocument();
    expect(screen.getByText('Buying intent')).toBeInTheDocument();
    expect(screen.getByText('Avg response')).toBeInTheDocument();
    expect(screen.getByText('1m 0s')).toBeInTheDocument(); // 60s paired latency
    expect(screen.getByText('Messages by channel')).toBeInTheDocument();
    expect(screen.getByText('AI vs human replies')).toBeInTheDocument();
    expect(screen.getByText('Recent channel activity')).toBeInTheDocument();
    // Threads table shows customer names, never raw ids
    expect(screen.getByText('Sara Adel')).toBeInTheDocument();
    expect(screen.queryByText(/Thread #conv_m1/)).not.toBeInTheDocument();
  });

  it('shows honest empty states with no data in range', async () => {
    mockBootstrap({
      products: [], services: [], customers: [], conversations: [], messages: [],
      orders: [], appointments: [], automations: [], faqs: [],
    });
    renderOverview();
    await waitFor(() => expect(screen.getByText('No conversations in range')).toBeInTheDocument());
  });

  it('switches the pulse range without inventing data', async () => {
    mockBootstrap(populated());
    renderOverview();
    await waitFor(() => expect(screen.getByText('Live inbox pulse (last 7 days)')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '30 days' }));
    expect(screen.getByText('Live inbox pulse (last 30 days)')).toBeInTheDocument();
  });
});
