import React from 'react';

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: active === tab ? 'var(--ink-900)' : 'var(--ink-600)',
            border: 'none',
            background: 'transparent',
            borderBottom: active === tab ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer',
            marginBottom: -1,
            transition: 'all 0.15s ease'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
