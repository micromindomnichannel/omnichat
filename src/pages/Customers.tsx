import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { ChannelIcon } from '../components/shared/ChannelIcon';
import { Drawer } from '../components/shared/Drawer';
import { PageHeader, Card, EmptyState } from '../components/dash/kit';
import { Search, Users, MessageSquare, Plus, X, ShoppingBag, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Customer } from '../state/mockData';

export function Customers() {
  const { state, dispatch, showToast } = useStore();
  const { isCommerce, accentColor } = useVertical();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(params.get('id'));
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const id = params.get('id');
    if (id) setSelectedCustomerId(id);
  }, [params]);

  const filtered = state.customers.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesFilter = filter === 'All' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
  const customerOrders = state.orders.filter(o => o.customerId === selectedCustomerId);
  const customerAppointments = state.appointments.filter(a => a.customerId === selectedCustomerId);

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setParams({ id: customer.id });
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    setParams({});
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !selectedCustomer) return;
    const updated: Customer = {
      ...selectedCustomer,
      tags: [...(selectedCustomer.tags || []), newTagInput.trim()]
    };
    dispatch({ type: 'UPDATE_CUSTOMER', customer: updated });
    setNewTagInput('');
    showToast(`Tag added to ${selectedCustomer.name}`, 'success');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedCustomer) return;
    const updated: Customer = {
      ...selectedCustomer,
      tags: (selectedCustomer.tags || []).filter(t => t !== tagToRemove)
    };
    dispatch({ type: 'UPDATE_CUSTOMER', customer: updated });
    showToast(`Tag removed`, 'warning');
  };

  const handleOpenConversation = () => {
    if (!selectedCustomer) return;
    const conv = state.conversations.find(c => c.customerId === selectedCustomer.id);
    if (conv) {
      navigate(`/inbox`);
    } else {
      navigate('/inbox');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        sub="Every conversation, order, and appointment tied to one customer record."
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'New', 'Returning', 'VIP'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filter === f ? 'var(--brand)' : 'transparent',
                  color: filter === f ? 'white' : 'var(--ink-600)'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          columns={[
            { key: 'name', label: 'Customer' },
            { key: 'channels', label: 'Channels' },
            { key: 'status', label: 'Status' },
            { key: 'lastInteraction', label: 'Customer Since' },
            { key: 'count', label: isCommerce ? 'Orders' : 'Appointments' },
            { key: 'total', label: 'Total Value' },
            { key: 'tags', label: 'Tags' }
          ]}
          data={filtered}
          emptyState={
            <EmptyState
              icon={<Users size={24} color="var(--signal-orange)" />}
              title="No customers yet"
              copy="Customers appear here as soon as they message you or place their first order."
            />
          }
          renderRow={(customer) => (
            <tr
              key={customer.id}
              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s ease' }}
              onClick={() => handleOpenCustomer(customer)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={customer.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 650, color: 'var(--ink-900)' }}>{customer.name}</p>
                    <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)' }}>{customer.phone}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {customer.channels.map((ch: any) => <ChannelIcon key={ch} channel={ch} size={14} />)}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}><StatusBadge status={customer.status} size="sm" /></td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-600)' }}>{customer.customerSince}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {isCommerce ? customer.totalOrders : customer.totalAppointments}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {customer.totalSpent.toLocaleString()} EGP
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {customer.tags.map((tag: string) => (
                    <span key={tag} style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 10, fontWeight: 600, color: 'var(--ink-600)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          )}
        />
      </Card>

      {/* Customer Detail Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={handleCloseDrawer}
        title={selectedCustomer?.name || 'Customer Details'}
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <img src={selectedCustomer.avatar} alt={selectedCustomer.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--midnight-ink)', margin: 0 }}>{selectedCustomer.name}</h3>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--stone-gray)', margin: '2px 0 6px' }}>{selectedCustomer.phone}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={selectedCustomer.status} size="sm" />
                  <span style={{ fontSize: 11, color: 'var(--stone-gray)' }}>Joined: {selectedCustomer.customerSince}</span>
                </div>
              </div>
            </div>

            {/* Quick action: Message in Inbox */}
            <button
              onClick={handleOpenConversation}
              className="btn btn-primary"
              style={{ width: '100%', background: 'var(--signal-orange)', gap: 8 }}
            >
              <MessageSquare size={16} /> Open Customer Inbox Thread
            </button>

            {/* Reliability Card */}
            {selectedCustomer.reliability && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block', marginBottom: 10 }}>
                  Reliability Score: <span style={{ color: selectedCustomer.reliability.status === 'Good' ? '#0F8357' : 'var(--signal-orange)' }}>{selectedCustomer.reliability.status}</span>
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{selectedCustomer.reliability.completed}</span>
                    <span style={{ fontSize: 10, color: 'var(--stone-gray)', display: 'block' }}>Done</span>
                  </div>
                  <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{selectedCustomer.reliability.cancellations}</span>
                    <span style={{ fontSize: 10, color: 'var(--stone-gray)', display: 'block' }}>Cancelled</span>
                  </div>
                  <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{selectedCustomer.reliability.returns}</span>
                    <span style={{ fontSize: 10, color: 'var(--stone-gray)', display: 'block' }}>Returns</span>
                  </div>
                  <div style={{ padding: 8, background: 'white', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{selectedCustomer.reliability.noShows}</span>
                    <span style={{ fontSize: 10, color: 'var(--stone-gray)', display: 'block' }}>No-shows</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tags Section */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 8, display: 'block' }}>
                Customer Tags
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {selectedCustomer.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                      borderRadius: 4, background: 'var(--signal-orange-subtle)', color: 'var(--signal-orange)',
                      fontSize: 11, fontWeight: 650
                    }}
                  >
                    {t}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="input"
                  placeholder="Add custom tag (e.g. High Value)..."
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  style={{ height: 34, fontSize: 12 }}
                />
                <button onClick={handleAddTag} className="btn btn-outline btn-sm">Add</button>
              </div>
            </div>

            {/* History: Orders or Appointments */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 8, display: 'block' }}>
                {isCommerce ? `Order History (${customerOrders.length})` : `Appointment History (${customerAppointments.length})`}
              </label>
              {isCommerce ? (
                customerOrders.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No orders on record for this customer.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customerOrders.map(o => (
                      <div key={o.id} style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)' }}>#{o.id} · {o.productName}</span>
                          <span style={{ fontSize: 11, color: 'var(--stone-gray)', display: 'block' }}>{o.date} · {o.paymentMethod}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{o.total.toLocaleString()} EGP</span>
                          <StatusBadge status={o.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                customerAppointments.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No appointments booked for this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customerAppointments.map(a => (
                      <div key={a.id} style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)' }}>#{a.id} · {a.serviceName}</span>
                          <span style={{ fontSize: 11, color: 'var(--stone-gray)', display: 'block' }}>{a.date} at {a.time}</span>
                        </div>
                        <StatusBadge status={a.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
