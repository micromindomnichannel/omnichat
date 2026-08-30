import React, { useState } from 'react';
import { StatCard } from '../components/shared/StatCard';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import {
  BarChart3, TrendingUp, Users, MessageSquare, DollarSign, Clock, Instagram, Facebook, MessageCircle, Music, Globe, FileText, Sparkles, Send, CheckCircle2, Download
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export function Analytics() {
  const [platform, setPlatform] = useState<string>('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportText, setReportText] = useState('');

  // Platform specific data mapping
  const platformData: Record<string, {
    inquiries: number;
    orders: number;
    revenue: string;
    aiResolution: string;
    avgResponse: string;
    conversion: string;
  }> = {
    all: { inquiries: 1684, orders: 98, revenue: '68,400', aiResolution: '78.5%', avgResponse: '1.2 mins', conversion: '19.2%' },
    instagram: { inquiries: 780, orders: 48, revenue: '34,200', aiResolution: '81.2%', avgResponse: '0.8 mins', conversion: '22.4%' },
    whatsapp: { inquiries: 520, orders: 32, revenue: '22,400', aiResolution: '76.4%', avgResponse: '1.1 mins', conversion: '18.5%' },
    facebook: { inquiries: 240, orders: 12, revenue: '8,600', aiResolution: '72.1%', avgResponse: '2.4 mins', conversion: '14.0%' },
    tiktok: { inquiries: 144, orders: 6, revenue: '3,200', aiResolution: '84.0%', avgResponse: '0.6 mins', conversion: '11.8%' }
  };

  const currentStats = platformData[platform] || platformData.all;

  const revenueByChannel = [
    { name: 'Instagram Direct', value: 34200, color: '#E4405F' },
    { name: 'WhatsApp Business', value: 22400, color: '#25D366' },
    { name: 'Facebook Messenger', value: 8600, color: '#1877F2' },
    { name: 'TikTok', value: 3200, color: '#171717' }
  ];

  const chartData = [
    { day: 'Mon', total: 210, instagram: 110, whatsapp: 60, facebook: 40 },
    { day: 'Tue', total: 240, instagram: 130, whatsapp: 70, facebook: 40 },
    { day: 'Wed', total: 220, instagram: 115, whatsapp: 65, facebook: 40 },
    { day: 'Thu', total: 280, instagram: 145, whatsapp: 90, facebook: 45 },
    { day: 'Fri', total: 310, instagram: 160, whatsapp: 100, facebook: 50 },
    { day: 'Sat', total: 340, instagram: 180, whatsapp: 110, facebook: 50 },
    { day: 'Sun', total: 380, instagram: 200, whatsapp: 125, facebook: 55 }
  ];

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setReportText(`📊 ORBIT EXECUTIVE BUSINESS SUMMARY (${reportPeriod.toUpperCase()} REPORT)
--------------------------------------------------
• Total Generated Revenue: ${currentStats.revenue} EGP
• Total Customer Inquiries: ${currentStats.inquiries.toLocaleString()} across all connected channels.
• Total Completed Orders: ${currentStats.orders} orders.
• Overall Conversion Rate: ${currentStats.conversion}.
• ORBIT AI Resolution Rate: ${currentStats.aiResolution} (Automated without human intervention).

💡 Key Strategic Insights & Recommendations:
1. Top Performing Channel: Instagram Direct accounts for 50% of total sales revenue.
2. Inventory Alert: Black Leather Bag stock is at 2 units remaining. Re-stock immediately.
3. Response Efficiency: Average response time is ${currentStats.avgResponse}, well within the 3-minute SLA benchmark.
4. Action Item: Increase WhatsApp broadcast frequency for abandoned checkout follow-ups.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="orbit-badge" style={{ marginBottom: 6 }}>
            <BarChart3 size={13} color="var(--signal-orange)" />
            <span>Deep Multi-Platform Analytics</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--midnight-ink)' }}>
            Analytics & Executive Business Reports
          </h1>
          <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginTop: 2 }}>
            Deep analysis broken down per channel (Instagram, WhatsApp, Facebook, TikTok) and overall combined metrics.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          className="btn btn-primary"
          style={{ background: 'var(--midnight-ink)', height: 42, padding: '0 20px' }}
        >
          <Sparkles size={18} color="var(--signal-orange)" /> Generate Executive Report
        </button>
      </div>

      {/* Platform Selector Tabs */}
      <div className="card" style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setPlatform('all')}
          className={'btn ' + (platform === 'all' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'all' ? 'var(--signal-orange)' : 'white' }}
        >
          All Combined
        </button>
        <button
          onClick={() => setPlatform('instagram')}
          className={'btn ' + (platform === 'instagram' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'instagram' ? 'var(--signal-orange)' : 'white', gap: 8 }}
        >
          <Instagram size={16} color={platform === 'instagram' ? 'white' : '#E4405F'} /> Instagram Direct
        </button>
        <button
          onClick={() => setPlatform('whatsapp')}
          className={'btn ' + (platform === 'whatsapp' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'whatsapp' ? 'var(--signal-orange)' : 'white', gap: 8 }}
        >
          <MessageCircle size={16} color={platform === 'whatsapp' ? 'white' : '#25D366'} /> WhatsApp Business
        </button>
        <button
          onClick={() => setPlatform('facebook')}
          className={'btn ' + (platform === 'facebook' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'facebook' ? 'var(--signal-orange)' : 'white', gap: 8 }}
        >
          <Facebook size={16} color={platform === 'facebook' ? 'white' : '#1877F2'} /> Facebook Messenger
        </button>
        <button
          onClick={() => setPlatform('tiktok')}
          className={'btn ' + (platform === 'tiktok' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'tiktok' ? 'var(--signal-orange)' : 'white', gap: 8 }}
        >
          <Music size={16} color={platform === 'tiktok' ? 'white' : '#171717'} /> TikTok
        </button>
      </div>

      {/* Dynamic Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total Inquiries" value={currentStats.inquiries.toLocaleString()} trend={12.4} />
        <StatCard label="Total Revenue (EGP)" value={`${currentStats.revenue} EGP`} trend={15.8} />
        <StatCard label="Completed Orders" value={currentStats.orders} trend={8.2} />
        <StatCard label="Conversion Rate" value={currentStats.conversion} trend={3.4} />
        <StatCard label="ORBIT AI Resolution" value={currentStats.aiResolution} trend={4.2} />
        <StatCard label="Avg Response Speed" value={currentStats.avgResponse} trend={-12.0} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Main Volume Chart */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 16 }}>
            Inquiry Volume Trends ({platform === 'all' ? 'Combined Platforms' : platform.toUpperCase()})
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--stone-gray)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--stone-gray)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="total" stroke="var(--signal-orange)" fill="var(--signal-orange-subtle)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 16 }}>
            Revenue Share by Channel
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={revenueByChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {revenueByChannel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 8 }}>
            {revenueByChannel.map(ch => (
              <div key={ch.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
                  <span>{ch.name}</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ch.value.toLocaleString()} EGP</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Executive Summary Report Card */}
      <div className="card" style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface-0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <OrbitLogo variant="icon" size={36} colorMode="dark" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--midnight-ink)' }}>
                Automated Admin Executive Business Summary Report
              </h3>
              <p style={{ fontSize: 12, color: 'var(--stone-gray)' }}>
                Request an instant report or schedule automated daily/weekly email digests.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setReportPeriod('daily')}
              className={'btn btn-sm ' + (reportPeriod === 'daily' ? 'btn-primary' : 'btn-outline')}
              style={{ background: reportPeriod === 'daily' ? 'var(--signal-orange)' : 'white' }}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportPeriod('weekly')}
              className={'btn btn-sm ' + (reportPeriod === 'weekly' ? 'btn-primary' : 'btn-outline')}
              style={{ background: reportPeriod === 'weekly' ? 'var(--signal-orange)' : 'white' }}
            >
              Weekly Report
            </button>
            <button
              onClick={handleGenerateReport}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--signal-orange)' }}
            >
              <Sparkles size={14} /> Generate Report Now
            </button>
          </div>
        </div>

        {reportGenerated ? (
          <div style={{ background: 'var(--midnight-ink)', color: 'var(--cloud-white)', padding: 20, borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {reportText}
          </div>
        ) : (
          <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--stone-gray)', fontSize: 13 }}>
            Click "Generate Report Now" to compile real-time performance insights & AI business recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
