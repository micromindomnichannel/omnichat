import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Table } from '../components/shared/Table';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Drawer } from '../components/shared/Drawer';
import { DayCalendar } from '../components/appointments/DayCalendar';
import { BookingDrawer } from '../components/appointments/BookingDrawer';
import { AppointmentDetailDrawer } from '../components/appointments/AppointmentDetailDrawer';
import { PageHeader, Card, EmptyState } from '../components/dash/kit';
import { Search, Plus, LayoutGrid, List, CalendarCheck } from 'lucide-react';
import { Appointment } from '../state/mockData';

export function Appointments() {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showNewDrawer, setShowNewDrawer] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const statuses = ['All', 'Confirmed', 'Completed', 'No-show', 'Cancelled'];

  const filtered = state.appointments.filter(a => {
    const matchesSearch = !search ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeAppointment = selectedAppointment
    ? (state.appointments.find(a => a.id === selectedAppointment.id) || selectedAppointment)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        sub="Bookings, confirmations, and reminders in one daily view."
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
            <Plus size={16} /> New Appointment
          </button>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input
              type="text"
              placeholder="Search appointments, services..."
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

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setView('calendar')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: view === 'calendar' ? accentColor : 'transparent',
                color: view === 'calendar' ? 'white' : 'var(--ink-600)',
                cursor: 'pointer'
              }}
              title="Calendar View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: view === 'list' ? accentColor : 'transparent',
                color: view === 'list' ? 'white' : 'var(--ink-600)',
                cursor: 'pointer'
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
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
                  border: `1px solid ${active ? accentColor : 'var(--border)'}`,
                  background: active ? `${accentColor}15` : 'var(--surface-1)',
                  color: active ? accentColor : 'var(--ink-600)',
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

      {view === 'calendar' ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <DayCalendar onSelectAppointment={(appt) => setSelectedAppointment(appt)} />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'patient', label: 'Patient' },
              { key: 'service', label: 'Service' },
              { key: 'datetime', label: 'Date & Time' },
              { key: 'status', label: 'Status' }
            ]}
            data={filtered}
            emptyState={
              <EmptyState
                icon={<CalendarCheck size={24} color="var(--signal-orange)" />}
                title="No appointments found"
                copy={statusFilter === 'All' ? "New bookings appear here the moment customers confirm." : `No appointments matching filter "${statusFilter}".`}
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
                    <Plus size={16} /> New Appointment
                  </button>
                }
              />
            }
            renderRow={(appt) => {
              const customer = state.customers.find(c => c.id === appt.customerId);
              return (
                <tr
                  key={appt.id}
                  onClick={() => setSelectedAppointment(appt)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                    #{appt.id}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                    {customer?.name || 'Patient'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>
                    {appt.serviceName}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                    {appt.date} {appt.time}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={appt.status} size="sm" />
                  </td>
                </tr>
              );
            }}
          />
        </Card>
      )}

      {/* New Appointment Drawer */}
      <Drawer isOpen={showNewDrawer} onClose={() => setShowNewDrawer(false)} title="New Appointment">
        <BookingDrawer customerId="" onClose={() => setShowNewDrawer(false)} />
      </Drawer>

      {/* Appointment Detail & Status Management Drawer */}
      <AppointmentDetailDrawer
        isOpen={Boolean(activeAppointment)}
        appointment={activeAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}
