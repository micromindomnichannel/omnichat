// Normalize PostgreSQL snake_case rows -> frontend camelCase models.
// Used at bootstrap so the Inbox (and lists) render REAL backend data when the
// API is up, while keeping the mock catalog as offline fallback.
import type { Channel, Conversation, Message, Customer } from '../state/mockData';
import { getAvatar } from '../state/mockData';

const VALID_CHANNELS: Channel[] = ['instagram', 'whatsapp', 'facebook', 'messenger', 'telegram', 'gmail', 'tiktok', 'website'];

export function toChannel(v: any): Channel {
  return (VALID_CHANNELS as string[]).includes(v) ? v : 'website';
}

function parseJson(v: any, fallback: any) {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function normalizeConversation(row: any): Conversation {
  const ctx = parseJson(row.ai_context, {});
  return {
    id: String(row.id),
    customerId: String(row.customer_id || ''),
    channel: toChannel(row.channel),
    status: row.status || 'ai_handling',
    intent: row.intent || 'support',
    lastMessage: row.last_message || '',
    lastMessageTime: row.last_message_time || row.updated_at || '',
    unreadCount: Number(row.unread_count || 0),
    aiContext: {
      intent: ctx.intent || row.intent || 'support',
      stage: ctx.stage || 'new',
      aiStatus: ctx.aiStatus || (row.ai_enabled === false ? 'human' : 'active'),
      toolsUsed: ctx.toolsUsed || [],
    },
  };
}

export function normalizeMessage(row: any): Message {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id || ''),
    sender: ['customer', 'ai', 'human', 'system'].includes(row.sender) ? row.sender : 'customer',
    content: row.content || '',
    timestamp: row.timestamp || row.created_at || '',
    agentName: row.agent_name || undefined,
    isArabic: !!row.is_arabic,
    mediaUrl: row.media_url || undefined,
  };
}

export function groupMessages(rows: any[]): Record<string, Message[]> {
  const grouped: Record<string, Message[]> = {};
  for (const row of rows) {
    const m = normalizeMessage(row);
    (grouped[m.conversationId] = grouped[m.conversationId] || []).push(m);
  }
  return grouped;
}

export function normalizeCustomer(row: any): Customer {
  const reliability = parseJson(row.reliability, {});
  const channels = Array.isArray(row.channels) ? row.channels.filter((c: any) => (VALID_CHANNELS as string[]).includes(c)) : [];
  return {
    id: String(row.id),
    name: row.name || 'Customer',
    avatar: row.avatar || getAvatar(row.name || 'Customer'),
    phone: row.phone || '',
    channels: (channels.length ? channels : ['website']) as Channel[],
    customerSince: row.customer_since || row.created_at || '',
    tags: row.tags || [],
    status: ['New', 'Returning', 'VIP'].includes(row.status) ? row.status : 'New',
    totalSpent: Number(row.total_spent || 0),
    totalOrders: Number(row.orders_count || 0),
    totalAppointments: 0,
    reliability: {
      status: reliability.status || 'Good',
      completed: Number(reliability.completed || 0),
      cancellations: Number(reliability.cancellations || 0),
      returns: Number(reliability.returns || 0),
      noShows: Number(reliability.noShows || 0),
    },
  };
}
