import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ChannelIcon } from '../../components/shared/ChannelIcon';
import { Drawer } from '../../components/shared/Drawer';
import { OrderDrawer } from '../../components/commerce/OrderDrawer';
import { BookingDrawer } from '../../components/appointments/BookingDrawer';
import { Tag, X, Plus, ShoppingCart, Calendar, Check, Package, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Order, Appointment } from '../../state/mockData';

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
  const [dbChecked, setDbChecked] = useState(false);
  const [actionConfirmed, setActionConfirmed] = useState(false);

  const conversation = state.conversations.find(c => c.id === conversationId);
  const customer = state.customers.find(c => c.id === conversation?.customerId);

  if (!conversation || !customer) return null;

  const customerOrders = state.orders.filter(o => o.customerId === customer.id);
  const customerAppointments = state.appointments.filter(a => a.customerId === customer.id);

  const defaultProduct = state.products[0] || { id: 'p1', name: 'Product Item', price: 500, stock: 15 };
  const defaultService = state.services[0] || { id: 's1', name: 'Consultation', price: 400, duration: 30 };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tagToAdd = newTag.trim();
    if (!customer.tags.includes(tagToAdd)) {
      const updatedCustomer = { ...customer, tags: [...customer.tags, tagToAdd] };
      dispatch({ type: 'UPDATE_CUSTOMER', customer: updatedCustomer });
      showToast(`Added tag "${tagToAdd}" to customer`, 'success');
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedCustomer = { ...customer, tags: customer.tags.filter(t => t !== tag) };
    dispatch({ type: 'UPDATE_CUSTOMER', customer: updatedCustomer });
  };

  const handleCheckDatabase = () => {
    setDbChecked(true);
    if (isCommerce) {
      showToast(`Database stock verified: ${defaultProduct.stock} units available for ${defaultProduct.name}`, 'success');
    } else {
      showToast(`Schedule verified: 3 open slots today for ${defaultService.name}`, 'success');
    }
  };

  const handleAIAction = () => {
    if (isCommerce) {
      const newOrder: Order = {
        id: `${1060 + state.orders.length}`,
        customerId: customer.id,
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        variant: 'Standard',
        quantity: 1,
        total: defaultProduct.price + 50,
        status: 'Confirmed',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'COD',
        governorate: customerOrders[0]?.governorate || 'Cairo',
        address: 'Customer address on file'
      };

      dispatch({ type: 'ADD_ORDER', order: newOrder });
      setActionConfirmed(true);
      showToast(`Order #${newOrder.id} automatically confirmed by AI and saved!`, 'success');
    } else {
      const newAppt: Appointment = {
        id: `${2030 + state.appointments.length}`,
        customerId: customer.id,
        serviceId: defaultService.id,
        serviceName: defaultService.name,
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        status: 'Confirmed',
        duration: defaultService.duration || 30
      };

      dispatch({ type: 'ADD_APPOINTMENT', appointment: newAppt });
      setActionConfirmed(true);
      showToast(`Appointment #${newAppt.id} booked for ${newAppt.time} today!`, 'success');
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src={customer.avatar} alt={customer.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
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

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
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
            {showTagInput ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                  autoFocus
                  style={{ width: 80, padding: '2px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)', outline: 'none' }}
                />
                <button onClick={handleAddTag} style={{ background: accentColor, color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}>Add</button>
                <button onClick={() => setShowTagInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--border)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: 'var(--ink-500)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Plus size={11} /> Tag
              </button>
            )}
          </div>
        </div>

        {/* AI Actions */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} color="var(--signal-orange)" />
            {isCommerce ? 'AI Inventory & Actions' : 'AI Clinic & Schedule Actions'}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleCheckDatabase}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', background: 'white' }}
            >
              {isCommerce ? (
                <>
                  <Package size={14} color="var(--signal-orange)" />
                  <span style={{ fontSize: 12 }}>
                    {dbChecked ? `✅ Stock Verified (${defaultProduct.stock} left)` : `Check Stock: ${defaultProduct.name}`}
                  </span>
                </>
              ) : (
                <>
                  <Calendar size={14} color="var(--mint-signal)" />
                  <span style={{ fontSize: 12 }}>
                    {dbChecked ? '✅ Available Slots: 11:30, 14:00' : `Check Slots: ${defaultService.name}`}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleAIAction}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', background: actionConfirmed ? '#0F8357' : (isCommerce ? 'var(--signal-orange)' : 'var(--mint-signal)') }}
            >
              {actionConfirmed ? (
                <>
                  <CheckCircle2 size={14} />
                  <span style={{ fontSize: 12 }}>{isCommerce ? 'Order Saved in Database!' : 'Appointment Confirmed!'}</span>
                </>
              ) : (
                <>
                  {isCommerce ? <ShoppingCart size={14} /> : <Clock size={14} />}
                  <span style={{ fontSize: 12 }}>{isCommerce ? 'Confirm Order via AI' : 'Book Slot via AI'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Context */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Conversation Intent
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Detected Intent</p>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--midnight-ink)' }}>{conversation.aiContext.intent || 'Product inquiry'}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Current Stage</p>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--signal-orange)' }}>{conversation.aiContext.stage || 'Inquiry'}</p>
            </div>
          </div>
        </div>

        {/* Customer History */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isCommerce ? `Orders History (${customerOrders.length})` : `Appointments History (${customerAppointments.length})`}
          </h4>
          {isCommerce ? (
            customerOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customerOrders.slice(0, 3).map(order => (
                  <div key={order.id} style={{ padding: 8, borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)', fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                      <span>#{order.id}</span>
                      <span>{order.total.toLocaleString()} EGP</span>
                    </div>
                    <div style={{ color: 'var(--ink-500)', marginTop: 2 }}>{order.productName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>No past orders for this customer.</p>
            )
          ) : (
            customerAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customerAppointments.slice(0, 3).map(appt => (
                  <div key={appt.id} style={{ padding: 8, borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)', fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                      <span>{appt.serviceName}</span>
                      <span>{appt.time}</span>
                    </div>
                    <div style={{ color: 'var(--ink-500)', marginTop: 2 }}>{appt.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>No past appointments for this customer.</p>
            )
          )}
        </div>

        {/* Bottom Drawer Button */}
        <div style={{ padding: 16, marginTop: 'auto' }}>
          {isCommerce ? (
            <button
              onClick={() => setShowOrderDrawer(true)}
              className="btn btn-primary"
              style={{ width: '100%', background: 'var(--midnight-ink)', height: 38, gap: 8, justifyContent: 'center' }}
            >
              <ShoppingCart size={15} /> Manual Order Entry
            </button>
          ) : (
            <button
              onClick={() => setShowBookingDrawer(true)}
              className="btn btn-primary"
              style={{ width: '100%', background: 'var(--midnight-ink)', height: 38, gap: 8, justifyContent: 'center' }}
            >
              <Calendar size={15} /> Book Appointment
            </button>
          )}
        </div>
      </div>

      <Drawer isOpen={showOrderDrawer} onClose={() => setShowOrderDrawer(false)} title="Create Order">
        <OrderDrawer customerId={customer.id} onClose={() => setShowOrderDrawer(false)} />
      </Drawer>

      <Drawer isOpen={showBookingDrawer} onClose={() => setShowBookingDrawer(false)} title="Book Appointment">
        <BookingDrawer customerId={customer.id} onClose={() => setShowBookingDrawer(false)} />
      </Drawer>
    </>
  );
}
