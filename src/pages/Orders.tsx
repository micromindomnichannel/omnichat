import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Drawer } from '../components/shared/Drawer';
import { OrderDrawer } from '../components/commerce/OrderDrawer';
import { Search, Plus } from 'lucide-react';

export function Orders() {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const filtered = state.orders.filter(o => !search || o.id.includes(search) || o.productName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
          <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }} />
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn btn-primary" style={{ background: accentColor }}><Plus size={16} /> New Order</button>
      </div>
      <div className="card">
        <Table columns={[{ key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Customer' }, { key: 'product', label: 'Product' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }]}
          data={filtered}
          renderRow={(order) => {
            const customer = state.customers.find(c => c.id === order.customerId);
            return (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>#{order.id}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{customer?.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{order.productName}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{order.total.toLocaleString()} EGP</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={order.status} size="sm" /></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-400)' }}>{order.date}</td>
              </tr>
            );
          }} />
      </div>
      <Drawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} title="New Order">
        <OrderDrawer customerId="" onClose={() => setShowDrawer(false)} />
      </Drawer>
    </div>
  );
}
