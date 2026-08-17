import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { Check } from 'lucide-react';

interface Props {
  customerId: string;
  onClose: () => void;
}

export function BookingDrawer({ customerId, onClose }: Props) {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [serviceId, setServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const customer = state.customers.find(c => c.id === customerId);
  const service = state.services.find(s => s.id === serviceId);
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const times = ['09:30', '11:00', '13:30', '16:00'];
  const canSubmit = serviceId && selectedTime && name && phone;

  const handleSubmit = () => {
    const dateStr = dates[selectedDate].toISOString().split('T')[0];
    const newAppt = { id: `A-${200 + state.appointments.length}`, customerId: customerId || 'c1', serviceId, serviceName: service?.name || '', date: dateStr, time: selectedTime, status: 'Confirmed' as const, duration: service?.duration || 45 };
    dispatch({ type: 'ADD_APPOINTMENT', appointment: newAppt });
    setStep('success');
  };

  if (step === 'success') {
    const lastAppt = state.appointments[state.appointments.length - 1];
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="var(--success)" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>Appointment #{lastAppt?.id} confirmed</h3>
        <div style={{ marginBottom: 24 }}>
          <span style={{ padding: '4px 12px', borderRadius: 4, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Confirmed</span>
        </div>
        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Patient</label>
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={customer?.avatar || state.customers[0]?.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{customer?.name || 'Select patient'}</span>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Service *</label>
        <select className="input" value={serviceId} onChange={e => setServiceId(e.target.value)}>
          <option value="">Select service</option>
          {state.services.map(s => <option key={s.id} value={s.id}>{s.name} — From {s.price.toLocaleString()} EGP</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Date *</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {dates.map((date, i) => (
            <button key={i} onClick={() => setSelectedDate(i)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: selectedDate === i ? accentColor : 'var(--surface-0)', color: selectedDate === i ? 'white' : 'var(--ink-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase' }}>{date.toLocaleDateString('en', { weekday: 'short' })}</div>
              <div>{date.getDate()}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Time *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {times.map(time => (
            <button key={time} onClick={() => setSelectedTime(time)}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: selectedTime === time ? accentColor : 'var(--surface-0)', color: selectedTime === time ? 'white' : 'var(--ink-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{time}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="input" placeholder="Full name *" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Phone number *" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <button onClick={handleSubmit} disabled={!canSubmit} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', background: accentColor }}>Confirm Appointment</button>
    </div>
  );
}
