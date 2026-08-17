import React from 'react';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { ArrowLeft, ArrowRight, Check, Instagram, MessageCircle, Facebook, Music, Globe } from 'lucide-react';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const channels = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: '#000000' },
  { id: 'website', name: 'Website', icon: Globe, color: '#6B7280' },
];

export function ConnectChannels({ data, onNext, onBack }: Props) {
  const { accentColor } = useVertical();
  const { state, dispatch, showToast } = useStore();

  const toggleChannel = (channelId: string) => {
    dispatch({ type: 'TOGGLE_CHANNEL', channel: channelId });
    const isConnected = !state.channelsConnected[channelId];
    showToast(`${channels.find(c => c.id === channelId)?.name} ${isConnected ? 'connected' : 'disconnected'}`, 'success');
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
          const connected = state.channelsConnected[channel.id];
          return (
            <div key={channel.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface-1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon size={20} color={channel.color} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
                  {channel.name}
                </span>
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
              </div>
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
