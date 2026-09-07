// Session helpers: the server cookie is the source of truth; localStorage only
// caches the last-known memberships for instant UI gating (nav visibility).
// Every API call re-validates server-side regardless of these values.
export function getMemberships(): Array<{ workspace_id: string; role: string }> {
  try {
    return JSON.parse(localStorage.getItem('orbit_memberships') || '[]');
  } catch {
    return [];
  }
}

export function isAdmin() {
  return getMemberships().some((m) => m.role === 'owner' || m.role === 'admin');
}

export function clearSessionCache() {
  localStorage.removeItem('orbit_authenticated');
  localStorage.removeItem('orbit_user');
  localStorage.removeItem('orbit_memberships');
}
