import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import { EmptyState } from '../components/shared/EmptyState';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MessageSquare, TrendingUp, CheckCircle, AlertTriangle, Bot, ArrowRight,
  ShoppingBag, Calendar, Play, Zap, Layers, Sparkles
} from 'lucide-react';

export function Overview() {
  const { vertical, isCommerce, accentColor } = useVertical();
  const { state } = useStore();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  const commerceStats = [
    { label: 'Total Inquiries', value: 1248, trend: 12.5 },
    { label: 'Qualified Leads', value: 184, trend: 8.2 },
    { label: 'Completed Orders', value: 67, trend: -3.1 },
    { label: 'Conversion Rate', value: '18.4%', trend: 5.7 },
  ];

  const commerceSecondary = [
    { label: 'Revenue (EGP)', value: '45,200', trend: 15.3 },
    { label: 'ORBIT AI Resolution', value: '76.2%', trend: 4.1 },
  ];

  const appointmentStats = [
    { label: 'Total Inquiries', value: 436, trend: 18.2 },
    { label: 'Qualified Patients', value: 82, trend: 12.5 },
    { label: 'Appointments Booked', value: 31, trend: 8.7 },
    { label: 'Booking Rate', value: '22.5%', trend: 6.3 },
  ];

  const appointmentSecondary = [
    { label: 'No-Shows Rate', value: '2.1%', trend: -15.0 },
    { label: 'ORBIT AI Resolution', value: '82.1%', trend: 5.2 },
  ];

  const stats = isCommerce ? commerceStats : appointmentStats;
  const secondary = isCommerce ? commerceSecondary : appointmentSecondary;

  const chartData = chartPeriod === '7d'
    ? [
        { day: 'Mon', conversations: 120, aiResolved: 95 },
        { day: 'Tue', conversations: 145, aiResolved: 112 },
        { day: 'Wed', conversations: 132, aiResolved: 105 },
        { day: 'Thu', conversations: 168, aiResolved: 128 },
        { day: 'Fri', conversations: 155, aiResolved: 118 },
        { day: 'Sat', conversations: 190, aiResolved: 145 },
        { day: 'Sun', conversations: 210, aiResolved: 162 },
      ]
    : [
        { day: 'W1', conversations: 850, aiResolved: 650 },
        { day: 'W2', conversations: 920, aiResolved: 710 },
        { day: 'W3', conversations: 880, aiResolved: 680 },
        { day: 'W4', conversations: 1050, aiResolved: 820 },
      ];

  const recentOrders = state.orders.slice(-5).reverse();
  const todayAppointments = state.appointments
    .filter(a => a.date === '2024-08-17')
    .sort((a, b) => a.time.localeCompare(b.time));

  const aiActivity = isCommerce
    ? [
        { label: 'Answered 238 customer queries', icon: CheckCircle, color: '#52D8A4' },
        { label: 'Qualified 74 purchase leads', icon: TrendingUp, color: '#52D8A4' },
        { label: 'Created 31 COD orders', icon: ShoppingBag, color: 'var(--signal-orange)' },
        { label: 'Escalated 9 queries to human agent', icon: AlertTriangle, color: '#D94C32' },
      ]
    : [
        { label: 'Answered 146 patient queries', icon: CheckCircle, color: '#52D8A4' },
        { label: 'Qualified 58 clinic leads', icon: TrendingUp, color: '#52D8A4' },
        { label: 'Booked 24 consultation slots', icon: Calendar, color: 'var(--signal-orange)' },
        { label: 'Escalated 6 queries to clinic receptionist', icon: AlertTriangle, color: '#D94C32' },
      ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Brand Header Banner */}
      <div className="card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, var(--midnight-ink) 0%, #292929 100%)',
        color: 'var(--cloud-white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <OrbitLogo variant="icon" size={44} colorMode="dark" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--cloud-white)' }}>
                {greeting()}, {state.businessName}
              </h2>
              <span className="orbit-badge-mint" style={{ fontSize: 11 }}>
                Signals ➔ Actions Engine Active
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginTop: 4 }}>
              Active Mode: <strong style={{ color: 'var(--signal-orange)' }}>{isCommerce ? 'E-Commerce & Retail' : 'Appointments & Clinics'}</strong> · All channels live & syncing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/demo')}
            className="btn btn-outline"
            style={{ color: 'white', borderColor: 'var(--graphite)', background: 'rgba(255,255,255,0.05)' }}
          >
            <Play size={15} /> Try Demo Flow
          </button>
          <button
            onClick={() => navigate('/inbox')}
            className="btn btn-primary"
            style={{ background: 'var(--signal-orange)', height: 40 }}
          >
            Open Omnichannel Inbox <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Core Principle Concept Box */}
      <div style={{
        background: 'var(--warm-sand)',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--signal-orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Zap size={18} />
          </div>
          <div>
            <div className="eyebrow" style={{ color: 'var(--burnt-coral)' }}>ORBIT Core Principle</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--midnight-ink)' }}>
              Many Signals ➔ One Intelligent Flow
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--graphite)', maxWidth: 500 }}>
          Inbound chats across Instagram, WhatsApp & Facebook are converged by ORBIT into automated orders, calendar bookings & support escalations.
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--signal-orange)', fontWeight: 700 }}
        >
          View Brand Concept Guide <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {stats.map(stat => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12
      }}>
        {secondary.map(stat => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} compact />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Conversation Performance */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)' }}>Signal Resolution Performance</h3>
              <p className="faint" style={{ fontSize: 11 }}>Total customer inquiries vs. AI automated resolutions</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setChartPeriod('7d')}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: chartPeriod === '7d' ? 'var(--signal-orange)' : 'transparent',
                  color: chartPeriod === '7d' ? 'white' : 'var(--ink-600)'
                }}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: chartPeriod === '30d' ? 'var(--signal-orange)' : 'transparent',
                  color: chartPeriod === '30d' ? 'white' : 'var(--ink-600)'
                }}
              >
                30 Days
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--signal-orange)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--signal-orange)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--stone-gray)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--stone-gray)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="conversations" stroke="var(--signal-orange)" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="aiResolved" stroke="#52D8A4" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders / Today's Appointments */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 16 }}>
            {isCommerce ? 'Recent Automated Orders' : "Today's Clinic Appointments"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isCommerce ? (
              recentOrders.length > 0 ? recentOrders.map(order => {
                const customer = state.customers.find(c => c.id === order.customerId);
                return (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                        #{order.id}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--stone-gray)' }}>
                        {customer?.name} · {order.productName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {order.total.toLocaleString()} EGP
                      </p>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                );
              }) : <EmptyState title="No recent orders" />
            ) : (
              todayAppointments.length > 0 ? todayAppointments.map(appt => {
                const customer = state.customers.find(c => c.id === appt.customerId);
                return (
                  <div key={appt.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                        {appt.time}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--stone-gray)' }}>
                        {appt.serviceName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                        {customer?.name}
                      </p>
                      <StatusBadge status={appt.status} size="sm" />
                    </div>
                  </div>
                );
              }) : <EmptyState title="No appointments today" />
            )}
          </div>
          <button
            onClick={() => navigate(isCommerce ? '/orders' : '/appointments')}
            style={{
              marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--signal-orange)',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            {isCommerce ? 'View all orders' : 'View full agenda'} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* AI Activity */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 16 }}>
          ORBIT Engine Automated Actions (Today)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {aiActivity.map((activity, i) => {
            const Icon = activity.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 16, borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)'
              }}>
                <Icon size={20} color={activity.color} />
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--midnight-ink)' }}>
                  {activity.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
