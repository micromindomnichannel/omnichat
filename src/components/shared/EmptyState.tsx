import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: 12
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'var(--surface-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-400)'
      }}>
        {icon || <Inbox size={24} />}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>{title}</p>
        {description && (
          <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
