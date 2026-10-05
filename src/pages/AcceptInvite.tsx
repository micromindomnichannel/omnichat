import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import { api } from '../services/api';

// Public: /accept-invite?token=... — join a workspace via an owner invitation.
// The receiver sets their own password here; nobody ever shares credentials.
export function AcceptInvite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [lookup, setLookup] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    api.lookupInvite(token).then((res: any) => {
      if (res?.email) setLookup(res);
      else setLookupError(res?.error || 'This invitation link is invalid or the backend is unreachable.');
    });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      setMsg('Password must be at least 10 characters.');
      return;
    }
    setBusy(true);
    const res = await api.acceptInvite(token, { password, displayName: displayName.trim() || undefined });
    setBusy(false);
    if (res?.success) {
      localStorage.setItem('orbit_authenticated', 'true');
      window.location.assign('/overview');
    } else if (res?._timeout) {
      setMsg('Server is waking up (cold start takes ~30s). Wait a moment and try again.');
    } else {
      setMsg(res?.error || 'Could not accept — link may be expired or the backend unreachable.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cloud-white)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <OrbitLogo size={40} style={{ margin: '0 auto' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Join your workspace</h2>
        {!token && <p style={{ fontSize: 13, color: 'var(--danger)' }}>Missing invitation token — use the full link from your email.</p>}
        {token && lookupError && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{lookupError}</p>}
        {token && !lookup && !lookupError && <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>Checking invitation…</p>}
        {lookup && (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', marginBottom: 4 }}>
              <strong>{lookup.email}</strong> — invited to <strong>{lookup.workspaceName}</strong> as <strong style={{ textTransform: 'capitalize' }}>{lookup.role}</strong>.
            </p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <input
                className="input" placeholder="Your name (optional)"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ height: 46 }}
                autoComplete="name"
              />
              <input
                className="input" type="password" placeholder="Choose a password (min 10 chars)"
                value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 46 }}
                autoComplete="new-password"
              />
              {msg && <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>{msg}</p>}
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ height: 48, background: 'var(--signal-orange)' }}>
                {busy ? 'Joining…' : 'Accept & join workspace'}
              </button>
            </form>
          </>
        )}
        <p style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--signal-orange)', fontWeight: 700, textDecoration: 'none' }}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
