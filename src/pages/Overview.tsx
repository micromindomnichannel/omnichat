import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { PageHeader, Card, SectionTitle, Stat, EmptyState as KitEmptyState, ChannelDot } from '../components/dash/kit';
import {
  bucketMessagesByDay, parseTime, formatListTime, countByChannel, countBySender,
  avgResponseMs, formatDurationMs, countLeads, activeChannelList, recentChannelActivity,
} from '../services/normalize';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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
  const [pulseRange, setPulseRange] = useState<'7d' | '30d'>('7d');

  const orders = state.orders || [];
  const conversations = state.conversations || [];
  const customers = state.customers || [];
  const appointments = state.appointments || [];
  const products = state.products || [];
  const customerById = new Map(customers.map((cu: any) => [cu.id, cu]));
  const customerName = (conversationId: string, fallbackId: string) =>
    customerById.get(conversationId)?.name || `Thread ${String(fallbackId).slice(-6)}`;
  const friendlyStatus = (s: string) =>
    s === 'ai_handling' ? 'AI Handling' : s === 'human' ? 'Human' : s === 'resolved' ? 'Resolved' : (s || '—');

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

  // Live inbox pulse: every metric below derives from backend rows in range.
  // Anything unmeasurable renders an honest "Not available yet", never a guess.
  const pulseCutoff = Date.now() - (pulseRange === '7d' ? 7 : 30) * 86400000;
  const inRange = (v: any) => {
    const t = parseTime(v);
    return t !== null && t >= pulseCutoff;
  };
  const pulseConvs = conversations.filter((c) => inRange((c as any).updatedAt || (c as any).lastMessageTime));
  const pulseMsgs = allMessages.filter((m: any) => inRange((m as any).timestamp || (m as any).created_at));
  const pulseUnread = pulseConvs.reduce((s, c) => s + Number(c.unreadCount || 0), 0);
  const pulseAi = pulseConvs.filter((c) => c.status === 'ai_handling' || c.status === 'resolved').length;
  const pulseHuman = pulseConvs.filter((c) => c.status === 'human' || c.status === 'escalated').length;
  const pulseSenders = countBySender(pulseMsgs as any);
  const pulseResp = avgResponseMs(pulseMsgs as any);
  const pulseChannels = countByChannel(pulseConvs as any);
  const pulseChannelMax = Math.max(1, ...Object.values(pulseChannels));
  const pulseActivity = recentChannelActivity(pulseConvs as any).slice(0, 4);
  const handlingSplit = [
    { name: 'AI replies', value: pulseSenders.ai, color: 'var(--signal-orange)' },
    { name: 'Human replies', value: pulseSenders.human, color: 'var(--midnight-ink)' },
  ].filter((s) => s.value > 0);
  void vertical;
  void accentColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        eyebrow="Command Center"
        title={`Welcome back, ${state.currentUser.name}!`}
        sub="Here is your live business performance synced directly with the live backend."
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

      {/* Live inbox pulse: backend-derived metrics, Chatwoot-style coverage,
          Tremor-style presentation, ORBIT identity. No demo numbers. */}
      <Card style={{ padding: 20 }}>
        <SectionTitle
          action={
            <div style={{ display: 'flex', background: 'var(--surface-0)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {(['7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPulseRange(r)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: pulseRange === r ? 'var(--signal-orange)' : 'transparent',
                    color: pulseRange === r ? 'white' : 'var(--ink-600)',
                    fontSize: 12, fontWeight: 650, cursor: 'pointer',
                  }}
                >
                  {r === '7d' ? '7 days' : '30 days'}
                </button>
              ))}
            </div>
          }
        >
          Live inbox pulse (last {pulseRange === '7d' ? '7' : '30'} days)
        </SectionTitle>
        {pulseConvs.length === 0 ? (
          <KitEmptyState
            icon={<MessageSquare size={24} color="var(--signal-orange)" />}
            title="No conversations in range"
            copy="Threads that receive messages in this period will light up every metric below."
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Stat label="Threads" value={pulseConvs.length.toLocaleString()} />
              <Stat label="Unread" value={pulseUnread.toLocaleString()} tone={pulseUnread > 0 ? 'down' : 'neutral'} />
              <Stat label="AI handling" value={pulseAi.toLocaleString()} />
              <Stat label="Human" value={pulseHuman.toLocaleString()} />
              <Stat label="Active channels" value={activeChannelList(pulseConvs as any).length} />
              <Stat label="AI replies" value={pulseSenders.ai.toLocaleString()} />
              <Stat label="Human replies" value={pulseSenders.human.toLocaleString()} />
              <Stat label="Avg response" value={formatDurationMs(pulseResp.avgMs)} />
              <Stat label="Buying intent" value={countLeads(pulseConvs as any).toLocaleString()} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                  Messages by channel
                </p>
                {Object.keys(pulseChannels).length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>No channel activity in range.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(pulseChannels).sort((a, b) => b[1] - a[1]).map(([ch, n]) => (
                      <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 90 }}><ChannelDot channel={ch} label={ch} /></span>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-0)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((n / pulseChannelMax) * 100)}%`, height: '100%', background: 'var(--signal-orange)', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)', minWidth: 28, textAlign: 'right' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                  AI vs human replies
                </p>
                {handlingSplit.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>No replies in range yet.</p>
                ) : (
                  <div style={{ height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={handlingSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                          {handlingSplit.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value} replies`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                  Recent channel activity
                </p>
                {pulseActivity.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Nothing yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pulseActivity.map((a) => (
                      <div key={a.channel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <ChannelDot channel={a.channel} label={a.channel} />
                        <span style={{ color: 'var(--ink-400)', marginLeft: 'auto' }}>
                          {a.threads} thread{a.threads === 1 ? '' : 's'} · {a.at ? formatListTime(new Date(a.at).toISOString()) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

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
                <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--midnight-ink)' }}>{customerName(c.customerId, c.id)}</td>
                <td style={{ padding: '12px 12px', textTransform: 'capitalize' }}>{c.channel}</td>
                <td style={{ padding: '12px 12px' }}>
                  <span className="orbit-badge" style={{ background: c.status === 'ai_handling' ? 'var(--signal-orange-subtle)' : 'var(--surface-0)', color: c.status === 'ai_handling' ? 'var(--signal-orange)' : 'var(--midnight-ink)' }}>
                    {friendlyStatus(c.status)}
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
