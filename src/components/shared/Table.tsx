import React from 'react';

interface TableProps {
  columns: { key: string; label: string; width?: string }[];
  data: any[];
  renderRow: (row: any, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function Table({ columns, data, renderRow, emptyState }: TableProps) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--ink-400)',
                whiteSpace: 'nowrap',
                width: col.width
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  );
}
