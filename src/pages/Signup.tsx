import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone, Building2, Sparkles, CheckCircle2
} from 'lucide-react';

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<'commerce' | 'appointments'>('commerce');
  const [country, setCountry] = useState('Egypt');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      setError('Please enter your business name.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulated signup (dummy auth)
    setTimeout(() => {
      setLoading(false);
      const userData = {
        name: fullName,
        email,
        phone,
        businessName,
        industry,
        country,
        avatar: ''
      };
      localStorage.setItem('orbit_user', JSON.stringify(userData));
      localStorage.setItem('orbit_authenticated', 'true');
      navigate('/onboarding');
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--cloud-white)'
    }}>
      {/* Left Branding Panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, var(--midnight-ink) 0%, #1A1A1A 60%, #2A2A2A 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden'
      }}
        className="hide-below-768"
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(255, 90, 54, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          <OrbitLogo variant="primary" colorMode="dark" size={56} />

          <h1 style={{
            fontSize: 34, fontWeight: 800, color: 'white', letterSpacing: '-0.03em',
            marginTop: 32, marginBottom: 16, lineHeight: 1.15
          }}>
            Start Your <span style={{ color: 'var(--signal-orange)' }}>ORBIT</span> Journey
          </h1>

          <p style={{ fontSize: 15, color: '#A8A29E', lineHeight: 1.7, marginBottom: 40 }}>
            Set up your AI-powered omnichannel business platform in under 3 minutes. No credit card required.
          </p>

          {/* Steps indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' }}>
            {[
              { label: 'Create your account', done: step >= 2 },
              { label: 'Set up your business profile', done: false },
              { label: 'Connect your channels & launch', done: false }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: item.done ? 'var(--signal-orange)' : 'rgba(255,255,255,0.08)',
                  border: item.done ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {item.done ? (
                    <CheckCircle2 size={16} color="white" />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#A8A29E' }}>{idx + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: 14, color: item.done ? 'white' : '#A8A29E', fontWeight: item.done ? 700 : 500 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Signup Form Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div className="show-below-768" style={{ marginBottom: 32, textAlign: 'center' }}>
            <OrbitLogo variant="horizontal" size={32} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              {step === 1 ? 'Create your account' : 'Set up your business'}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--stone-gray)', marginTop: 6 }}>
              {step === 1 ? 'Enter your personal details to get started.' : 'Tell us about your business so ORBIT can adapt.'}
            </p>
          </div>

          {/* Step indicator pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: 'var(--signal-orange)'
            }} />
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step === 2 ? 'var(--signal-orange)' : 'var(--border)'
            }} />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, background: 'var(--danger-bg)',
              color: 'var(--danger)', fontSize: 13, fontWeight: 600, marginBottom: 16,
              border: '1px solid var(--danger)'
            }}>
              {error}
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    placeholder="Ahmed Hassan"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ paddingLeft: 40, height: 46 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    type="email"
                    placeholder="ahmed@mybusiness.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: 40, height: 46 }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Phone Number (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    type="tel"
                    placeholder="+20 10X XXX XXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ paddingLeft: 40, height: 46 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Password * (min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: 40, paddingRight: 44, height: 46 }}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-gray)', padding: 4
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', height: 48, fontSize: 15, background: 'var(--signal-orange)', marginTop: 8 }}
              >
                Continue <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: Business Info */}
          {step === 2 && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Business Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    placeholder="e.g. Luxe Fashion Egypt"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    style={{ paddingLeft: 40, height: 46 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Business Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIndustry('commerce')}
                    style={{
                      padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${industry === 'commerce' ? 'var(--signal-orange)' : 'var(--border)'}`,
                      background: industry === 'commerce' ? 'var(--signal-orange-subtle)' : 'white',
                      textAlign: 'center', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🛍️</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>E-Commerce & Retail</div>
                    <div style={{ fontSize: 11, color: 'var(--stone-gray)', marginTop: 2 }}>Products, orders, shipping</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndustry('appointments')}
                    style={{
                      padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${industry === 'appointments' ? 'var(--signal-orange)' : 'var(--border)'}`,
                      background: industry === 'appointments' ? 'var(--signal-orange-subtle)' : 'white',
                      textAlign: 'center', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🏥</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>Clinics & Appointments</div>
                    <div style={{ fontSize: 11, color: 'var(--stone-gray)', marginTop: 2 }}>Bookings, patients, agenda</div>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Country / Region
                </label>
                <select
                  className="input"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  style={{ height: 46 }}
                >
                  <option>Egypt</option>
                  <option>Saudi Arabia</option>
                  <option>UAE</option>
                  <option>Kuwait</option>
                  <option>Jordan</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="btn btn-outline"
                  style={{ flex: 1, height: 48, fontSize: 14 }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{
                    flex: 2, height: 48, fontSize: 15, background: 'var(--signal-orange)',
                    boxShadow: '0 4px 14px rgba(255, 90, 54, 0.25)',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                      Creating account...
                    </span>
                  ) : (
                    <>Create Account & Start <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 13.5, color: 'var(--stone-gray)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--signal-orange)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
          </div>

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: 12, color: 'var(--stone-gray)', textDecoration: 'none' }}>
              ← Back to ORBIT Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
