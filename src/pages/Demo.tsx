import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVertical } from '../state/verticalContext';
import { useStore } from '../state/store';
import { ArrowLeft, ArrowRight, X, MessageSquare, Bot, ShoppingCart, Calendar, CheckCircle } from 'lucide-react';

export function Demo() {
  const { vertical, isCommerce, accentColor } = useVertical();
  const { state } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const commerceSteps = [
    { title: 'Customer reaches out', desc: 'A customer comments on your Instagram post about a product.', target: 'inbox' },
    { title: 'AI responds automatically', desc: 'The AI detects a purchase question and replies with product details.', target: 'inbox' },
    { title: 'Stock check', desc: 'AI checks inventory and confirms availability in real-time.', target: 'inbox' },
    { title: 'Order creation', desc: 'Customer confirms intent and AI collects order details.', target: 'orders' },
    { title: 'Confirmation', desc: 'Order is created and ready for fulfillment.', target: 'orders' },
    { title: 'Logistics handoff', desc: 'Send order to logistics with one click.', target: 'orders' }
  ];

  const appointmentSteps = [
    { title: 'Inquiry received', desc: 'A patient asks about a service via WhatsApp.', target: 'inbox' },
    { title: 'AI answers', desc: 'AI provides service details and pricing automatically.', target: 'inbox' },
    { title: 'Availability check', desc: 'AI checks the calendar for open slots.', target: 'inbox' },
    { title: 'Time selection', desc: 'Patient picks a convenient time slot.', target: 'appointments' },
    { title: 'Booking confirmed', desc: 'Appointment is booked and added to the schedule.', target: 'appointments' },
    { title: 'Follow-up ready', desc: 'Automated reminder is queued for the patient.', target: 'appointments' }
  ];

  const steps = isCommerce ? commerceSteps : appointmentSteps;
  const currentStep = steps[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: 'var(--surface-1)', borderRadius: 14, maxWidth: 560, width: '100%',
        padding: 32, position: 'relative'
      }}>
        <button
          onClick={() => navigate('/overview')}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} color="var(--ink-400)" />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: accentColor + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            {isCommerce ? <ShoppingCart size={24} color={accentColor} /> : <Calendar size={24} color={accentColor} />}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
            See SELLER in action
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i <= step ? accentColor : 'var(--border)'
            }} />
          ))}
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24, border: '2px solid ' + accentColor }}>
          <h3 style={{ fontSize: 16, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
            {currentStep.title}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.6 }}>
            {currentStep.desc}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="btn btn-outline"
            style={{ opacity: step === 0 ? 0.5 : 1 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            {step === steps.length - 1 ? (
              <button
                onClick={() => navigate(`/${currentStep.target}`)}
                className="btn btn-primary"
                style={{ background: accentColor }}
              >
                Try it yourself <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="btn btn-primary"
                style={{ background: accentColor }}
              >
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
