import React from 'react';
import { useVertical } from '../../state/verticalContext';
import { ArrowLeft, ArrowRight, Bot } from 'lucide-react';

interface Props {
  data: any;
  onNext: () => void;
  onBack: () => void;
}

export function AIReview({ data, onNext, onBack }: Props) {
  const { vertical, accentColor } = useVertical();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Answer product/service questions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Check availability and stock</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Create orders and book appointments</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Escalate to human when needed</span>
        </div>
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
