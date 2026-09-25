// Session helpers: localStorage cache only; corrupt data must never throw.
import { describe, it, expect, beforeEach } from 'vitest';
import { getMemberships, isAdmin, clearSessionCache } from '../session';

beforeEach(() => localStorage.clear());

describe('getMemberships', () => {
  it('returns [] when nothing cached', () => {
    expect(getMemberships()).toEqual([]);
  });

  it('parses cached memberships', () => {
    localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'default', role: 'owner' }]));
    expect(getMemberships()).toEqual([{ workspace_id: 'default', role: 'owner' }]);
  });

  it('survives corrupt JSON', () => {
    localStorage.setItem('orbit_memberships', '{broken');
    expect(getMemberships()).toEqual([]);
  });
});

describe('isAdmin', () => {
  it('true for owner and admin, false for agent/none', () => {
    localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'w', role: 'agent' }]));
    expect(isAdmin()).toBe(false);
    localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'w', role: 'admin' }]));
    expect(isAdmin()).toBe(true);
    localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'w', role: 'owner' }]));
    expect(isAdmin()).toBe(true);
    localStorage.clear();
    expect(isAdmin()).toBe(false);
  });
});

describe('clearSessionCache', () => {
  it('removes all session keys', () => {
    localStorage.setItem('orbit_authenticated', 'true');
    localStorage.setItem('orbit_user', '{}');
    localStorage.setItem('orbit_memberships', '[]');
    clearSessionCache();
    expect(localStorage.getItem('orbit_authenticated')).toBeNull();
    expect(localStorage.getItem('orbit_user')).toBeNull();
    expect(localStorage.getItem('orbit_memberships')).toBeNull();
  });
});
