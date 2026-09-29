import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { PageHeader, Card, SectionTitle, Stat, EmptyState as KitEmptyState } from '../components/dash/kit';
import { bucketMessagesByDay } from '../services/normalize';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MessageSquare, CheckCircle, AlertTriangle, ArrowRight,
  ShoppingBag, BarChart3
} from 'lucide-react';

export function Overview() {
  const { vertical, isCommerce, accentColor } = useVertical();
  const { state } = useStore();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  const orders = state.orders || [];
  const conversations = state.conversations || [];
  const appointments = state.appointments || [];
  const products = state.products || [];

  // Live computations over real backend rows — no fallbacks, no demo numbers.
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalInquiriesCount = conversations.length;
  const totalAppointmentsCount = appointments.length;

  const aiResolvedCount = conversations.filter(c => c.status === 'ai_handling' || c.status === 'resolved').length;
  const aiResolutionRate = conversations.length ? ((aiResolvedCount / conversations.length) * 100).toFixed(1) : '—';

  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const commerceStats = [
    { label: 'Total Inquiries (DB)', value: totalInquiriesCount.toLocaleString(), trend: undefined as number | undefined },
    { label: 'Completed Orders', value: totalOrdersCount.toString(), trend: undefined as number | undefined },
    { label: 'Total Revenue (EGP)', value: `${totalRevenue.toLocaleString()} EGP`, trend: undefined as number | undefined },
    { label: 'AI Resolution Rate', value: conversations.length ? `${aiResolutionRate}%` : '—', trend: undefined as number | undefined },
  ];

  const appointmentStats = [
    { label: 'Total Inquiries (DB)', value: totalInquiriesCount.toLocaleString(), trend: undefined as number | undefined },
    { label: 'Appointments Booked', value: totalAppointmentsCount.toString(), trend: undefined as number | undefined },
    { label: 'Completed Patients', value: appointments.filter(a => a.status === 'Completed').length.toString(), trend: undefined as number | undefined },
    { label: 'AI Resolution Rate', value: conversations.length ? `${aiResolutionRate}%` : '—', trend: undefined as number | undefined },
  ];

  const stats = isCommerce ? commerceStats : appointmentStats;

  // Real 7/30-day activity from message timestamps (empty -> chart EmptyState).
  const allMessages = Object.values(state.messages || {}).flat();
  const chartData = bucketMessagesByDay(allMessages, chartPeriod === '7d' ? 7 : 30)
    .map(d => ({ day: d.label, conversations: d.messages, aiResolved: d.aiReplies }));
  const chartEmpty = chartData.every(d => d.conversations === 0);

  const recentConversations = conversations.slice(0, 5);
  void vertical;
  void accentColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        eyebrow="Command Center"
        title={`Welcome back, ${state.currentUser.name}!`}
        sub="Here is your live business performance synced directly with host 148.251.171.147."
        live
        actions={
          <>
            <button onClick={() => navigate('/inbox')} className="btn btn-primary" style={{ background: 'var(--signal-orange)' }}>
              <MessageSquare size={16} /> Open Inbox ({conversations.length})
            </button>
            <button onClick={() => navigate('/analytics')} className="btn btn-outline" style={{ color: 'var(--midnight-ink)', borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
              <BarChart3 size={16} /> Executive Report
            </button>
          </>
        }
      />

      {/* Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {stats.map((s, idx) => (
          <Stat key={idx} label={s.label} value={s.value} tone="neutral" />
        ))}
      </div>

      {/* Chart & Low Stock Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle
            action={
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setChartPeriod('7d')} className={'btn btn-sm ' + (chartPeriod === '7d' ? 'btn-primary' : 'btn-outline')} style={{ background: chartPeriod === '7d' ? 'var(--signal-orange)' : 'white' }}>7 Days</button>
                <button onClick={() => setChartPeriod('30d')} className={'btn btn-sm ' + (chartPeriod === '30d' ? 'btn-primary' : 'btn-outline')} style={{ background: chartPeriod === '30d' ? 'var(--signal-orange)' : 'white' }}>30 Days</button>
              </div>
            }
          >
            Inquiry Traffic & AI Automation
          </SectionTitle>

          <div style={{ height: 260 }}>
            {chartEmpty ? (
              <KitEmptyState
                icon={<BarChart3 size={24} color="var(--signal-orange)" />}
                title="No activity yet"
                copy="Message activity will appear here once customers start conversations."
              />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="conversations" name="Total Inquiries" stroke="var(--signal-orange)" fill="var(--signal-orange-subtle)" strokeWidth={2} />
                <Area type="monotone" dataKey="aiResolved" name="AI Resolved" stroke="#25D366" fill="rgba(37, 211, 102, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Live Inventory & Activity Box */}
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionTitle>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="var(--signal-orange)" />
              Live DB Inventory Alerts
            </span>
          </SectionTitle>

          <div style={{ padding: 14, borderRadius: 10, background: lowStockCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)', border: `1px solid ${lowStockCount > 0 ? 'var(--warning)' : 'var(--success)'}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: lowStockCount > 0 ? 'var(--warning-dark)' : 'var(--success-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {lowStockCount > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {lowStockCount > 0 ? `${lowStockCount} Products Low on Stock` : 'All Inventory Items Healthy'}
            </div>
            <p style={{ fontSize: 11, marginTop: 4, color: 'var(--midnight-ink)' }}>
              {lowStockCount > 0 ? 'Stock is ≤ 5 units. Re-stock from Products admin panel.' : 'No out-of-stock items detected in PostgreSQL catalog.'}
            </p>
          </div>

          <button onClick={() => navigate('/products')} className="btn btn-outline" style={{ width: '100%', fontSize: 12, height: 36 }}>
            Manage Store Inventory ({products.length} items)
          </button>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card style={{ padding: 20 }}>
        <SectionTitle
          action={
            <button onClick={() => navigate('/inbox')} className="btn btn-ghost btn-sm" style={{ color: 'var(--signal-orange)', gap: 4 }}>
              View All ({conversations.length}) <ArrowRight size={14} />
            </button>
          }
        >
          Recent Customer Threads (PostgreSQL)
        </SectionTitle>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--stone-gray)', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 12px' }}>Customer Thread</th>
              <th style={{ padding: '10px 12px' }}>Channel</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 12px' }}>Last Message</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentConversations.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--surface-0)' }}>
                <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--midnight-ink)' }}>Thread #{c.id}</td>
                <td style={{ padding: '12px 12px', textTransform: 'capitalize' }}>{c.channel}</td>
                <td style={{ padding: '12px 12px' }}>
                  <span className="orbit-badge" style={{ background: c.status === 'ai_handling' ? 'var(--signal-orange-subtle)' : 'var(--surface-0)', color: c.status === 'ai_handling' ? 'var(--signal-orange)' : 'var(--midnight-ink)' }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 12px', color: 'var(--stone-gray)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.lastMessage}
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                  <button onClick={() => navigate('/inbox')} className="btn btn-outline btn-sm">Open Chat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
