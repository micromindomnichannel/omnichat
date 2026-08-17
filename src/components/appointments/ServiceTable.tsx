import React from 'react';
import { useStore } from '../../state/store';
import { Table } from '../../components/shared/Table';
import { Clock } from 'lucide-react';

interface Props {
  onServiceClick: (service: any) => void;
}

export function ServiceTable({ onServiceClick }: Props) {
  const { state } = useStore();
  return (
    <Table columns={[{ key: 'name', label: 'Service' }, { key: 'price', label: 'Price' }, { key: 'duration', label: 'Duration' }, { key: 'category', label: 'Category' }]}
      data={state.services}
      renderRow={(service) => (
        <tr key={service.id} onClick={() => onServiceClick(service)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{service.name}</span></td>
          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>From {service.price.toLocaleString()} EGP</td>
          <td style={{ padding: '12px 16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}><Clock size={12} /> {service.duration} min</span>
          </td>
          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{service.category}</td>
        </tr>
      )} />
  );
}
