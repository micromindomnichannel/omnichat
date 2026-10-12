// Session helpers: localStorage cache only; corrupt data must never throw.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getMemberships, isAdmin, clearSessionCache, isDummyMode, enableDummyMode, disableDummyMode } from '../session';

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
  it('only allows the platform administrator email', () => {
    localStorage.setItem('orbit_user', JSON.stringify({ email: 'agent@example.com' }));
    expect(isAdmin()).toBe(false);
    localStorage.setItem('orbit_user', JSON.stringify({ email: 'micromindomnichannel@gmail.com' }));
    expect(isAdmin()).toBe(true);
    localStorage.setItem('orbit_user', JSON.stringify({ email: 'MICROMINDOMNICHANNEL@GMAIL.COM' }));
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

describe('dummy mode', () => {
  const BASE_URL = window.location.href;

  afterEach(() => {
    window.history.replaceState({}, '', BASE_URL.split('?')[0]);
  });

  it('is off by default', () => {
    expect(isDummyMode()).toBe(false);
  });

  it('enable/disable round-trips the flag', () => {
    enableDummyMode();
    expect(isDummyMode()).toBe(true);
    disableDummyMode();
    expect(isDummyMode()).toBe(false);
  });

  it('?dummy=1 enables and persists; ?dummy=0 disables', () => {
    window.history.replaceState({}, '', '/login?dummy=1');
    expect(isDummyMode()).toBe(true);
    expect(localStorage.getItem('orbit_dummy')).toBe('1');
    window.history.replaceState({}, '', '/overview?dummy=0');
    expect(isDummyMode()).toBe(false);
    expect(localStorage.getItem('orbit_dummy')).toBeNull();
  });
});
