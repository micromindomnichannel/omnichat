import React, { useEffect, useState } from 'react';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { ArrowLeft, ArrowRight, Check, Instagram, MessageCircle, Facebook, Music, Globe, Send, Mail } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const channels = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', real: true, tokenHint: 'Page access token' },
  { id: 'messenger', name: 'Messenger', icon: Facebook, color: '#0099FF', real: true, tokenHint: 'Page access token' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366', real: true, tokenHint: 'System-user token', byof: true },
  { id: 'telegram', name: 'Telegram', icon: Send, color: '#229ED9', real: true, tokenHint: 'Bot token', byof: true },
  { id: 'gmail', name: 'Gmail', icon: Mail, color: '#EA4335', real: true, tokenHint: 'OAuth token (pending)', byof: true },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: '#000000', real: false },
  { id: 'website', name: 'Website', icon: Globe, color: '#6B7280', real: false },
];

type BackendAccount = { id: string; channel: string; display_name?: string; status: string };

const guides: Record<string, string[]> = {
  instagram: ['Connect your Instagram Business account to a Facebook Page, then paste a Page token with instagram_manage_messages.'],
  messenger: ['Meta Developers → your app → Messenger → generate a Page access token (pages_messaging).'],
  whatsapp: ['Meta app → WhatsApp → copy the phone-number ID + system-user token. A MicroMind flow ID is also required for now.'],
  telegram: ['Chat @BotFather → /newbot → copy the token. A MicroMind flow ID is also required for now.'],
  gmail: ['Google OAuth + Pub/Sub watch required — slice pending.'],
};

export function ConnectChannels({ data, onNext, onBack }: Props) {
  const { accentColor } = useVertical();
  const { state, dispatch, showToast } = useStore();
  const [backend, setBackend] = useState<BackendAccount[] | null>(null);
  const [forming, setForming] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [flowId, setFlowId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getChannels('default').then((rows) => { if (rows) setBackend(rows); });
  }, []);

  const backendStatus = (id: string) => (backend || []).find((a) => a.channel === id)?.status;

  const toggleChannel = (channelId: string) => {
    dispatch({ type: 'TOGGLE_CHANNEL', channel: channelId });
    const isConnected = !state.channelsConnected[channelId];
    showToast(`${channels.find(c => c.id === channelId)?.name} ${isConnected ? 'connected' : 'disconnected'}`, 'success');
  };

  // Real connect through the backend vault + provisioner (best-effort).
  const submitConnect = async (channelId: string) => {
    if (!token && !flowId) {
      showToast('Paste an access token or a MicroMind flow id', 'danger');
      return;
    }
    setBusy(true);
    const res = await api.connectChannel('default', channelId, {
      pageAccessToken: token || undefined,
      micromindFlowId: flowId || undefined,
    });
    setBusy(false);
    if (res?.account) {
      showToast(`${channelId} ${res.status}`, 'success');
      setForming(null);
      setToken('');
      setFlowId('');
      const rows = await api.getChannels('default');
      if (rows) setBackend(rows);
    } else {
      showToast(res?.error || `Connect failed (${res?.code || 'offline'})`, 'danger');
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= 2 ? accentColor : 'var(--border)'
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          Connect your channels
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          Link the platforms where your customers reach you.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {channels.map(channel => {
          const Icon = channel.icon;
          const realStatus = backendStatus(channel.id);
          const connected = realStatus ? realStatus === 'active' : !!state.channelsConnected[channel.id];
          return (
            <div key={channel.id} style={{
              padding: 16, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface-1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={20} color={channel.color} />
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', display: 'block' }}>
                      {channel.name}
                    </span>
                    {channel.real && (
                      <span style={{ fontSize: 11, color: realStatus === 'active' ? 'var(--success)' : 'var(--ink-400)' }}>
                        {realStatus ? `${realStatus === 'active' ? '🟢' : '🟡'} backend: ${realStatus}` : 'backend unreachable — local only'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {connected && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 600, color: 'var(--success)'
                    }}>
                      <Check size={14} /> Connected
                    </span>
                  )}
                  {channel.real && backend && !realStatus ? (
                    <button
                      onClick={() => setForming(forming === channel.id ? null : channel.id)}
                      className="btn"
                      style={{ height: 28, padding: '0 14px', fontSize: 12, background: accentColor, color: 'white' }}
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      className="btn"
                      style={{
                        height: 28, padding: '0 14px', fontSize: 12,
                        background: connected ? 'var(--danger-bg)' : accentColor,
                        color: connected ? 'var(--danger)' : 'white'
                      }}
                    >
                      {connected ? 'Disconnect' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
              {channel.real && forming === channel.id && backend && !realStatus && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {guides[channel.id] && (
                    <div style={{ fontSize: 12, color: 'var(--ink-600)', background: 'var(--surface-0)', borderRadius: 8, padding: '8px 12px' }}>
                      {guides[channel.id].map((g, i) => <div key={i} style={{ marginBottom: 4 }}>{i + 1}. {g}</div>)}
                    </div>
                  )}
                  <input
                    className="input" type="password" value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={`${channel.tokenHint} (encrypted server-side)`}
                  />
                  <input
                    className="input" value={flowId}
                    onChange={(e) => setFlowId(e.target.value)}
                    placeholder={channel.byof ? 'MicroMind flow id (required for now)' : 'MicroMind flow id (optional — auto-provisions)'}
                  />
                  <button
                    onClick={() => submitConnect(channel.id)}
                    disabled={busy}
                    className="btn btn-primary" style={{ background: accentColor }}
                  >
                    {busy ? 'Connecting…' : `Connect ${channel.name}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
        <button onClick={onBack} className="btn btn-outline">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => onNext(data)}
          className="btn btn-primary"
          style={{ background: accentColor }}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
