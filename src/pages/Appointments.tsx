import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Drawer } from '../components/shared/Drawer';
import { DayCalendar } from '../components/appointments/DayCalendar';
import { BookingDrawer } from '../components/appointments/BookingDrawer';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';

export function Appointments() {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const filtered = state.appointments.filter(a => !search || a.id.includes(search) || a.serviceName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input type="text" placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setView('calendar')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'calendar' ? accentColor : 'transparent', color: view === 'calendar' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('list')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'list' ? accentColor : 'transparent', color: view === 'list' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><List size={16} /></button>
          </div>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn btn-primary" style={{ background: accentColor }}><Plus size={16} /> New Appointment</button>
      </div>
      {view === 'calendar' ? <DayCalendar /> : (
        <div className="card">
          <Table columns={[{ key: 'id', label: 'ID' }, { key: 'patient', label: 'Patient' }, { key: 'service', label: 'Service' }, { key: 'datetime', label: 'Date & Time' }, { key: 'status', label: 'Status' }]}
            data={filtered}
            renderRow={(appt) => {
              const customer = state.customers.find(c => c.id === appt.customerId);
              return (
                <tr key={appt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{appt.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{customer?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{appt.serviceName}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{appt.date} {appt.time}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={appt.status} size="sm" /></td>
                </tr>
              );
            }} />
        </div>
      )}
      <Drawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} title="New Appointment">
        <BookingDrawer customerId="" onClose={() => setShowDrawer(false)} />
      </Drawer>
    </div>
  );
}
