import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import { api } from '../services/api';

// Public: /reset?token=... — sets a new password via the emailed token.
export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      setMsg('Password must be at least 10 characters.');
      return;
    }
    setBusy(true);
    const res = await api.resetPassword(token, password);
    setBusy(false);
    if (res?.success) {
      setDone(true);
      setMsg('Password updated. All other sessions were signed out.');
    } else if (res?._timeout) {
      setMsg('Server is waking up (cold start takes ~30s). Wait a moment and try again.');
    } else {
      setMsg(res?.error || 'Reset failed — link may be expired or the backend unreachable.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cloud-white)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <OrbitLogo variant="horizontal" size={32} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Set a new password</h2>
        {!token && <p style={{ fontSize: 13, color: 'var(--danger)' }}>Missing reset token — use the full link from your email.</p>}
        {done ? (
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', background: 'var(--signal-orange)', marginTop: 16 }}>
            Back to Sign In
          </button>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <input
              className="input" type="password" placeholder="New password (min 10 chars)"
              value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 46 }}
              autoComplete="new-password"
            />
            {msg && <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>{msg}</p>}
            <button type="submit" disabled={busy || !token} className="btn btn-primary" style={{ height: 48, background: 'var(--signal-orange)' }}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
        <p style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--signal-orange)', fontWeight: 700, textDecoration: 'none' }}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
