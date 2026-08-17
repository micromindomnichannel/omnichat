import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  compact?: boolean;
}

export function StatCard({ label, value, trend, trendLabel, compact }: StatCardProps) {
  return (
    <div className="card" style={{
      padding: compact ? '16px' : '20px',
      height: compact ? 72 : 96,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <span className="eyebrow">{label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <span style={{
          fontSize: compact ? 20 : 26,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink-900)',
          lineHeight: 1
        }}>
          {value}
        </span>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 4,
            background: trend >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
}
