import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Tabs } from '../components/shared/Tabs';
import { EmptyState } from '../components/shared/EmptyState';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MessageSquare, TrendingUp, CheckCircle, AlertTriangle, Bot, ArrowRight,
  ShoppingBag, Calendar, Play
} from 'lucide-react';

export function Overview() {
  const { vertical, isCommerce, accentColor } = useVertical();
  const { state } = useStore();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  const commerceStats = [
    { label: 'Conversations', value: 1248, trend: 12.5 },
    { label: 'New Leads', value: 184, trend: 8.2 },
    { label: 'Orders', value: 67, trend: -3.1 },
    { label: 'Conversion Rate', value: '18.4%', trend: 5.7 },
  ];

  const commerceSecondary = [
    { label: 'Revenue (EGP)', value: '45,200', trend: 15.3 },
    { label: 'AI Resolution Rate', value: '76.2%', trend: 4.1 },
  ];

  const appointmentStats = [
    { label: 'Conversations', value: 436, trend: 18.2 },
    { label: 'New Leads', value: 82, trend: 12.5 },
    { label: 'Appointments Booked', value: 31, trend: 8.7 },
    { label: 'Booking Rate', value: '22.5%', trend: 6.3 },
  ];

  const appointmentSecondary = [
    { label: 'No-Shows', value: 2, trend: -15.0 },
    { label: 'AI Resolution Rate', value: '82.1%', trend: 5.2 },
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
        { label: 'Answered 238 questions', icon: CheckCircle, color: 'var(--success)' },
        { label: 'Qualified 74 leads', icon: TrendingUp, color: 'var(--success)' },
        { label: 'Created 31 orders', icon: ShoppingBag, color: 'var(--success)' },
        { label: 'Escalated 9 conversations', icon: AlertTriangle, color: 'var(--warning)' },
      ]
    : [
        { label: 'Answered 146 questions', icon: CheckCircle, color: 'var(--success)' },
        { label: 'Qualified 58 leads', icon: TrendingUp, color: 'var(--success)' },
        { label: 'Booked 24 appointments', icon: Calendar, color: 'var(--success)' },
        { label: 'Escalated 6 conversations', icon: AlertTriangle, color: 'var(--warning)' },
      ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 650, color: 'var(--ink-900)' }}>
            {greeting()}, {state.businessName}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 4 }}>
            Here's what's happening today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/demo')}
            className="btn btn-outline"
          >
            <Play size={16} /> See SELLER in action
          </button>
          <button
            onClick={() => navigate('/inbox')}
            className="btn btn-primary"
            style={{ background: accentColor, height: 40 }}
          >
            Open Inbox
          </button>
        </div>
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
            <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>Conversation Performance</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setChartPeriod('7d')}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: chartPeriod === '7d' ? accentColor : 'transparent',
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
                  background: chartPeriod === '30d' ? accentColor : 'transparent',
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
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="conversations" stroke={accentColor} fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
              <Area type="monotone" dataKey="aiResolved" stroke={accentColor} fill="transparent" strokeWidth={2} strokeDasharray="4 4" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders / Today's Appointments */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'Recent Orders' : "Today's Appointments"}
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                        #{order.id}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>
                        {customer?.name} · {order.productName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                        {appt.time}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>
                        {appt.serviceName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
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
              marginTop: 12, fontSize: 13, fontWeight: 600, color: accentColor,
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            {isCommerce ? 'View all orders' : 'View schedule'} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* AI Activity */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
          AI Activity (Today)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {aiActivity.map((activity, i) => {
            const Icon = activity.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 16, borderRadius: 8, background: 'var(--surface-0)'
              }}>
                <Icon size={20} color={activity.color} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
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
