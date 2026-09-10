import React, { useState } from 'react';
import { useStore } from '../state/store';
import { StatCard } from '../components/shared/StatCard';
import { EmptyState } from '../components/shared/EmptyState';
import { bucketMessagesByDay, countByChannel } from '../services/normalize';
import {
  BarChart3, TrendingUp, Users, MessageSquare, DollarSign, Clock, Instagram, Facebook, MessageCircle, Music, Globe, FileText, Sparkles, Send, CheckCircle2, Download
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export function Analytics() {
  const { state } = useStore();
  const [platform, setPlatform] = useState<string>('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportText, setReportText] = useState('');

  const orders = state.orders || [];
  const conversations = state.conversations || [];
  const products = state.products || [];
  const allMessages: any[] = Object.values(state.messages || {}).flat();

  // Real calculations over backend rows — no demo fallbacks.
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalInquiriesCount = conversations.length;

  const aiHandledCount = conversations.filter(c => c.status === 'ai_handling' || c.status === 'resolved').length;
  const aiResolutionPct = conversations.length ? ((aiHandledCount / conversations.length) * 100).toFixed(1) : null;

  const outOfStockItems = products.filter(p => p.stock <= 5);
  const channelCounts = countByChannel(conversations as any);

  const channelMeta: Record<string, { name: string; color: string }> = {
    instagram: { name: 'Instagram Direct', color: '#E4405F' },
    whatsapp: { name: 'WhatsApp Business', color: '#25D366' },
    facebook: { name: 'Facebook Messenger', color: '#1877F2' },
    messenger: { name: 'Messenger', color: '#0099FF' },
    telegram: { name: 'Telegram', color: '#229ED9' },
    gmail: { name: 'Gmail', color: '#EA4335' },
    tiktok: { name: 'TikTok', color: '#171717' },
    website: { name: 'Website', color: '#6B7280' },
  };

  // Platform specific stats — only what the data supports (no invented splits).
  const getPlatformStats = (p: string) => {
    if (p === 'all') {
      return {
        inquiries: totalInquiriesCount,
        orders: totalOrdersCount,
        revenue: totalRevenue.toLocaleString(),
        aiResolution: aiResolutionPct === null ? '—' : `${aiResolutionPct}%`,
        avgResponse: '—',
        conversion: '—',
      };
    }
    const pConvs = conversations.filter(c => c.channel === p);
    const pAi = pConvs.filter(c => c.status === 'ai_handling' || c.status === 'resolved').length;
    return {
      inquiries: pConvs.length,
      orders: '—' as any,
      revenue: '—',
      aiResolution: pConvs.length ? `${((pAi / pConvs.length) * 100).toFixed(1)}%` : '—',
      avgResponse: '—',
      conversion: '—',
    };
  };

  const currentStats = getPlatformStats(platform);

  // Conversations share by channel (real counts — revenue can't be split:
  // orders carry no channel, so the pie shows thread share, honestly labeled).
  const shareByChannel = Object.entries(channelCounts).map(([ch, n]) => ({
    name: channelMeta[ch]?.name || ch,
    value: n,
    color: channelMeta[ch]?.color || '#6B7280',
  }));

  // Real 7-day message volume.
  const volumeSeries = bucketMessagesByDay(allMessages, 7)
    .map(d => ({ day: d.label, total: d.messages }));
  const volumeEmpty = volumeSeries.every(d => d.total === 0);

  const handleGenerateReport = () => {
    const lowStockAlert = outOfStockItems.length > 0
      ? `Inventory Alert: ${outOfStockItems[0].name} has low stock (${outOfStockItems[0].stock} units left). Re-stock recommended.`
      : `Inventory Status: All store products have healthy stock levels.`;

    setReportGenerated(true);
    setReportText(`ORBIT LIVE DATABASE EXECUTIVE SUMMARY (${reportPeriod.toUpperCase()} REPORT)
----------------------------------------------------------------------
• Total Revenue (Live DB): ${totalRevenue.toLocaleString()} EGP
• Total Orders Recorded: ${totalOrdersCount} completed orders
• Total Customer Threads: ${conversations.length} active customer threads
• Live AI Resolution Rate: ${aiResolutionPct === null ? 'n/a (no conversations yet)' : `${aiResolutionPct}% automated resolution without agent takeover`}

Strategic notes (from live data):
1. Channel mix: ${shareByChannel.length ? shareByChannel.map(s => `${s.name} (${s.value})`).join(', ') : 'no conversations yet'}.
2. ${lowStockAlert}
3. Average response & conversion tracking require message timestamps — shown as — until data accumulates.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="orbit-badge" style={{ marginBottom: 6 }}>
            <BarChart3 size={13} color="var(--signal-orange)" />
            <span>Deep Multi-Platform Analytics (Database Synced)</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--midnight-ink)' }}>
            Analytics & Executive Business Reports
          </h1>
          <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginTop: 2 }}>
            Deep analysis dynamically calculated from live PostgreSQL database records.
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
          <Globe size={15} /> All Platforms Combined
        </button>
        <button
          onClick={() => setPlatform('instagram')}
          className={'btn ' + (platform === 'instagram' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'instagram' ? '#E4405F' : 'white', color: platform === 'instagram' ? 'white' : 'inherit' }}
        >
          <Instagram size={15} /> Instagram Direct
        </button>
        <button
          onClick={() => setPlatform('whatsapp')}
          className={'btn ' + (platform === 'whatsapp' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'whatsapp' ? '#25D366' : 'white', color: platform === 'whatsapp' ? 'white' : 'inherit' }}
        >
          <MessageCircle size={15} /> WhatsApp Business
        </button>
        <button
          onClick={() => setPlatform('facebook')}
          className={'btn ' + (platform === 'facebook' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'facebook' ? '#1877F2' : 'white', color: platform === 'facebook' ? 'white' : 'inherit' }}
        >
          <Facebook size={15} /> Facebook Messenger
        </button>
        <button
          onClick={() => setPlatform('tiktok')}
          className={'btn ' + (platform === 'tiktok' ? 'btn-primary' : 'btn-outline')}
          style={{ background: platform === 'tiktok' ? '#171717' : 'white', color: platform === 'tiktok' ? 'white' : 'inherit' }}
        >
          <Music size={15} /> TikTok
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label="Total Revenue (Live DB)"
          value={`${currentStats.revenue} EGP`}
        />
        <StatCard
          label="Total Inquiries"
          value={currentStats.inquiries.toLocaleString()}
        />
        <StatCard
          label="Completed Orders"
          value={currentStats.orders.toString()}
        />
        <StatCard
          label="AI Resolution Rate"
          value={currentStats.aiResolution}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--midnight-ink)' }}>
            Inquiry Volume (Last 7 Days)
          </h3>
          <div style={{ height: 280 }}>
            {volumeEmpty ? (
              <EmptyState
                title="No message volume yet"
                description="Daily message counts will chart here once conversations begin."
              />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="var(--signal-orange)" fill="var(--signal-orange-subtle)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--midnight-ink)' }}>
            Conversations Share by Channel
          </h3>
          <div style={{ height: 200 }}>
            {shareByChannel.length === 0 ? (
              <EmptyState
                title="No conversations yet"
                description="Channel share appears here once customers message you."
              />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={shareByChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {shareByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value} threads`} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Generated Executive Report Box */}
      {reportGenerated && (
        <div className="card animate-slide-up" style={{ padding: 24, borderLeft: '4px solid var(--signal-orange)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--midnight-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--signal-orange)" />
              Executive Business Summary (Live DB)
            </h3>
            <span style={{ fontSize: 11, background: 'var(--surface-0)', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <pre style={{
            background: 'var(--surface-0)', padding: 16, borderRadius: 8, fontSize: 13,
            lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--midnight-ink)'
          }}>
            {reportText}
          </pre>
        </div>
      )}
    </div>
  );
}
