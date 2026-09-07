// ORBIT Omnichannel API Client for PostgreSQL Database Sync

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

async function fetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // session cookie (httpOnly, set by backend)
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[DB Sync Warning] Request to ${url} failed, using local sync state.`, err);
    return null;
  }
}

// Raw auth calls: surface server error bodies (invalid credentials, closed
// registration) instead of collapsing to null. Still null when unreachable.
async function authJson(url: string, body?: any) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json().catch(() => null);
  } catch (err) {
    console.warn(`[Auth Warning] Request to ${url} failed.`, err);
    return null;
  }
}

export const api = {
  // Auth (session cookie; null only when unreachable)
  signup: (email: string, password: string, displayName?: string) => authJson('/auth/signup', { email, password, displayName }),
  login: (email: string, password: string) => authJson('/auth/login', { email, password }),
  logout: () => authJson('/auth/logout'),
  me: () => fetchJson('/auth/me'),

  // Bootstrap & Health
  getBootstrap: () => fetchJson('/bootstrap'),
  getHealth: () => fetchJson('/health'),

  // Products
  getProducts: () => fetchJson('/products'),
  addProduct: (product: any) => fetchJson('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (product: any) => fetchJson(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id: string) => fetchJson(`/products/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => fetchJson('/services'),
  addService: (service: any) => fetchJson('/services', { method: 'POST', body: JSON.stringify(service) }),
  updateService: (service: any) => fetchJson(`/services/${service.id}`, { method: 'PUT', body: JSON.stringify(service) }),
  deleteService: (id: string) => fetchJson(`/services/${id}`, { method: 'DELETE' }),

  // Messages & Conversations
  getConversations: () => fetchJson('/conversations'),
  getThreadMessages: (id: string) => fetchJson(`/v1/conversations/${id}/messages`),
  addMessage: (conversationId: string, message: any) => fetchJson('/messages', { method: 'POST', body: JSON.stringify({ conversationId, message }) }),
  updateConversationStatus: (id: string, status: string) => fetchJson(`/conversations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Customers
  getCustomers: () => fetchJson('/customers'),
  updateCustomer: (customer: any) => fetchJson(`/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(customer) }),

  // Orders
  getOrders: () => fetchJson('/orders'),
  addOrder: (order: any) => fetchJson('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrder: (order: any) => fetchJson(`/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) }),
  confirmOrderAI: (data: any) => fetchJson('/orders/ai-confirm', { method: 'POST', body: JSON.stringify(data) }),

  // Appointments
  getAppointments: () => fetchJson('/appointments'),
  addAppointment: (appointment: any) => fetchJson('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
  updateAppointment: (appointment: any) => fetchJson(`/appointments/${appointment.id}`, { method: 'PUT', body: JSON.stringify(appointment) }),

  // Automations & FAQs
  toggleAutomation: (id: string) => fetchJson(`/automations/${id}/toggle`, { method: 'POST' }),
  addFaq: (faq: any) => fetchJson('/faqs', { method: 'POST', body: JSON.stringify(faq) }),
  deleteFaq: (id: string) => fetchJson(`/faqs/${id}`, { method: 'DELETE' }),

  // Content Schedules
  getSchedules: () => fetchJson('/schedules'),
  addSchedule: (schedule: any) => fetchJson('/schedules', { method: 'POST', body: JSON.stringify(schedule) }),
  deleteSchedule: (id: string) => fetchJson(`/schedules/${id}`, { method: 'DELETE' }),

  // Executive Reports
  getReports: () => fetchJson('/reports'),
  generateReport: (period: string) => fetchJson('/reports/generate', { method: 'POST', body: JSON.stringify({ period }) }),

  // Business Settings
  getSettings: () => fetchJson('/settings'),
  updateSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Channel connections (multi-tenant slice; null when backend unreachable -> local fallback)
  getChannels: (workspaceId = 'default') => fetchJson(`/v1/workspaces/${workspaceId}/channels`),
  connectChannel: (workspaceId: string, channel: string, payload: any) =>
    fetchJson(`/v1/workspaces/${workspaceId}/channels/${channel}/connect`, { method: 'POST', body: JSON.stringify(payload) }),
  disconnectChannel: (id: string) => fetchJson(`/v1/channels/${id}/disconnect`, { method: 'POST' }),
  reconnectChannel: (id: string) => fetchJson(`/v1/channels/${id}/reconnect`, { method: 'POST' }),

  // Human reply via backend (backend resolves credential + sends to provider)
  replyToConversation: (id: string, text: string) =>
    fetchJson(`/v1/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Knowledge base
  getKnowledge: (workspaceId = 'default', kind?: string) =>
    fetchJson(`/v1/workspaces/${workspaceId}/knowledge${kind ? `?kind=${kind}` : ''}`),
  addKnowledge: (workspaceId: string, item: any) =>
    fetchJson(`/v1/workspaces/${workspaceId}/knowledge`, { method: 'POST', body: JSON.stringify(item) }),
  deleteKnowledge: (id: string) => fetchJson(`/v1/knowledge/${id}`, { method: 'DELETE' }),
  askKnowledge: (workspaceId: string, question: string) =>
    fetchJson(`/v1/workspaces/${workspaceId}/knowledge/ask`, { method: 'POST', body: JSON.stringify({ question }) }),
  uploadKnowledge: (workspaceId: string, file: { filename: string; mime: string; base64: string; kind: string }) =>
    fetchJson(`/v1/workspaces/${workspaceId}/knowledge/upload`, { method: 'POST', body: JSON.stringify(file) }),

  // Plan & usage
  getPlan: (workspaceId = 'default') => fetchJson(`/v1/workspaces/${workspaceId}/plan`),

  // Password reset (authJson surfaces server messages; null when unreachable)
  forgotPassword: (email: string) => authJson('/auth/forgot', { email }),
  resetPassword: (token: string, password: string) => authJson('/auth/reset', { token, password }),

  // Admin (internal)
  adminOverview: () => fetchJson('/v1/admin/overview'),
  adminChannels: () => fetchJson('/v1/admin/channels'),
  adminFlows: () => fetchJson('/v1/admin/flows'),
  adminErrors: () => fetchJson('/v1/admin/errors'),
  adminUsage: () => fetchJson('/v1/admin/usage'),
  adminMicromind: () => fetchJson('/v1/admin/micromind'),
  adminUsers: () => fetchJson('/v1/admin/users'),
  adminCreateUser: (payload: { email: string; password: string; displayName?: string; role: string }) =>
    authJson('/v1/admin/users', payload)
};
