import React from 'react';
import { useVertical } from '../../state/verticalContext';
import { ArrowLeft, Check, LayoutDashboard } from 'lucide-react';

interface Props {
  data: any;
  onComplete: () => void;
  onBack: () => void;
}

export function Finish({ data, onComplete, onBack }: Props) {
  const { vertical, accentColor } = useVertical();

  const checklist = [
    'Business profile configured',
    'Channels connected',
    'Knowledge base uploaded',
    'AI behavior reviewed'
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: accentColor
            }} />
          ))}
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Check size={32} color="var(--success)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          You're all set!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          Your SELLER workspace is ready. Here's what we configured:
        </p>
      </div>

      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 24,
        textAlign: 'left',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--success-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Check size={12} color="var(--success)" />
              </div>
              <span style={{ fontSize: 14, color: 'var(--ink-900)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onBack} className="btn btn-outline">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onComplete}
          className="btn btn-primary btn-lg"
          style={{ background: accentColor }}
        >
          <LayoutDashboard size={18} /> Enter Dashboard
        </button>
      </div>
    </div>
  );
}
