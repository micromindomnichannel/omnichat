// Inbox channel separation: Messenger / Instagram / WhatsApp stay separate
// identities — filtering hides rows, it never merges customers or threads.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';
import { ConversationList } from '../ConversationList';

const customers = [
  { id: 'c1', name: 'Sara Adel', phone: '01000000001', channels: ['messenger', 'instagram'] },
  { id: 'c2', name: 'Karim Nasser', phone: '01000000002', channels: ['whatsapp'] },
];

const conversations = [
  {
    id: 'conv_m1', customer_id: 'c1', channel: 'messenger', status: 'ai_handling',
    intent: 'support', last_message: 'Hi, where is my order?', last_message_time: '10:00',
    unread_count: 1, ai_context: {},
  },
  {
    id: 'conv_i1', customer_id: 'c1', channel: 'instagram', status: 'human',
    intent: 'purchase', last_message: 'Is the leather bag in stock?', last_message_time: '10:05',
    unread_count: 0, ai_context: {},
  },
  {
    id: 'conv_w1', customer_id: 'c2', channel: 'whatsapp', status: 'ai_handling',
    intent: 'booking', last_message: 'Book Thursday 11am please', last_message_time: '10:10',
    unread_count: 2, ai_context: {},
  },
];

const bootstrap = {
  products: [], services: [], customers, conversations,
  messages: [], orders: [], appointments: [], automations: [], faqs: [],
};

function mockBackend(convs = conversations) {
  (globalThis as any).fetch = vi.fn(async (url: string) => {
    if (String(url).includes('/bootstrap')) {
      return { ok: true, json: async () => ({ ...bootstrap, conversations: convs }) };
    }
    return { ok: true, json: async () => [] };
  });
}

function renderList(onSelect = vi.fn()) {
  return render(
    <StoreProvider>
      <VerticalProvider>
        <ConversationList selectedId={null} onSelect={onSelect} />
      </VerticalProvider>
    </StoreProvider>
  );
}

function channelGroup() {
  return screen.getByRole('group', { name: /filter by channel/i });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Inbox channel separation', () => {
  it('All view shows every channel identity with a clear label per row', async () => {
    mockBackend();
    renderList();
    await waitFor(() => expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument());
    // All three threads visible together…
    expect(screen.getByText('Hi, where is my order?')).toBeInTheDocument();
    expect(screen.getByText('Is the leather bag in stock?')).toBeInTheDocument();
    // …and every row names its own channel (one filter button + one row label each).
    expect(screen.getAllByText('Messenger')).toHaveLength(2);
    expect(screen.getAllByText('Instagram')).toHaveLength(2);
    expect(screen.getAllByText('WhatsApp')).toHaveLength(2);
  });

  it('Messenger filter shows only messenger threads', async () => {
    mockBackend();
    renderList();
    await waitFor(() => expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument());
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'Messenger' }));
    expect(screen.getByText('Hi, where is my order?')).toBeInTheDocument();
    expect(screen.queryByText('Is the leather bag in stock?')).not.toBeInTheDocument();
    expect(screen.queryByText('Book Thursday 11am please')).not.toBeInTheDocument();
  });

  it('Instagram and WhatsApp filters isolate their own threads', async () => {
    mockBackend();
    renderList();
    await waitFor(() => expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument());
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'Instagram' }));
    expect(screen.getByText('Is the leather bag in stock?')).toBeInTheDocument();
    expect(screen.queryByText('Hi, where is my order?')).not.toBeInTheDocument();
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument();
    expect(screen.queryByText('Is the leather bag in stock?')).not.toBeInTheDocument();
  });

  it('shows an empty state for a channel with no conversations', async () => {
    mockBackend(conversations.slice(0, 2)); // messenger + instagram only
    renderList();
    await waitFor(() => expect(screen.getByText('Hi, where is my order?')).toBeInTheDocument());
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByText('No WhatsApp conversations yet')).toBeInTheDocument();
    expect(screen.queryByText('Hi, where is my order?')).not.toBeInTheDocument();
  });

  it('never merges customers across channels: one customer, two threads, two labels', async () => {
    mockBackend();
    renderList();
    await waitFor(() => expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument());
    // Same customer (Sara Adel) keeps one row PER channel in All view…
    expect(screen.getAllByText('Sara Adel')).toHaveLength(2);
    // …and each channel filter keeps exactly her thread on that channel.
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'Messenger' }));
    expect(screen.getAllByText('Sara Adel')).toHaveLength(1);
    expect(screen.getByText('Hi, where is my order?')).toBeInTheDocument();
    fireEvent.click(within(channelGroup()).getByRole('button', { name: 'Instagram' }));
    expect(screen.getAllByText('Sara Adel')).toHaveLength(1);
    expect(screen.getByText('Is the leather bag in stock?')).toBeInTheDocument();
  });

  it('preserves search, unread counts, and conversation opening', async () => {
    mockBackend();
    const onSelect = vi.fn();
    renderList(onSelect);
    await waitFor(() => expect(screen.getByText('Book Thursday 11am please')).toBeInTheDocument());
    // Unread badges intact.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // Search composes with the channel view.
    fireEvent.change(screen.getByPlaceholderText('Search conversations...'), { target: { value: 'leather bag' } });
    expect(screen.getByText('Is the leather bag in stock?')).toBeInTheDocument();
    expect(screen.queryByText('Hi, where is my order?')).not.toBeInTheDocument();
    // Opening a thread still fires the selection.
    fireEvent.click(screen.getByText('Is the leather bag in stock?'));
    expect(onSelect).toHaveBeenCalledWith('conv_i1');
  });
});
