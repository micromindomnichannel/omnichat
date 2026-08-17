import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { ChannelIcon } from '../components/shared/ChannelIcon';
import { Search } from 'lucide-react';

export function Customers() {
  const { state } = useStore();
  const { isCommerce } = useVertical();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = state.customers.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesFilter = filter === 'All' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'New', 'Returning', 'VIP'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === f ? 'var(--brand)' : 'transparent', color: filter === f ? 'white' : 'var(--ink-600)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <Table columns={[{ key: 'name', label: 'Customer' }, { key: 'channels', label: 'Channels' }, { key: 'status', label: 'Status' }, { key: 'lastInteraction', label: 'Last Interaction' }, { key: 'count', label: isCommerce ? 'Orders' : 'Appointments' }, { key: 'total', label: 'Total Value' }, { key: 'tags', label: 'Tags' }]}
          data={filtered}
          renderRow={(customer) => (
            <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/customers?id=${customer.id}`)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={customer.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{customer.name}</p>
                    <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)' }}>{customer.phone}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4 }}>{customer.channels.map((ch: any) => <ChannelIcon key={ch} channel={ch} size={14} />)}</div>
              </td>
              <td style={{ padding: '12px 16px' }}><StatusBadge status={customer.status} size="sm" /></td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-600)' }}>{customer.customerSince}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{isCommerce ? customer.totalOrders : customer.totalAppointments}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{customer.totalSpent.toLocaleString()} EGP</td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {customer.tags.map((tag: string) => <span key={tag} style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 10, fontWeight: 600, color: 'var(--ink-600)' }}>{tag}</span>)}
                </div>
              </td>
            </tr>
          )} />
      </div>
    </div>
  );
}
