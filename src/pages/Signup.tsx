import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone, Building2, Sparkles, CheckCircle2, Upload
} from 'lucide-react';
import { api } from '../services/api';

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Email OTP
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState('');

  // Step 3: Business (single merged profile form — the ONLY place business
  // data is collected; onboarding no longer asks it again)
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<'commerce' | 'appointments'>('commerce');
  const [country, setCountry] = useState('Egypt');
  const [logo, setLogo] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [sector, setSector] = useState('Retail & E-Commerce');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const apiError = (res: any, fallback: string) =>
    res?._timeout
      ? 'Server is waking up (cold start takes ~30s on the free tier). Wait a moment and try again.'
      : res?._network
        ? `Cannot reach the backend (${res.message || 'network error'}). Is the backend URL reachable? Try opening the API health page directly.`
        : (res?.error || fallback);

  const sendCode = async (isResend = false) => {
    setLoading(true);
    setError('');
    const res = await api.signupRequestCode(email, password, fullName);
    setLoading(false);
    if (res?.success) {
      setCodeSent(true);
      setDevCode(res.debugCode || '');
      setResendIn(30);
      if (!isResend) setStep(2);
    } else {
      setError(apiError(res, 'Could not send verification code.'));
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    await sendCode(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError('');
    // Account is created server-side on successful verification (first-ever
    // user becomes workspace owner; afterwards registration is closed).
    const res = await api.signupVerify(email, otp.trim());
    setLoading(false);
    if (res?.user) {
      const userData = {
        name: fullName, email, businessName, industry, country, avatar: ''
      };
      localStorage.setItem('orbit_user', JSON.stringify(userData));
      localStorage.setItem('orbit_authenticated', 'true');
      localStorage.setItem('orbit_memberships', JSON.stringify(res.memberships || []));
      setStep(3);
    } else {
      setError(apiError(res, 'Verification failed.'));
    }
  };

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Logo must be an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be smaller than 5MB.');
      return;
    }
    setLogoBusy(true);
    setError('');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const saved = await api.uploadImage(dataUrl);
      setLogo(saved?.url || dataUrl);
    } catch {
      setError('Could not read the logo file.');
    } finally {
      setLogoBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    // Account already exists (created at OTP verification). This merged form
    // is the single writer of the business profile: one PUT (idempotent
    // COALESCE merge, single row) so data can never duplicate. Best-effort —
    // onboarding Finish re-syncs the same payload if offline now.
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Please enter your business name.');
      return;
    }
    setError('');
    setSaving(true);
    const profile = {
      business_name: businessName.trim(),
      industry: sector,
      description: description.trim() || undefined,
      logo_url: logo || undefined,
      country,
    };
    try {
      await api.updateSettings(profile);
    } catch {
      // Offline: Finish step re-syncs. Never block onboarding on network.
    }
    const userData = {
      name: fullName, email, phone, businessName: profile.business_name,
      industry, industrySector: sector, description: profile.description,
      logo, country, avatar: logo,
    };
    localStorage.setItem('orbit_user', JSON.stringify(userData));
    setSaving(false);
    window.location.assign('/onboarding');
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
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E40AF 100%)',
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
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
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
              { label: 'Verify your email', done: step >= 3 },
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
              {step === 1 ? 'Create your account' : step === 2 ? 'Verify your email' : 'Set up your business'}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--stone-gray)', marginTop: 6 }}>
              {step === 1
                ? 'Enter your personal details to get started.'
                : step === 2
                  ? `We sent a 6-digit code to ${email || 'your email'}. It expires in 10 minutes.`
                  : 'Tell us about your business so ORBIT can adapt.'}
            </p>
          </div>

          {/* Step indicator pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= s ? 'var(--signal-orange)' : 'var(--border)'
              }} />
            ))}
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
                  Password * (min 10 characters)
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

          {/* STEP 2: Email OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  6-Digit Verification Code *
                </label>
                <input
                  className="input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ height: 52, fontSize: 22, letterSpacing: 8, textAlign: 'center', fontWeight: 800 }}
                  required
                />
              </div>

              {devCode && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8, background: 'var(--surface-0)',
                  border: '1px dashed var(--stone-gray)', fontSize: 12.5, color: 'var(--ink-600)'
                }}>
                  Dev mode — no email configured. Your code is: <strong style={{ letterSpacing: 2 }}>{devCode}</strong>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%', height: 48, fontSize: 15, background: 'var(--signal-orange)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                    Verifying...
                  </span>
                ) : (
                  <>Verify & Create Account <ArrowRight size={18} /></>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--stone-gray)', fontWeight: 600 }}
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  disabled={loading || resendIn > 0}
                  onClick={() => sendCode(true)}
                  style={{ background: 'none', border: 'none', cursor: resendIn > 0 ? 'default' : 'pointer', fontSize: 13, color: resendIn > 0 ? 'var(--stone-gray)' : 'var(--signal-orange)', fontWeight: 700 }}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Business Info (merged single form) */}
          {step === 3 && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Business Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
                  <input
                    className="input"
                    placeholder="e.g. Cairo Fashion Store"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    style={{ paddingLeft: 40, height: 46 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Logo
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label
                    style={{
                      width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                      border: '1px dashed var(--stone-gray)', background: 'var(--surface-0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden',
                    }}
                  >
                    {logo ? (
                      <img src={logo} alt="Business logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Upload size={20} color="var(--stone-gray)" />
                    )}
                    <input
                      type="file" accept="image/png,image/jpeg,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={e => { handleLogoFile(e.target.files?.[0]); e.target.value = ''; }}
                    />
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--stone-gray)' }}>
                    {logoBusy ? 'Uploading…' : logo ? 'Logo attached — click the circle to replace.' : 'PNG, JPG, GIF or WEBP, max 5MB.'}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Industry *
                </label>
                <select
                  className="input"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  style={{ height: 46 }}
                >
                  <option>Retail &amp; E-Commerce</option>
                  <option>Healthcare &amp; Clinics</option>
                  <option>Food &amp; Beverage</option>
                  <option>Fashion &amp; Apparel</option>
                  <option>Electronics &amp; Tech</option>
                  <option>Beauty &amp; Cosmetics</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Briefly describe what you sell or offer..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
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

              {/* Account is final after OTP verification — Back only revisits
                  the verify screen (no data desync: business fields are free). */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(2); }}
                  className="btn btn-outline btn-lg"
                  style={{ flex: 1, height: 48, fontSize: 15 }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={saving || logoBusy}
                  className="btn btn-primary btn-lg"
                  style={{
                    flex: 2, height: 48, fontSize: 15, background: 'var(--signal-orange)',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                      Saving...
                    </span>
                  ) : (
                    <>Continue <ArrowRight size={18} /></>
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
