import React from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { Table } from '../../components/shared/Table';
import { StatusBadge } from '../../components/shared/StatusBadge';

interface Props {
  onProductClick: (product: any) => void;
}

export function ProductTable({ onProductClick }: Props) {
  const { state } = useStore();
  return (
    <Table columns={[{ key: 'name', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'price', label: 'Price' }, { key: 'stock', label: 'Stock' }, { key: 'category', label: 'Category' }]}
      data={state.products}
      renderRow={(product) => (
        <tr key={product.id} onClick={() => onProductClick(product)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <td style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={product.image} alt={product.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{product.name}</span>
            </div>
          </td>
          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-600)' }}>{product.sku}</td>
          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{product.price.toLocaleString()} EGP</td>
          <td style={{ padding: '12px 16px' }}><StatusBadge status={product.stock === 0 ? 'Out of Stock' : product.stock < 5 ? 'Low Stock' : 'In Stock'} size="sm" /></td>
          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{product.category}</td>
        </tr>
      )} />
  );
}
