// Thread resilience: a conversation whose customer record hasn't synced yet
// (brand-new Telegram/Discord customers) must still open — with a fallback
// identity — instead of refusing with "Select a conversation to start".
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';
import { ConversationThread } from '../ConversationThread';

const telegramConv = {
  id: 'conv_tg1', customer_id: 'telegram_abc123xyz', channel: 'telegram', status: 'ai_handling',
  intent: 'support', last_message: 'مرحبا', last_message_time: '10:00',
  unread_count: 1, ai_context: {},
};

function mockBootstrap(customers: any[]) {
  return mockBootstrapFull(customers, []);
}

function mockBootstrapFull(customers: any[], messages: any[]) {
  (globalThis as any).fetch = vi.fn(async (url: string) => {
    if (String(url).includes('/bootstrap')) {
      return {
        ok: true,
        json: async () => ({
          products: [], services: [], customers, conversations: [telegramConv],
          messages: [], orders: [], appointments: [], automations: [], faqs: [],
        }),
      };
    }
    return { ok: true, json: async () => [] };
  });
}

function renderThread() {
  return render(
    <StoreProvider>
      <VerticalProvider>
        <ConversationThread conversationId="conv_tg1" />
      </VerticalProvider>
    </StoreProvider>
  );
}

describe('ConversationThread customer fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Element as any).prototype.scrollIntoView = vi.fn();
  });

  it('opens with a fallback identity when the customer record is missing', async () => {
    mockBootstrap([]);
    renderThread();
    await waitFor(() => expect(screen.queryByText(/select a conversation to start/i)).not.toBeInTheDocument());
    expect(screen.getByText(/customer 123xyz/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ai is handling/i)).toBeInTheDocument();
  });

  it('shows the real name once the customer syncs', async () => {
    mockBootstrap([{ id: 'telegram_abc123xyz', name: 'Omar Farouk', channels: ['telegram'] }]);
    renderThread();
    await waitFor(() => expect(screen.getByText('Omar Farouk')).toBeInTheDocument());
  });

  it('formats raw ISO message stamps as short local times', async () => {
    const stamp = new Date(Date.now() - 60000).toISOString();
    const expected = new Date(stamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            products: [], services: [],
            customers: [{ id: 'telegram_abc123xyz', name: 'Omar Farouk', channels: ['telegram'] }],
            conversations: [{
              id: 'conv_tg1', customer_id: 'telegram_abc123xyz', channel: 'telegram', status: 'ai_handling',
              intent: 'support', last_message: 'hi', last_message_time: stamp,
              unread_count: 0, updated_at: stamp, ai_context: {},
            }],
            messages: [{ id: 'm1', conversation_id: 'conv_tg1', sender: 'customer', content: 'hi', timestamp: stamp }],
            orders: [], appointments: [], automations: [], faqs: [],
          }),
        };
      }
      return { ok: true, json: async () => [] };
    });
    renderThread();
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(stamp.slice(0, 10)))).not.toBeInTheDocument();
  });
});
