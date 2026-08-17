import React from 'react';
import { useVertical } from '../../state/verticalContext';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, ArrowRight, ShoppingCart, Stethoscope } from 'lucide-react';

interface VerticalSelectProps {
  onSelect?: (vertical: 'commerce' | 'appointments') => void;
}

export function VerticalSelect({ onSelect }: VerticalSelectProps) {
  const { setVertical } = useVertical();
  const navigate = useNavigate();

  const handleSelect = (vertical: 'commerce' | 'appointments') => {
    setVertical(vertical);
    if (onSelect) {
      onSelect(vertical);
    } else {
      navigate('/onboarding');
    }
  };

  const handleSkip = () => {
    navigate('/overview');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--surface-0)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          Choose your SELLER solution
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          One platform. Two ways to turn conversations into revenue.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 900
      }}>
        {/* Commerce Card */}
        <div className="card" style={{
          width: 420,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{
            width: 96, height: 96, borderRadius: 16,
            background: 'rgba(47, 92, 255, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Package size={32} color="#2F5CFF" />
              <ShoppingCart size={24} color="#2F5CFF" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 4 }}>Commerce</h3>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
              Turn conversations into orders.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>
              Perfect for retail, fashion, electronics, and e-commerce businesses.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Comment', 'DM', 'Order'].map((step, i) => (
              <React.Fragment key={step}>
                <div style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: 'var(--surface-0)', fontSize: 12, fontWeight: 600,
                  color: 'var(--ink-600)'
                }}>
                  {step}
                </div>
                {i < 2 && <ArrowRight size={14} color="var(--ink-400)" />}
              </React.Fragment>
            ))}
          </div>
          <button
            onClick={() => handleSelect('commerce')}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'auto', background: '#2F5CFF' }}
          >
            Use Commerce
          </button>
        </div>

        {/* Appointments Card */}
        <div className="card" style={{
          width: 420,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{
            width: 96, height: 96, borderRadius: 16,
            background: 'rgba(15, 157, 119, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Calendar size={32} color="#0F9D77" />
              <Stethoscope size={24} color="#0F9D77" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 4 }}>Appointments</h3>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 8 }}>
              Turn conversations into confirmed bookings.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>
              Ideal for clinics, salons, spas, and service-based businesses.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Comment', 'DM', 'Booking'].map((step, i) => (
              <React.Fragment key={step}>
                <div style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: 'var(--surface-0)', fontSize: 12, fontWeight: 600,
                  color: 'var(--ink-600)'
                }}>
                  {step}
                </div>
                {i < 2 && <ArrowRight size={14} color="var(--ink-400)" />}
              </React.Fragment>
            ))}
          </div>
          <button
            onClick={() => handleSelect('appointments')}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'auto', background: '#0F9D77' }}
          >
            Use Appointments
          </button>
        </div>
      </div>

      <button
        onClick={handleSkip}
        style={{
          marginTop: 32,
          background: 'none',
          border: 'none',
          color: 'var(--ink-400)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Skip, I've done this before
      </button>
    </div>
  );
}
