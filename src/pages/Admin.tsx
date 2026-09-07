// Internal admin dashboard: workspaces, channels, flows, errors, usage.
// Backend: GET /api/v1/admin/*. Null-safe when the DB is down (dbUp flag).
import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px', color: 'var(--midnight-ink)' }}>{title}</h3>
      {children}
    </div>
  );
}

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

  useEffect(() => {
    (async () => {
      const [o, c, f, e, u, m] = await Promise.all([
        api.adminOverview(), api.adminChannels(), api.adminFlows(), api.adminErrors(), api.adminUsage(),
        api.adminMicromind(),
      ]);
      if (o) setOverview(o);
      if (c) setChannels(c);
      if (f) setFlows(f);
      if (e) setErrors(e);
      if (u) setUsage(u);
      if (m) setMm(m);
    })();
  }, []);

  if (!overview) return <div style={{ padding: 8, fontSize: 13, color: 'var(--stone-gray)' }}>Loading admin… (backend unreachable?)</div>;

  return (
    <div style={{ maxWidth: 1000 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>
        <ShieldAlert size={20} /> Admin
      </h2>
      <p style={{ fontSize: 12, color: 'var(--stone-gray)', margin: '0 0 16px' }}>
        Internal only — DB {overview.dbUp ? '🟢 up' : '🔴 down'}. Put behind SSO before any production pilot.
      </p>
      <Section title="MicroMind control plane">
        {!mm ? <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No data.</div> : (
          <Table
            cols={['Aspect', 'Value']}
            rows={[
              ['Provisioner auth', mm.provisioner?.mode],
              ['Analyst flow', mm.analyst?.flowSet ? 'configured' : 'not set (falls back)'],
              ['Tenant folder', mm.folder?.id ? `${mm.folder.status} (${String(mm.folder.id).slice(0, 8)}…)` : mm.folder?.status],
              ['DB', mm.dbUp ? 'up' : 'down'],
            ]}
          />
        )}
      </Section>
      <Section title="Channels">
        <Table
          cols={['Channel', 'Name', 'Status', 'Flow', 'Folder', 'Key', 'Convs', 'Last webhook', 'Last sync']}
          rows={channels.map((c: any) => [c.channel, c.display_name || c.username, c.status, (c.micromind_flow_id || '').slice(0, 8), c.folder_status || '—', c.key_provisioned ? 'linked' : '—', c.conversations, c.last_webhook, c.last_sync])}
        />
      </Section>
      <Section title="MicroMind flows">
        <Table
          cols={['Template', 'Flow id', 'Key', 'Status', 'Updated']}
          rows={flows.map((f: any) => [f.template, (f.external_flow_id || '').slice(0, 13), f.key_linked ? 'linked' : '—', f.status, f.updated_at])}
        />
      </Section>
      <Section title="Errors (24h)">
        <Table
          cols={['Provider', 'Event', 'Status', 'At']}
          rows={(errors.webhooks || []).map((w: any) => [w.provider, w.external_event_id, w.status, w.created_at])}
        />
      </Section>
      <Section title="Usage (30d)">
        <Table
          cols={['Provider', 'Day', 'Events', 'Processed']}
          rows={usage.map((u: any) => [u.provider, String(u.day).slice(0, 10), u.events, u.processed])}
        />
      </Section>
    </div>
  );
}
