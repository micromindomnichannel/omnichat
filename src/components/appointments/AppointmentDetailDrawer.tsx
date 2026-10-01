import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { Appointment } from '../../state/mockData';
import { Drawer } from '../shared/Drawer';
import { StatusBadge } from '../shared/StatusBadge';
import { MessageSquare, Calendar, Clock, CheckCircle2, User, Send, XCircle } from 'lucide-react';

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentDetailDrawer({ appointment, isOpen, onClose }: AppointmentDetailDrawerProps) {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState<Appointment['status']>('Confirmed');

  useEffect(() => {
    if (appointment) {
      setCurrentStatus(appointment.status);
    }
  }, [appointment]);

  if (!appointment) return null;

  const customer = state.customers.find(c => c.id === appointment.customerId);
  const service = state.services.find(s => s.id === appointment.serviceId || s.name === appointment.serviceName);

  const statuses: Appointment['status'][] = ['Confirmed', 'Completed', 'No-show', 'Cancelled'];

  const handleUpdateStatus = (newStatus: Appointment['status']) => {
    setCurrentStatus(newStatus);
    const updatedAppt: Appointment = {
      ...appointment,
      status: newStatus
    };
    dispatch({ type: 'UPDATE_APPOINTMENT', appointment: updatedAppt });
    showToast(`Appointment status updated to ${newStatus}`, 'success');
  };

  const handleSendReminder = () => {
    showToast(`WhatsApp confirmation reminder sent to ${customer?.name || 'patient'}!`, 'success');
  };

  const handleOpenInbox = () => {
    onClose();
    navigate('/inbox');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Appointment #${appointment.id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--surface-0)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={currentStatus} size="md" />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 4, color: 'var(--ink-900)' }}>
              {appointment.duration || service?.duration || 30} mins
            </div>
          </div>
        </div>

        {/* Status Change Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8, display: 'block' }}>
            Update Appointment Status
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {statuses.map(st => {
              const active = currentStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${active ? accentColor : 'var(--border)'}`,
                    background: active ? accentColor : 'var(--surface-0)',
                    color: active ? '#fff' : 'var(--ink-600)',
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

        {/* Patient / Customer Details */}
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-400)' }}>
              Patient Information
            </span>
            <button
              onClick={handleOpenInbox}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px', fontSize: 11, gap: 4 }}
            >
              <MessageSquare size={12} /> Chat in Inbox
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={customer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={customer?.name || 'Patient'}
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>
                {customer?.name || 'Patient'}
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-500)' }}>
                {customer?.phone || 'No phone recorded'}
              </div>
            </div>
          </div>
        </div>

        {/* Service & Time Schedule Card */}
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-400)', display: 'block', marginBottom: 12 }}>
            Service & Slot Details
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                {appointment.serviceName}
              </div>
              {service?.category && (
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                  Category: {service.category}
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: 12,
              background: 'var(--surface-1)',
              borderRadius: 6,
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color={accentColor} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontSize: 12, fontWeight: 650 }}>{appointment.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={accentColor} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Time Slot</div>
                  <div style={{ fontSize: 12, fontWeight: 650, fontFamily: 'var(--font-mono)' }}>{appointment.time}</div>
                </div>
              </div>
            </div>

            {service?.price && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>Service Fee</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--midnight-ink)' }}>
                  {service.price.toLocaleString()} EGP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSendReminder}
            className="btn btn-outline"
            style={{ width: '100%', height: 38, gap: 8, justifyContent: 'center', fontWeight: 600 }}
          >
            <Send size={14} color="var(--mint-signal)" /> Send WhatsApp Reminder
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => handleUpdateStatus('Completed')}
              className="btn btn-primary"
              style={{ height: 38, background: '#0F8357', gap: 6, justifyContent: 'center', fontWeight: 600 }}
            >
              <CheckCircle2 size={14} /> Mark Completed
            </button>
            <button
              onClick={() => handleUpdateStatus('Cancelled')}
              className="btn btn-outline"
              style={{ height: 38, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', gap: 6, justifyContent: 'center', fontWeight: 600 }}
            >
              <XCircle size={14} /> Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
