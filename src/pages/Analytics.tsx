import React, { useState } from 'react';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { StatCard } from '../components/shared/StatCard';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { analyticsData } from '../state/mockData';

export function Analytics() {
  const { vertical, isCommerce, accentColor } = useVertical();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const data = analyticsData[vertical][period];
  const chartColor = accentColor;

  const sharedStats = [
    { label: 'Total Conversations', value: data.conversations.reduce((a: number, b: number) => a + b, 0).toLocaleString() },
    { label: 'Leads', value: data.leads.reduce((a: number, b: number) => a + b, 0).toLocaleString() },
    { label: 'Conversion Rate', value: `${data.conversionRate}%` },
    { label: 'AI Resolution Rate', value: `${data.aiResolutionRate}%` },
  ];

  const secondRow = [
    { label: 'Human Handoff Rate', value: `${data.humanHandoffRate}%` },
    { label: 'Avg Response Time', value: data.avgResponseTime },
    { label: 'Follow-up Recovery', value: `${data.followUpRecoveryRate}%` },
  ];

  const lineData = data.conversations.map((v: number, i: number) => ({
    day: `D${i + 1}`,
    value: v,
    ai: data.conversations[i] * 0.75
  }));

  const topItems = isCommerce ? data.topProducts : data.topServices;
  const barData = topItems.map((item: any) => ({ name: item.name, value: item.value }));

  const donutData = isCommerce
    ? [{ name: 'COD', value: data.codOrders }, { name: 'Other', value: 100 - data.codOrders }]
    : [{ name: 'Utilized', value: data.utilization }, { name: 'Free', value: 100 - data.utilization }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="page-title">Analytics</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: period === p ? accentColor : 'transparent',
                color: period === p ? 'white' : 'var(--ink-600)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Shared Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {sharedStats.map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {secondRow.map(s => <StatCard key={s.label} label={s.label} value={s.value} compact />)}
      </div>

      {/* Vertical-specific charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'Revenue Over Time' : 'Bookings Over Time'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData.slice(0, 14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'Average Order Value' : 'Booking Conversion'}
          </h3>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-900)' }}>
              {isCommerce ? `${data.avgOrderValue.toLocaleString()} EGP` : `${data.bookingConversion}%`}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'Top Products' : 'Most Requested Services'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-400)' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--ink-600)' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill={chartColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'Abandoned Leads' : 'No-Shows'}
          </h3>
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <p style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-900)' }}>
              {isCommerce ? data.abandonedLeads : data.noShows}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>
              {isCommerce ? 'This period' : 'This period'}
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 16 }}>
            {isCommerce ? 'COD Orders' : 'Utilization'}
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {donutData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? chartColor : 'var(--border)'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
            {donutData[0].value}%
          </p>
        </div>
      </div>
    </div>
  );
}
