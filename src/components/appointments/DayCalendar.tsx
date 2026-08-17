import React from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';

export function DayCalendar() {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const todayAppts = state.appointments.filter(a => a.date === '2024-08-17').sort((a, b) => a.time.localeCompare(b.time));
  const slots = Array.from({ length: 25 }, (_, i) => { const hour = Math.floor(i / 2) + 8; const min = i % 2 === 0 ? '00' : '30'; return `${hour.toString().padStart(2, '0')}:${min}`; });

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-1)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>August 17, 2024</h3>
      </div>
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {slots.map(slot => {
          const appt = todayAppts.find(a => a.time === slot);
          return (
            <div key={slot} style={{ display: 'flex', alignItems: 'stretch', minHeight: 48, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 60, padding: '8px 12px', borderRight: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)', textAlign: 'right', flexShrink: 0 }}>{slot}</div>
              <div style={{ flex: 1, padding: 4, position: 'relative' }}>
                {appt && (
                  <div style={{ position: 'absolute', inset: 2, background: accentColor + '18', borderRadius: 6, borderLeft: '3px solid ' + accentColor, padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)' }}>{appt.serviceName}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-600)' }}>{state.customers.find(c => c.id === appt.customerId)?.name}</span>
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
