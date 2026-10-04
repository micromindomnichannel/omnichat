// Internal admin dashboard: workspaces, channels, flows, errors, usage.
// Backend: GET /api/v1/admin/*. Null-safe when the DB is down (dbUp flag).
import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PageHeader, Card, SectionTitle, Stat } from '../components/dash/kit';
import { api } from '../services/api';

function Table({ cols, rows }: { cols: string[]; rows: any[][] }) {
  if (!rows.length) return <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No data.</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr>{cols.map((c) => <th key={c} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--stone-gray)' }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{String(v ?? '—')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Admin() {
  const [overview, setOverview] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({ webhooks: [], audit: [] });
  const [usage, setUsage] = useState<any[]>([]);
  const [mm, setMm] = useState<any>(null);
  const [templates, setTemplates] = useState<any>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadErrors = async () => {
    const e = await api.adminErrors();
    if (e) setErrors(e);
  };

  useEffect(() => {
    (async () => {
      const [o, c, f, e, u, m, t] = await Promise.all([
        api.adminOverview(), api.adminChannels(), api.adminFlows(), api.adminErrors(), api.adminUsage(),
        api.adminMicromind(), api.adminTemplates(),
      ]);
      if (o) setOverview(o);
      if (c) setChannels(c);
      if (f) setFlows(f);
      if (e) setErrors(e);
      if (u) setUsage(u);
      if (m) setMm(m);
      if (t) setTemplates(t);
    })();
  }, []);

  // One-click replay for a stuck intake row. The backend refuses
  // already-settled rows and skips re-persisting partial first attempts,
  // so a retry can never duplicate a conversation or message.
  const retryWebhook = async (id: string) => {
    setRetrying(id);
    setNotice(null);
    const res = await api.retryWebhook(id);
    setRetrying(null);
    if (res?.retried) {
      setNotice(`Replayed ${id} → ${res.status}.`);
      loadErrors();
    } else {
      setNotice(res?.error || `Replay of ${id} failed.`);
    }
  };

  if (!overview) return <div style={{ padding: 8, fontSize: 13, color: 'var(--stone-gray)' }}>Loading admin… (backend unreachable?)</div>;

  const sumN = (rows: any[] | null | undefined) =>
    (rows || []).reduce((s, r) => s + Number(r?.n ?? 0), 0);
  const workspaceCount = overview.workspaces?.length ?? '—';
  const channelTotal = overview.channels ? sumN(overview.channels) : (channels?.length ?? '—');
  const flowTotal = overview.flows ? sumN(overview.flows) : (flows?.length ?? '—');
  const messages24h = overview.messages24h ? sumN(overview.messages24h) : '—';
  const errors24h = overview.errors24h ?? '—';

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader
        eyebrow="Operations"
        title="Admin"
        sub={`Internal only — DB ${overview.dbUp ? 'up' : 'down'}. Put behind SSO before any production pilot.`}
        live={!!overview.dbUp}
        actions={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-600)' }}><ShieldAlert size={16} /> Internal</span>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Workspaces" value={workspaceCount} />
        <Stat label="Channels" value={channelTotal} />
        <Stat label="Flows" value={flowTotal} />
        <Stat label="Messages (24h)" value={messages24h} tone="neutral" />
        <Stat label="Errors (24h)" value={errors24h} tone={Number(errors24h) > 0 ? 'down' : 'neutral'} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>MicroMind control plane</SectionTitle>
        {!mm ? <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No data.</div> : (
          <Table
            cols={['Aspect', 'Value']}
            rows={[
              ['Provisioner auth', mm.provisioner?.mode],
              ['Analyst flow', mm.analyst?.flowSet ? `configured (${mm.analyst?.override || 'env'})` : 'not set (falls back)'],
              ['Tenant folder', mm.folder?.id ? `${mm.folder.status} (${String(mm.folder.id).slice(0, 8)}…)` : mm.folder?.status],
              ['DB', mm.dbUp ? 'up' : 'down'],
            ]}
          />
        )}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Channels</SectionTitle>
        <Table
          cols={['Channel', 'Name', 'Status', 'Flow', 'Folder', 'Key', 'Last test', 'Convs', 'Last webhook', 'Last sync']}
          rows={channels.map((c: any) => [c.channel, c.display_name || c.username, c.status, c.micromind_flow_id || '—', c.folder_status || '—', c.key_provisioned ? 'linked' : '—', c.last_test || 'never', c.conversations, c.last_webhook, c.last_sync])}
        />
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>MicroMind flows</SectionTitle>
        <Table
          cols={['Purpose', 'Label', 'Flow id', 'Source', 'Key', 'Last test', 'Status', 'Updated']}
          rows={flows.map((f: any) => [
            f.purpose || 'channel',
            f.label || f.template,
            f.external_flow_id || '—',
            f.source || '—',
            f.key_linked ? 'linked' : '—',
            f.last_test_status ? `${f.last_test_status}${f.last_test_at ? ` (${String(f.last_test_at).slice(0, 16).replace('T', ' ')})` : ''}` : 'never',
            f.status,
            f.updated_at,
          ])}
        />
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Flow templates (registry sync)</SectionTitle>
        {!templates ? <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No data.</div> : (
          <Table
            cols={['Channel', 'Current', 'Source', 'Status', 'Clones']}
            rows={Object.entries(templates).map(([channel, t]: [string, any]) => [
              channel,
              t.currentVersion || '—',
              t.currentSource || '—',
              t.status || '—',
              (t.inUse || []).length
                ? (t.inUse || []).map((u: any) => `${u.version}×${u.clones}${u.stale ? ' (stale)' : ''}`).join(', ')
                : 'none',
            ])}
          />
        )}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Errors (failed intake + stuck longer than 15 min)</SectionTitle>
        {notice && <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 8 }}>{notice}</div>}
        {!(errors.webhooks || []).length ? (
          <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No data.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr>{['Provider', 'Event', 'Status', 'At', ''].map((c) => <th key={c} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--stone-gray)' }}>{c}</th>)}</tr></thead>
              <tbody>{(errors.webhooks || []).map((w: any) => (
                <tr key={w.id}>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{w.provider}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{String(w.external_event_id || '').slice(0, 24)}…</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{w.status}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{w.created_at}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                    <button
                      className="btn" disabled={retrying === w.id}
                      onClick={() => retryWebhook(w.id)}
                      style={{ height: 26, padding: '0 10px', fontSize: 11.5, fontWeight: 700 }}
                    >
                      {retrying === w.id ? 'Replaying…' : 'Retry'}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Usage (30d)</SectionTitle>
        <Table
          cols={['Provider', 'Day', 'Events', 'Processed']}
          rows={usage.map((u: any) => [u.provider, String(u.day).slice(0, 10), u.events, u.processed])}
        />
      </Card>
    </div>
  );
}
