import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { Appointment } from '../../state/mockData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DayCalendarProps {
  onSelectAppointment?: (appt: Appointment) => void;
}

export function DayCalendar({ onSelectAppointment }: DayCalendarProps) {
  const { state } = useStore();
  const { accentColor } = useVertical();

  // Find initial date from appointments or fallback to today
  const availableDates = Array.from(new Set(state.appointments.map(a => a.date))).sort();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates[0] || new Date().toISOString().split('T')[0];
  });

  const todayAppts = state.appointments
    .filter(a => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const slots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const min = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${min}`;
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-1)', overflow: 'hidden' }}>
      {/* Calendar Top Date Bar */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-0)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarIcon size={16} color={accentColor} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
            {formattedDate}
          </h3>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 12,
            background: todayAppts.length > 0 ? 'var(--mint-signal-subtle)' : 'var(--surface-1)',
            color: todayAppts.length > 0 ? 'var(--mint-signal)' : 'var(--ink-400)',
            fontWeight: 650
          }}>
            {todayAppts.length} {todayAppts.length === 1 ? 'booking' : 'bookings'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              fontSize: 12,
              background: 'var(--surface-1)',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <button
            onClick={handlePrevDay}
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 8px', height: 28 }}
            title="Previous Day"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNextDay}
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 8px', height: 28 }}
            title="Next Day"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Slots List */}
      <div style={{ maxHeight: 520, overflow: 'auto' }}>
        {slots.map(slot => {
          const appt = todayAppts.find(a => a.time === slot);
          const customer = appt ? state.customers.find(c => c.id === appt.customerId) : null;

          return (
            <div key={slot} style={{ display: 'flex', alignItems: 'stretch', minHeight: 48, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 68, padding: '8px 12px', borderRight: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)', textAlign: 'right', flexShrink: 0 }}>
                {slot}
              </div>
              <div style={{ flex: 1, padding: 4, position: 'relative' }}>
                {appt && (
                  <div
                    onClick={() => onSelectAppointment && onSelectAppointment(appt)}
                    style={{
                      position: 'absolute',
                      inset: 2,
                      background: appt.status === 'Cancelled' ? 'rgba(239,68,68,0.08)' : accentColor + '18',
                      borderRadius: 6,
                      borderLeft: `3px solid ${appt.status === 'Cancelled' ? 'var(--danger)' : accentColor}`,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: onSelectAppointment ? 'pointer' : 'default',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (onSelectAppointment) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      if (onSelectAppointment) e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-900)' }}>
                        {appt.serviceName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-600)' }}>
                        {customer?.name || 'Patient'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-500)' }}>
                      <Clock size={12} />
                      <span>{appt.duration || 30}m</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 650,
                        background: appt.status === 'Completed' ? '#0F8357' : appt.status === 'Cancelled' ? 'var(--danger)' : accentColor,
                        color: 'white'
                      }}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
