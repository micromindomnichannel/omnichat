import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import { Eye, EyeOff, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    // Real session auth (httpOnly cookie set by the backend).
    const res = await api.login(email, password);
    setLoading(false);
    if (res?.user) {
      localStorage.setItem('orbit_user', JSON.stringify({
        name: res.user.display_name || res.user.email.split('@')[0],
        email: res.user.email, avatar: '',
      }));
      localStorage.setItem('orbit_authenticated', 'true');
      localStorage.setItem('orbit_memberships', JSON.stringify(res.memberships || []));
      navigate('/overview');
    } else {
      setError(res?.error || 'Sign in failed — is the backend reachable?');
    }
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
          top: '30%',
          left: '40%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(255, 90, 54, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          <OrbitLogo variant="primary" colorMode="dark" size={56} />

          <h1 style={{
            fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.03em',
            marginTop: 32, marginBottom: 16, lineHeight: 1.15
          }}>
            Many Signals.<br />
            <span style={{ color: 'var(--signal-orange)' }}>One Intelligent Flow.</span>
          </h1>

          <p style={{ fontSize: 15, color: '#A8A29E', lineHeight: 1.7, marginBottom: 40 }}>
            ORBIT converges customer chats from Instagram, WhatsApp, Facebook & TikTok into one intelligent AI engine — turning incoming signals into sales, bookings, and support tickets instantly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {['24/7 AI-powered omnichannel inbox', 'Live PostgreSQL database sync', 'Dual Commerce & Appointment modes'].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(255, 90, 54, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Sparkles size={14} color="var(--signal-orange)" />
                </div>
                <span style={{ fontSize: 13.5, color: '#D6D3D1', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="show-below-768" style={{ marginBottom: 32, textAlign: 'center' }}>
            <OrbitLogo variant="horizontal" size={32} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--stone-gray)', marginTop: 6 }}>
              Sign in to your ORBIT dashboard to manage your business.
            </p>
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                <input
                  className="input"
                  type="email"
                  placeholder="admin@orbit-platform.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40, height: 46 }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotOpen(true); setForgotMsg(''); setForgotEmail(email); }}
                  style={{ fontSize: 12, color: 'var(--signal-orange)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 44, height: 46 }}
                  required
                  autoComplete="current-password"
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
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%', height: 48, fontSize: 15, background: 'var(--signal-orange)',
                boxShadow: '0 4px 14px rgba(255, 90, 54, 0.25)',
                opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                  Signing in...
                </span>
              ) : (
                <>Sign In to ORBIT <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 13.5, color: 'var(--stone-gray)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--signal-orange)', fontWeight: 700, textDecoration: 'none' }}>
                Create your free account
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

      {forgotOpen && (
        <div
          onClick={() => setForgotOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 380 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Reset password</h3>
            <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginBottom: 16 }}>
              Enter your account email. If it exists, a reset link will be sent (or ask your workspace owner).
            </p>
            <input
              className="input" type="email" placeholder="you@business.com"
              value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              style={{ height: 44, marginBottom: 12 }}
            />
            {forgotMsg && <p style={{ fontSize: 13, color: 'var(--midnight-ink)', marginBottom: 12 }}>{forgotMsg}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setForgotOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button
                disabled={forgotBusy}
                onClick={async () => {
                  setForgotBusy(true);
                  const res = await api.forgotPassword(forgotEmail.trim());
                  setForgotBusy(false);
                  setForgotMsg(res
                    ? (res.debugToken
                      ? `Dev mode — your reset token (paste after /reset?token=): ${res.debugToken}`
                      : 'If the email exists, a reset link was sent. It expires in 1 hour.')
                    : 'Backend unreachable — ask your workspace owner to reset it.');
                }}
                className="btn btn-primary" style={{ flex: 1, background: 'var(--signal-orange)' }}
              >
                {forgotBusy ? 'Sending…' : 'Send link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
