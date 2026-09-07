import React, { useEffect, useState } from 'react';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { ArrowLeft, ArrowRight, Bot } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  data: any;
  onNext: () => void;
  onBack: () => void;
}

export function AIReview({ data, onNext, onBack }: Props) {
  const { vertical, accentColor } = useVertical();
  const { state } = useStore();
  const [live, setLive] = useState<{ backend: boolean; db: boolean; channels: number } | null>(null);

  // Live wiring check: backend health + real channel connections.
  useEffect(() => {
    (async () => {
      const health = await api.getHealth();
      const channels = await api.getChannels('default');
      setLive({
        backend: !!health,
        db: !!(health && (health as any).database?.connected),
        channels: channels ? channels.filter((c: any) => c.status === 'active').length : 0,
      });
    })();
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= 4 ? accentColor : 'var(--border)'
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          Review AI behavior
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          Here's how your AI assistant will interact with customers.
        </p>
      </div>

      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>SELLER AI</p>
            <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Your AI assistant</p>
          </div>
        </div>
        <div style={{
          background: accentColor + '14',
          borderRadius: 12,
          padding: 16,
          borderBottomRightRadius: 4
        }}>
          <p style={{ fontSize: 14, color: 'var(--ink-900)', lineHeight: 1.6 }}>
            I answer questions using your approved business information and hand conversations to your team when necessary. I can check product availability, create orders, book appointments, and follow up with customers automatically.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { ok: true, label: 'Answer product/service questions' },
          { ok: true, label: 'Check availability and stock' },
          { ok: true, label: 'Create orders and book appointments' },
          { ok: true, label: 'Escalate to human when needed' },
          { ok: live?.backend, label: live ? (live.backend ? 'Backend API connected' : 'Backend offline — demo mode') : 'Checking backend…' },
          { ok: live?.db, label: live ? (live.db ? 'Database connected' : 'Database unreachable — demo data') : 'Checking database…' },
          { ok: (live?.channels || 0) > 0, label: live ? `${live.channels} live channel${live.channels === 1 ? '' : 's'} connected` : 'Checking channels…' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.ok ? 'var(--success)' : row.ok === false ? 'var(--danger)' : 'var(--ink-400)' }} />
            <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>{row.label}</span>
          </div>
        ))}
        {live && !live.backend && (
          <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            You can finish onboarding now — everything syncs automatically once the backend is reachable.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
        <button onClick={onBack} className="btn btn-outline">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="btn btn-primary"
          style={{ background: accentColor }}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
