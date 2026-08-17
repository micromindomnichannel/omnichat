import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Power, ArrowDown, Lock } from 'lucide-react';

export function Automations() {
  const { state, dispatch } = useStore();
  const { vertical, accentColor } = useVertical();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const automations = state.automations.filter(a => a.vertical === vertical);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="page-title">Automations</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {automations.map(auto => (
          <div key={auto.id} className="card" style={{ padding: 20, opacity: auto.active ? 1 : 0.6, transition: 'opacity 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>{auto.name}</h3>
              <button onClick={() => dispatch({ type: 'TOGGLE_AUTOMATION', id: auto.id })}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: auto.active ? accentColor : 'var(--surface-0)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Power size={16} color={auto.active ? 'white' : 'var(--ink-400)'} />
              </button>
            </div>
            <StatusBadge status={auto.active ? 'Active' : 'Paused'} size="sm" />
            <button onClick={() => setExpandedId(expandedId === auto.id ? null : auto.id)}
              style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}>
              {expandedId === auto.id ? 'Hide flow' : 'View flow'}
            </button>
            {expandedId === auto.id && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {auto.steps.map((step: string, i: number) => (
                  <React.Fragment key={i}>
                    <div style={{ padding: '10px 16px', borderRadius: 8, background: accentColor + '14', color: accentColor, fontSize: 12, fontWeight: 600, textAlign: 'center', minWidth: 120 }}>{step}</div>
                    {i < auto.steps.length - 1 && <ArrowDown size={16} color="var(--ink-400)" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink-400)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Coming Soon</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {['Broadcast Campaigns', 'Advanced COD Intelligence', 'No-show Prediction'].map(name => (
            <div key={name} className="card" style={{ padding: 20, opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Lock size={14} color="var(--ink-400)" />
                <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-600)' }}>{name}</h3>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 10, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
