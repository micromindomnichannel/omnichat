// ORBIT Omnichannel API Client for PostgreSQL Database Sync

const API_BASE = 'http://localhost:5000/api';

async function fetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[DB Sync Warning] Request to ${url} failed, using local sync state.`, err);
    return null;
  }
}

export const api = {
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
  updateSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) })
};
