import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ChannelIcon } from '../../components/shared/ChannelIcon';
import { Drawer } from '../../components/shared/Drawer';
import { OrderDrawer } from '../../components/commerce/OrderDrawer';
import { BookingDrawer } from '../../components/appointments/BookingDrawer';
import { Tag, X, Plus, ShoppingCart, Calendar, Check, Package, Sparkles, CheckCircle2 } from 'lucide-react';
import { Order } from '../../state/mockData';

interface Props {
  conversationId: string;
}

export function ContextPanel({ conversationId }: Props) {
  const { state, dispatch, showToast } = useStore();
  const { isCommerce, accentColor } = useVertical();
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [stockChecked, setStockChecked] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const conversation = state.conversations.find(c => c.id === conversationId);
  const customer = state.customers.find(c => c.id === conversation?.customerId);

  if (!conversation || !customer) return null;

  const customerOrders = state.orders.filter(o => o.customerId === customer.id);
  const customerAppointments = state.appointments.filter(a => a.customerId === customer.id);

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const updatedCustomer = { ...customer, tags: [...customer.tags, newTag.trim()] };
    dispatch({ type: 'UPDATE_CUSTOMER', customer: updatedCustomer });
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedCustomer = { ...customer, tags: customer.tags.filter(t => t !== tag) };
    dispatch({ type: 'UPDATE_CUSTOMER', customer: updatedCustomer });
  };

  const handleCheckDatabaseStock = () => {
    setStockChecked(true);
    showToast('Database stock verified: 12 units available for Black Leather Bag', 'success');
  };

  const handleConfirmOrderAI = () => {
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      customerId: customer.id,
      productId: 'p1',
      productName: 'Black Leather Bag',
      variant: 'Standard',
      quantity: 1,
      total: 850,
      status: 'Confirmed',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'COD',
      governorate: 'Cairo',
      address: 'Street 9, Maadi'
    };

    dispatch({ type: 'ADD_ORDER', order: newOrder });
    setOrderConfirmed(true);
    showToast(`Order #${newOrder.id} automatically confirmed by AI and saved to PostgreSQL!`, 'success');
  };

  return (
    <>
      <div style={{
        width: 320,
        minWidth: 320,
        background: 'var(--surface-1)',
        borderLeft: '1px solid var(--border)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Customer Profile */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={customer.avatar} alt={customer.name} style={{ width: 48, height: 48, borderRadius: '50%' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>{customer.name}</p>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)' }}>{customer.phone}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, justifyContent: 'center' }}>
            {customer.channels.map(ch => (
              <div key={ch} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)',
                fontSize: 11, fontWeight: 600, color: 'var(--ink-600)'
              }}>
                <ChannelIcon channel={ch} size={12} /> {ch}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
            {customer.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 4, background: 'var(--signal-orange-subtle)',
                color: 'var(--signal-orange)', fontSize: 11, fontWeight: 600
              }}>
                {tag}
                <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* AI Database Actions */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} color="var(--signal-orange)" /> AI Inventory & Database Actions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleCheckDatabaseStock}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', background: 'white' }}
            >
              <Package size={14} color="var(--signal-orange)" />
              <span>{stockChecked ? '✅ Stock Checked: 12 In Stock' : 'Check Item Stock in DB'}</span>
            </button>

            <button
              onClick={handleConfirmOrderAI}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', background: orderConfirmed ? '#0F8357' : 'var(--signal-orange)' }}
            >
              {orderConfirmed ? <CheckCircle2 size={14} /> : <ShoppingCart size={14} />}
              <span>{orderConfirmed ? 'Order Confirmed in DB!' : 'Confirm Order via AI'}</span>
            </button>
          </div>
        </div>

        {/* AI Context */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Conversation Intent
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Detected Intent</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>{conversation.aiContext.intent}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Current Stage</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--signal-orange)' }}>{conversation.aiContext.stage}</p>
            </div>
          </div>
        </div>

        {/* Create Order Button */}
        <div style={{ padding: 20, marginTop: 'auto' }}>
          <button
            onClick={() => setShowOrderDrawer(true)}
            className="btn btn-primary"
            style={{ width: '100%', background: 'var(--midnight-ink)' }}
          >
            <ShoppingCart size={16} /> Manual Order Entry
          </button>
        </div>
      </div>

      <Drawer isOpen={showOrderDrawer} onClose={() => setShowOrderDrawer(false)} title="Create Order">
        <OrderDrawer customerId={customer.id} onClose={() => setShowOrderDrawer(false)} />
      </Drawer>
    </>
  );
}
