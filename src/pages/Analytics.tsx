import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { EmptyState } from '../components/shared/EmptyState';
import { PageHeader, Card, SectionTitle, Stat } from '../components/dash/kit';
import { bucketMessagesByDay, countByChannel } from '../services/normalize';
import { api } from '../services/api';
import {
  BarChart3, TrendingUp, Users, MessageSquare, DollarSign, Clock, Instagram, Facebook, MessageCircle, Globe, FileText, Sparkles, Send, CheckCircle2, Download, Copy, Check
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export function Analytics() {
  const { state, showToast } = useStore();
  const [platform, setPlatform] = useState<string>('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const orders = state.orders || [];
  const conversations = state.conversations || [];
  const products = state.products || [];
  const allMessages: any[] = Object.values(state.messages || {}).flat();

  useEffect(() => {
    let cancelled = false;
    api.getReports().then((rows: any) => {
      if (cancelled) return;
      if (Array.isArray(rows)) setPastReports(rows);
    });
    return () => { cancelled = true; };
  }, []);

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

  const shareByChannel = Object.entries(channelCounts).map(([ch, n]) => ({
    name: channelMeta[ch]?.name || ch,
    value: n,
    color: channelMeta[ch]?.color || '#6B7280',
  }));

  const volumeSeries = bucketMessagesByDay(allMessages, 7)
    .map(d => ({ day: d.label, total: d.messages }));
  const volumeEmpty = volumeSeries.every(d => d.total === 0);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportGenerated(true);
    const res = await api.generateReport(reportPeriod);
    setReportLoading(false);

    if (res?.ai_insights) {
      setReportText(res.ai_insights);
      setReportTitle(res.title || `Executive Summary (${reportPeriod.toUpperCase()})`);
      setPastReports(prev => [res, ...prev.filter(r => r.id !== res.id)]);
      showToast(`Report generated via ${res.ai_source || 'AI engine'}!`, 'success');
    } else {
      const lowStockAlert = outOfStockItems.length > 0
        ? `Inventory Alert: ${outOfStockItems[0].name} has low stock (${outOfStockItems[0].stock} units left). Re-stock recommended.`
        : `Inventory Status: All store products have healthy stock levels.`;

      const fallbackText = `ORBIT LIVE DATABASE EXECUTIVE SUMMARY (${reportPeriod.toUpperCase()} REPORT)
----------------------------------------------------------------------
• Total Revenue (Live DB): ${totalRevenue.toLocaleString()} EGP
• Total Orders Recorded: ${totalOrdersCount} completed orders
• Total Customer Threads: ${conversations.length} active customer threads
• Live AI Resolution Rate: ${aiResolutionPct === null ? 'n/a (no conversations yet)' : `${aiResolutionPct}% automated resolution without agent takeover`}

Strategic notes:
1. Channel mix: ${shareByChannel.length ? shareByChannel.map(s => `${s.name} (${s.value})`).join(', ') : 'no conversations yet'}.
2. ${lowStockAlert}
3. Activity metrics will continuously refine as customer signals arrive.`;

      setReportText(fallbackText);
      setReportTitle(`Executive Summary (${reportPeriod.toUpperCase()})`);
      showToast('Executive report generated from current data', 'success');
    }
  };

  const handleCopyReport = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Report copied to clipboard', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        eyebrow="Intelligence"
        title="Analytics & Executive Business Reports"
        sub="Deep analysis dynamically calculated from live PostgreSQL database records."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--surface-0)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: reportPeriod === p ? 'var(--signal-orange)' : 'transparent',
                    color: reportPeriod === p ? 'white' : 'var(--ink-600)',
                    fontSize: 12,
                    fontWeight: 650,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="btn btn-primary"
              style={{ background: 'var(--midnight-ink)', height: 40, padding: '0 18px', gap: 8 }}
            >
              <Sparkles size={16} color="var(--signal-orange)" />
              {reportLoading ? 'Generating…' : 'Generate AI Report'}
            </button>
          </div>
        }
      />

      {/* Platform Selector Tabs */}
      <Card style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
      </Card>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Stat
          label="Total Revenue (Live DB)"
          value={`${currentStats.revenue} EGP`}
          tone="up"
        />
        <Stat
          label="Total Inquiries"
          value={currentStats.inquiries.toLocaleString()}
        />
        <Stat
          label="Completed Orders"
          value={currentStats.orders.toString()}
          tone="up"
        />
        <Stat
          label="AI Resolution Rate"
          value={currentStats.aiResolution}
          tone={aiResolutionPct === null ? 'neutral' : 'up'}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle>Inquiry Volume (Last 7 Days)</SectionTitle>
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
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle>Conversations Share by Channel</SectionTitle>
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
        </Card>
      </div>

      {/* Generated Executive Report Box */}
      {reportGenerated && (
        <Card style={{ padding: 24, borderLeft: '4px solid var(--signal-orange)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--midnight-ink)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <FileText size={18} color="var(--signal-orange)" />
              {reportTitle || 'Executive Business Summary (Live DB)'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleCopyReport}
                className="btn btn-outline btn-sm"
                style={{ gap: 6, fontSize: 12 }}
              >
                {copied ? <Check size={14} color="#0F8357" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Report'}
              </button>
              <span style={{ fontSize: 11, background: 'var(--surface-0)', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <pre style={{
            background: 'var(--surface-0)', padding: 16, borderRadius: 8, fontSize: 13,
            lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--midnight-ink)', margin: 0
          }}>
            {reportText}
          </pre>
        </Card>
      )}

      {/* Historical Executive Reports */}
      {pastReports.length > 0 && (
        <Card style={{ padding: 20 }}>
          <SectionTitle>Saved Executive Reports (Database)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pastReports.map((rep: any) => (
              <div
                key={rep.id}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block' }}>
                    {rep.title || 'Executive Report'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--stone-gray)' }}>
                    Period: {rep.period?.toUpperCase()} · Revenue: {Number(rep.total_revenue || 0).toLocaleString()} EGP · AI Rate: {rep.ai_resolution_rate}% · {new Date(rep.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setReportGenerated(true);
                    setReportTitle(rep.title);
                    setReportText(rep.ai_insights || 'No insight text.');
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="btn btn-outline btn-sm"
                >
                  View Insights
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
