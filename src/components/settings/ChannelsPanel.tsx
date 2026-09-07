// ChannelsPanel: real backend channel status for the Messenger/Instagram slice,
// with local-toggle fallback when the API is unreachable.
// Backend never returns secrets — only {channel, status, display_name, ...}.
import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, MessageCircle, Send, Mail, Music, Globe } from 'lucide-react';
import { api } from '../../services/api';

const SLICE: Record<string, { label: string; Icon: React.ElementType; color: string; tokenHint: string; byof?: boolean }> = {
  messenger: { label: 'Messenger', Icon: Facebook, color: '#0099FF', tokenHint: 'Page access token (encrypted server-side)' },
  instagram: { label: 'Instagram', Icon: Instagram, color: '#E4405F', tokenHint: 'Page access token (encrypted server-side)' },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle, color: '#25D366', tokenHint: 'System-user token (encrypted server-side)', byof: true },
  telegram: { label: 'Telegram', Icon: Send, color: '#229ED9', tokenHint: 'Bot token from @BotFather (encrypted server-side)', byof: true },
  gmail: { label: 'Gmail', Icon: Mail, color: '#EA4335', tokenHint: 'OAuth refresh token (placeholder — slice pending)', byof: true },
};

const LOCAL_ONLY: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  tiktok: { label: 'TikTok', Icon: Music, color: '#171717' },
  website: { label: 'Website', Icon: Globe, color: '#343434' },
};

type Account = {
  id: string; channel: string; display_name?: string; username?: string;
  external_account_id?: string; micromind_flow_id?: string; status: string;
  tenancy?: { folder: string; folderId: string | null; keyProvisioned: boolean };
};

export function ChannelsPanel({ showToast, local, onToggleLocal }: {
  showToast: (msg: string, type?: 'success' | 'warning' | 'danger') => void;
  local: Record<string, boolean>;
  onToggleLocal: (channel: string) => void;
}) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [forming, setForming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ displayName: '', username: '', externalAccountId: '', pageAccessToken: '', micromindFlowId: '' });

  const refresh = async () => {
    const rows = await api.getChannels('default');
    if (rows) setAccounts(rows);
  };
  useEffect(() => { refresh(); }, []);

  const byChannel = (c: string) => (accounts || []).filter((a) => a.channel === c);
  const dot = (s: string) => s === 'active' ? '🟢' : s === 'danger' ? '🔴' : s === 'disconnected' ? '⚪' : '🟡';

  const submitConnect = async (channel: string) => {
    if (!form.pageAccessToken && !form.micromindFlowId) {
      showToast('Paste a Page access token or a MicroMind flow id', 'danger');
      return;
    }
    setBusy(true);
    const res = await api.connectChannel('default', channel, {
      displayName: form.displayName || undefined,
      username: form.username || undefined,
      externalAccountId: form.externalAccountId || undefined,
      pageAccessToken: form.pageAccessToken || undefined,
      micromindFlowId: form.micromindFlowId || undefined,
    });
    setBusy(false);
    if (res?.account) {
      showToast(`${channel} ${res.status}`, 'success');
      setForming(null);
      setForm({ displayName: '', username: '', externalAccountId: '', pageAccessToken: '', micromindFlowId: '' });
      refresh();
    } else {
      showToast(res?.error || `Connect failed (${channel})`, 'danger');
    }
  };

  const act = async (id: string, op: 'disconnect' | 'reconnect') => {
    setBusy(true);
    const res = op === 'disconnect' ? await api.disconnectChannel(id) : await api.reconnectChannel(id);
    setBusy(false);
    if (res?.status) { showToast(`${res.channel} ${res.status}`, 'success'); refresh(); }
    else showToast(res?.error || `${op} failed`, 'danger');
  };

  const card = (key: string, meta: { label: string; Icon: React.ElementType; color: string; tokenHint: string; byof?: boolean }) => {
    const { Icon } = meta;
    const rows = byChannel(key);
    const primary = rows[0];
    return (
      <div key={key} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={meta.color} />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block' }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: primary?.status === 'active' ? '#0F8357' : 'var(--stone-gray)' }}>
                {accounts === null ? '⚪ Checking backend…' :
                  primary ? `${dot(primary.status)} ${primary.status}${primary.display_name ? ` — ${primary.display_name}` : ''}${primary.micromind_flow_id ? ' — flow linked' : ''}` :
                    '⚪ Not connected'}
              </span>
              {primary?.tenancy && (
                <span style={{ fontSize: 11, color: 'var(--stone-gray)', display: 'block', marginTop: 2 }}>
                  📁 folder {primary.tenancy.folder}{primary.tenancy.keyProvisioned ? ' · 🔑 key linked' : ' · key pending'}
                </span>
              )}
            </div>
          </div>
          {primary && primary.status === 'active'
            ? <button className="btn" disabled={busy} onClick={() => act(primary.id, 'disconnect')} style={{ height: 32, padding: '0 16px', fontSize: 12.5, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--burnt-coral)' }}>Disconnect</button>
            : primary && primary.status !== 'active'
              ? <button className="btn" disabled={busy} onClick={() => act(primary.id, 'reconnect')} style={{ height: 32, padding: '0 16px', fontSize: 12.5, fontWeight: 700, background: 'var(--signal-orange)', color: 'white' }}>Reconnect</button>
              : <button className="btn" disabled={busy} onClick={() => setForming(forming === key ? null : key)} style={{ height: 32, padding: '0 16px', fontSize: 12.5, fontWeight: 700, background: 'var(--signal-orange)', color: 'white' }}>Connect</button>}
        </div>
        {forming === key && !primary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <input className="input" placeholder="Display name (e.g. Luna Store)" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            <input className="input" placeholder="Username / Page name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input className="input" placeholder="External account id (Page ID / IG ID, optional)" value={form.externalAccountId} onChange={(e) => setForm({ ...form, externalAccountId: e.target.value })} />
            <input className="input" type="password" placeholder={meta.tokenHint} value={form.pageAccessToken} onChange={(e) => setForm({ ...form, pageAccessToken: e.target.value })} />
            <input className="input" placeholder={meta.byof ? 'MicroMind flow id (required — no verified template yet)' : 'MicroMind flow id (optional — auto-provisions if empty + API key set)'} value={form.micromindFlowId} onChange={(e) => setForm({ ...form, micromindFlowId: e.target.value })} />
            <button className="btn btn-primary" disabled={busy} onClick={() => submitConnect(key)} style={{ background: 'var(--signal-orange)' }}>
              {busy ? 'Connecting…' : `Connect ${meta.label}`}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      {Object.entries(SLICE).map(([k, m]) => card(k, m))}
      {accounts === null && (
        <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>Backend unreachable — showing local preview toggles below.</div>
      )}
      {Object.entries(LOCAL_ONLY).map(([k, m]) => {
        const connected = !!local[k];
        const Icon = m.Icon;
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={m.color} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block' }}>{m.label}</span>
                <span style={{ fontSize: 11, color: 'var(--stone-gray)' }}>{connected ? '🟢 Local preview' : '⚪ Slice not built yet'}</span>
              </div>
            </div>
            <button onClick={() => onToggleLocal(k)} className="btn" style={{ height: 32, padding: '0 16px', fontSize: 12.5, fontWeight: 700, background: connected ? 'var(--danger-bg)' : 'var(--signal-orange)', color: connected ? 'var(--burnt-coral)' : 'white' }}>
              {connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
