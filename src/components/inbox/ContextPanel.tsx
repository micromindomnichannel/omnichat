import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ChannelIcon } from '../../components/shared/ChannelIcon';
import { Drawer } from '../../components/shared/Drawer';
import { OrderDrawer } from '../../components/commerce/OrderDrawer';
import { BookingDrawer } from '../../components/appointments/BookingDrawer';
import { Tag, X, Plus, ShoppingCart, Calendar, Check } from 'lucide-react';

interface Props {
  conversationId: string;
}

export function ContextPanel({ conversationId }: Props) {
  const { state, dispatch } = useStore();
  const { isCommerce, accentColor } = useVertical();
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const conversation = state.conversations.find(c => c.id === conversationId);
  const customer = state.customers.find(c => c.id === conversation?.customerId);

  if (!conversation || !customer) return null;

  const customerOrders = state.orders.filter(o => o.customerId === customer.id);
  const customerAppointments = state.appointments.filter(a => a.customerId === customer.id);
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
  const cancelledOrders = customerOrders.filter(o => o.status === 'Cancelled').length;
  const upcomingAppointments = customerAppointments.filter(a => a.status === 'Confirmed').length;
  const noShows = customerAppointments.filter(a => a.status === 'No-show').length;

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

  const showCreateOrder = isCommerce && conversation.aiContext.intent === 'High purchase intent';
  const showCreateBooking = !isCommerce && conversation.aiContext.intent === 'Booking intent';

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

          <p style={{ fontSize: 12, color: 'var(--ink-400)', textAlign: 'center', marginBottom: 12 }}>
            Customer since {customer.customerSince}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
            {customer.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 4, background: accentColor + '14',
                color: accentColor, fontSize: 11, fontWeight: 600
              }}>
                {tag}
                <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
            {showTagInput ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  autoFocus
                  style={{
                    width: 80, height: 24, padding: '0 6px', borderRadius: 4,
                    border: '1px solid var(--border)', fontSize: 11, outline: 'none'
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)',
                  color: 'var(--ink-400)', fontSize: 11, fontWeight: 600,
                  border: '1px dashed var(--border)', cursor: 'pointer'
                }}
              >
                <Plus size={10} /> Add
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <StatusBadge status={customer.status} />
          </div>
        </div>

        {/* Vertical History */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isCommerce ? 'Order History' : 'Appointment History'}
          </h4>

          {isCommerce ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customerOrders.slice(-3).map(order => (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
                        #{order.id}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-400)' }}>{order.date}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {order.total.toLocaleString()} EGP
                      </p>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 12, fontWeight: 500 }}>
                Total spent: {totalSpent.toLocaleString()} EGP · {cancelledOrders} cancelled
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customerAppointments.slice(-3).map(appt => (
                  <div key={appt.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)' }}>{appt.serviceName}</p>
                      <p style={{ fontSize: 11, color: 'var(--ink-400)' }}>{appt.date} at {appt.time}</p>
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 12, fontWeight: 500 }}>
                {upcomingAppointments} upcoming · {noShows} no-shows
              </p>
            </>
          )}
        </div>

        {/* AI Context */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Context
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Intent</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{conversation.aiContext.intent}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>Stage</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{conversation.aiContext.stage}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>AI Status</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{conversation.aiContext.aiStatus}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4 }}>Tools Used</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conversation.aiContext.toolsUsed.map(tool => (
                  <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={12} color="var(--success)" />
                    <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{tool}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reliability / Attendance */}
        <div style={{ padding: 20 }}>
          <div style={{
            background: 'var(--surface-0)', borderRadius: 8, padding: 16,
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ fontSize: 11, fontWeight: 650, color: 'var(--ink-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isCommerce ? 'Reliability' : 'Attendance'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <StatusBadge status={customer.reliability.status} size="sm" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} color="var(--success)" />
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>
                  {customer.reliability.completed} completed {isCommerce ? 'orders' : 'appointments'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={14} color="var(--danger)" />
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>
                  {customer.reliability.cancellations} cancellations
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={14} color="var(--danger)" />
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>
                  {isCommerce ? `${customer.reliability.returns} returns` : `${customer.reliability.noShows} no-shows`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Order/Booking Button */}
        {(showCreateOrder || showCreateBooking) && (
          <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => showCreateOrder ? setShowOrderDrawer(true) : setShowBookingDrawer(true)}
              className="btn btn-primary"
              style={{ width: '100%', background: accentColor }}
            >
              {showCreateOrder ? <><ShoppingCart size={16} /> Create Order</> : <><Calendar size={16} /> Book Appointment</>}
            </button>
          </div>
        )}
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
