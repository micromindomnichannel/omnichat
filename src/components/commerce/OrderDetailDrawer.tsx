import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { Order } from '../../state/mockData';
import { Drawer } from '../shared/Drawer';
import { StatusBadge } from '../shared/StatusBadge';
import { MessageSquare, Truck, CheckCircle2, MapPin, CreditCard, Package } from 'lucide-react';

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailDrawer({ order, isOpen, onClose }: OrderDetailDrawerProps) {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState<Order['status']>('Confirmed');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const customer = state.customers.find(c => c.id === order.customerId);
  const product = state.products.find(p => p.id === order.productId);

  const statuses: Order['status'][] = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const handleUpdateStatus = (newStatus: Order['status']) => {
    setCurrentStatus(newStatus);
    const updatedOrder: Order = {
      ...order,
      status: newStatus
    };
    dispatch({ type: 'UPDATE_ORDER', order: updatedOrder });
    showToast(`Order #${order.id} status updated to ${newStatus}`, 'success');
  };

  const handleSendToLogistics = () => {
    setIsUpdating(true);
    setTimeout(() => {
      handleUpdateStatus('Processing');
      setIsUpdating(false);
      showToast(`Order #${order.id} dispatched to shipping partner`, 'success');
    }, 400);
  };

  const handleOpenInbox = () => {
    onClose();
    navigate('/inbox');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Order #${order.id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--surface-0)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={currentStatus} size="md" />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Date</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 4, color: 'var(--ink-900)' }}>
              {order.date}
            </div>
          </div>
        </div>

        {/* Status Change Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8, display: 'block' }}>
            Update Order Status
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {statuses.map(st => {
              const active = currentStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${active ? accentColor : 'var(--border)'}`,
                    background: active ? accentColor : 'var(--surface-0)',
                    color: active ? '#fff' : 'var(--ink-600)',
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

        {/* Customer Information Card */}
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-400)' }}>
              Customer Details
            </span>
            <button
              onClick={handleOpenInbox}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px', fontSize: 11, gap: 4 }}
            >
              <MessageSquare size={12} /> Chat in Inbox
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <img
              src={customer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={customer?.name || 'Customer'}
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>
                {customer?.name || 'Guest Customer'}
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-500)' }}>
                {customer?.phone || 'No phone recorded'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--ink-600)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: 'var(--signal-orange)' }} />
            <div>
              <span style={{ fontWeight: 600 }}>{order.governorate || 'Cairo'}</span> — {order.address || 'Address on file'}
            </div>
          </div>
        </div>

        {/* Product & Payment Summary */}
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-400)', display: 'block', marginBottom: 12 }}>
            Items & Payment
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            {product?.image ? (
              <img src={product.image} alt={order.productName} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} color="var(--ink-400)" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-900)' }}>{order.productName}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>
                {order.variant ? `Variant: ${order.variant} • ` : ''}Qty: {order.quantity}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {order.total.toLocaleString()} EGP
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-500)' }}>
              <span>Payment Method</span>
              <span style={{ fontWeight: 600, color: 'var(--ink-900)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={12} /> {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Credit Card'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: 'var(--midnight-ink)', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
              <span>Total Amount</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{order.total.toLocaleString()} EGP</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSendToLogistics}
            disabled={isUpdating}
            className="btn btn-outline"
            style={{ width: '100%', height: 38, gap: 8, justifyContent: 'center', fontWeight: 600 }}
          >
            <Truck size={15} /> Send to Logistics Partner
          </button>
          <button
            onClick={() => handleUpdateStatus('Delivered')}
            className="btn btn-primary"
            style={{ width: '100%', height: 38, background: '#0F8357', gap: 8, justifyContent: 'center', fontWeight: 600 }}
          >
            <CheckCircle2 size={15} /> Mark as Delivered
          </button>
        </div>
      </div>
    </Drawer>
  );
}
