// Normalize PostgreSQL snake_case rows -> frontend camelCase models.
// The store renders backend data exclusively; empty tables render empty UI
// (loading/empty states), never mock fallbacks.
import type { Channel, Conversation, Message, Customer, Product, Service, Order, Appointment, FAQ, Automation } from '../state/mockData';
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
    updatedAt: row.updated_at || row.last_message_time || '',
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

export function normalizeCustomer(row: any): Customer {  const reliability = parseJson(row.reliability, {});
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

// ---- Catalog / transaction rows (DB snake_case -> UI models, null-safe) ----
export function normalizeProduct(row: any): Product {
  return {
    id: String(row.id),
    name: row.name || 'Untitled product',
    sku: row.sku || '',
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    category: row.category || 'General',
    image: row.image || '',
    variants: Array.isArray(row.variants) ? row.variants : [],
  };
}

export function normalizeService(row: any): Service {
  return {
    id: String(row.id),
    name: row.name || 'Untitled service',
    price: Number(row.price || 0),
    duration: Number(row.duration || 30),
    category: row.category || 'General',
    description: row.description || '',
    availability: Array.isArray(row.availability) ? row.availability : [],
  };
}

export function normalizeOrder(row: any): Order {
  return {
    id: String(row.id),
    customerId: String(row.customer_id || ''),
    productId: String(row.product_id || ''),
    productName: row.product_name || '',
    variant: row.variant || undefined,
    quantity: Number(row.quantity || 1),
    total: Number(row.total || 0),
    status: ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(row.status) ? row.status : 'Confirmed',
    date: row.date || row.created_at || '',
    paymentMethod: row.payment_method === 'Card' ? 'Card' : 'COD',
    governorate: row.governorate || '',
    address: row.address || '',
  };
}

export function normalizeAppointment(row: any): Appointment {
  const status = ['Confirmed', 'Completed', 'No-show', 'Cancelled'].includes(row.status) ? row.status : 'Confirmed';
  return {
    id: String(row.id),
    customerId: String(row.customer_id || ''),
    serviceId: String(row.service_id || ''),
    serviceName: row.service_name || '',
    date: row.date || '',
    time: row.time || '',
    status,
    duration: Number(row.duration || 30),
  };
}

// ---- Real activity series (replaces hardcoded chart data) ----
export function parseTime(v: any): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

// Last `days` buckets (oldest -> newest) of {label, messages, aiReplies}.
export function bucketMessagesByDay(messages: Message[], days = 7) {
  const out: Array<{ label: string; messages: number; aiReplies: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    let messagesCount = 0;
    let aiCount = 0;
    for (const m of messages) {
      const t = parseTime((m as any).timestamp || (m as any).created_at);
      if (t === null || t < d.getTime() || t >= next.getTime()) continue;
      messagesCount++;
      if (m.sender === 'ai') aiCount++;
    }
    out.push({
      label: d.toLocaleDateString([], { weekday: 'short' }),
      messages: messagesCount,
      aiReplies: aiCount,
    });
  }
  return out;
}

export function countByChannel(conversations: Conversation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of conversations) counts[c.channel] = (counts[c.channel] || 0) + 1;
  return counts;
}

export function normalizeFAQ(row: any): FAQ {
  return {
    id: String(row.id),
    question: row.question || '',
    answer: row.answer || '',
    category: row.category || 'General',
    vertical: row.vertical === 'appointments' ? 'appointments' : 'commerce',
  };
}

export function normalizeAutomation(row: any): Automation {
  return {
    id: String(row.id),
    name: row.name || 'Automation',
    active: row.active !== false,
    steps: Array.isArray(row.steps) ? row.steps : [],
    vertical: row.vertical === 'appointments' ? 'appointments' : 'commerce',
  };
}
