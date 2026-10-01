import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Drawer } from '../components/shared/Drawer';
import { OrderDrawer } from '../components/commerce/OrderDrawer';
import { OrderDetailDrawer } from '../components/commerce/OrderDetailDrawer';
import { PageHeader, Card, EmptyState } from '../components/dash/kit';
import { Search, Plus, ShoppingBag, Filter } from 'lucide-react';
import { Order } from '../state/mockData';

export function Orders() {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showNewDrawer, setShowNewDrawer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statuses = ['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filtered = state.orders.filter(o => {
    const matchesSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.productName.toLowerCase().includes(search.toLowerCase()) ||
      o.governorate.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Keep selectedOrder in sync with state updates
  const activeOrder = selectedOrder ? (state.orders.find(o => o.id === selectedOrder.id) || selectedOrder) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        sub="Track every sale, status change, and customer checkout."
        actions={
          <button
            onClick={() => setShowNewDrawer(true)}
            className="btn btn-primary"
            style={{
              background: 'var(--signal-orange)',
              border: 'none',
              color: '#fff',
              height: 40,
              padding: '0 18px',
              borderRadius: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> New Order
          </button>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
          <input
            type="text"
            placeholder="Search orders, products, cities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 280,
              height: 36,
              padding: '0 10px 0 30px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              fontSize: 13,
              background: 'var(--surface-1)',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {statuses.map(st => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${active ? 'var(--signal-orange)' : 'var(--border)'}`,
                  background: active ? 'var(--signal-orange-subtle)' : 'var(--surface-1)',
                  color: active ? 'var(--signal-orange)' : 'var(--ink-600)',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          columns={[
            { key: 'id', label: 'Order ID' },
            { key: 'customer', label: 'Customer' },
            { key: 'product', label: 'Product' },
            { key: 'total', label: 'Total' },
            { key: 'status', label: 'Status' },
            { key: 'date', label: 'Date' }
          ]}
          data={filtered}
          emptyState={
            <EmptyState
              icon={<ShoppingBag size={24} color="var(--signal-orange)" />}
              title="No orders found"
              copy={statusFilter === 'All' ? "New checkouts from every channel land here automatically." : `No orders matching filter "${statusFilter}".`}
              action={
                <button
                  onClick={() => setShowNewDrawer(true)}
                  style={{
                    background: 'var(--signal-orange)',
                    border: 'none',
                    color: '#fff',
                    height: 40,
                    padding: '0 18px',
                    borderRadius: 10,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> New Order
                </button>
              }
            />
          }
          renderRow={(order) => {
            const customer = state.customers.find(c => c.id === order.customerId);
            return (
              <tr
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                  #{order.id}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                  {customer?.name || 'Customer'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>
                  {order.productName}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                  {order.total.toLocaleString()} EGP
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-400)' }}>
                  {order.date}
                </td>
              </tr>
            );
          }}
        />
      </Card>

      {/* New Order Drawer */}
      <Drawer isOpen={showNewDrawer} onClose={() => setShowNewDrawer(false)} title="New Order">
        <OrderDrawer customerId="" onClose={() => setShowNewDrawer(false)} />
      </Drawer>

      {/* Order Detail & Status Management Drawer */}
      <OrderDetailDrawer
        isOpen={Boolean(activeOrder)}
        order={activeOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
