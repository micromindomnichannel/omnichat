import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, { bg: string; color: string }> = {
  'Confirmed': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'Processing': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Shipped': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Delivered': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'Cancelled': { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  'Completed': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'No-show': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  'Active': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'Paused': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  'In Stock': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'Low Stock': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  'Out of Stock': { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  'AI Handling': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Human': { bg: 'var(--ink-900)', color: 'white' },
  'New': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Returning': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'VIP': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  'Good': { bg: 'var(--success-bg)', color: 'var(--success)' },
  'Fair': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  'Watch': { bg: 'var(--danger-bg)', color: 'var(--danger)' }
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = statusColors[status] || { bg: 'var(--surface-0)', color: 'var(--ink-600)' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 6px' : '4px 10px',
      borderRadius: 4,
      background: colors.bg,
      color: colors.color,
      fontSize: size === 'sm' ? 10.5 : 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  );
}
