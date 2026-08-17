import React from 'react';
import { useVertical } from '../../state/verticalContext';
import { ArrowLeft, ArrowRight, Upload, FileText, Image, Link } from 'lucide-react';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function KnowledgeSetup({ data, onNext, onBack }: Props) {
  const { vertical, accentColor } = useVertical();

  const dropzones = vertical === 'commerce'
    ? [
        { label: 'Product Catalog', icon: FileText, desc: 'Upload your product list, prices, and descriptions' },
        { label: 'FAQs', icon: FileText, desc: 'Common questions about delivery, returns, and payment' },
        { label: 'Policies', icon: FileText, desc: 'Return policy, warranty, and terms of service' }
      ]
    : [
        { label: 'Service List', icon: FileText, desc: 'Your services, prices, and durations' },
        { label: 'FAQs', icon: FileText, desc: 'Common questions about booking and preparation' },
        { label: 'Policies', icon: FileText, desc: 'Cancellation policy and terms' }
      ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= 3 ? accentColor : 'var(--border)'
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          Set up your knowledge base
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          Upload documents so your AI can answer accurately.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dropzones.map(zone => {
          const Icon = zone.icon;
          return (
            <div key={zone.label} style={{
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--surface-1)',
              transition: 'border-color 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Icon size={24} color={accentColor} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>
                {zone.label}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>{zone.desc}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', padding: '4px 8px', background: 'var(--surface-0)', borderRadius: 4 }}>PDF</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', padding: '4px 8px', background: 'var(--surface-0)', borderRadius: 4 }}>DOCX</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', padding: '4px 8px', background: 'var(--surface-0)', borderRadius: 4 }}>Text</span>
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
