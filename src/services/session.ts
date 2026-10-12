// Session helpers: the server cookie is the source of truth; localStorage only
// caches the last-known memberships for instant UI gating (nav visibility).
// Every API call re-validates server-side regardless of these values.
// Dummy-data mode (frontend-only testing, no backend): enabled via
// ?dummy=1 (persisted to localStorage so navigation keeps it). When on, the
// app hydrates the store from mockData and skips the session guard. NEVER
// enable automatically — only through the explicit login-page entry point.
const DUMMY_KEY = 'orbit_dummy';

export function isDummyMode(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search || '').get('dummy');
      if (q === '1') {
        try { localStorage.setItem(DUMMY_KEY, '1'); } catch { /* ignore */ }
        return true;
      }
      if (q === '0') {
        try { localStorage.removeItem(DUMMY_KEY); } catch { /* ignore */ }
        return false;
      }
    }
    return localStorage.getItem(DUMMY_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDummyMode() {
  try { localStorage.setItem(DUMMY_KEY, '1'); } catch { /* ignore */ }
}

export function disableDummyMode() {
  try { localStorage.removeItem(DUMMY_KEY); } catch { /* ignore */ }
}
export function getMemberships(): Array<{ workspace_id: string; role: string }> {
  try {
    return JSON.parse(localStorage.getItem('orbit_memberships') || '[]');
  } catch {
    return [];
  }
}

export function isAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem('orbit_user') || '{}');
    return String(user.email || '').trim().toLowerCase() === 'micromindomnichannel@gmail.com';
  } catch {
    return false;
  }
}

export function clearSessionCache() {
  localStorage.removeItem('orbit_authenticated');
  localStorage.removeItem('orbit_user');
  localStorage.removeItem('orbit_memberships');
}
