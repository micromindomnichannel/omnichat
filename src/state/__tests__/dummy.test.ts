// LOAD_DUMMY_DATA: every slice hydrates from mockData with zero backend —
// the shape every page renders in dummy mode. Asserts populated slices,
// online flags, and a usable dummy identity (admin route opens locally).
import { describe, it, expect } from 'vitest';
import { reducer } from '../store';
import * as mockData from '../mockData';

function baseState(): any {
  return {
    conversations: [], messages: {}, customers: [], products: [], services: [],
    orders: [], appointments: [], automations: [], faqs: [], sources: [],
    followUps: [], teamMembers: [], currentUser: { name: '', email: '', avatar: '' },
    dbConnected: false, dbOnline: null, hydrated: false,
  };
}

describe('LOAD_DUMMY_DATA', () => {
  it('hydrates all slices from mockData and marks the store online', () => {
    const next: any = reducer(baseState(), { type: 'LOAD_DUMMY_DATA' });
    expect(next.conversations.length).toBe(mockData.conversations.length);
    expect(next.conversations.length).toBeGreaterThan(0);
    expect(Object.keys(next.messages).length).toBeGreaterThan(0);
    expect(next.customers.length).toBe(mockData.customers.length);
    expect(next.products.length).toBe(mockData.products.length);
    expect(next.orders.length).toBe(mockData.orders.length);
    expect(next.appointments.length).toBe(mockData.appointments.length);
    expect(next.dbOnline).toBe(true);
    expect(next.dbConnected).toBe(true);
    expect(next.hydrated).toBe(true);
  });

  it('covers all four live channels without merging identities', () => {
    const next: any = reducer(baseState(), { type: 'LOAD_DUMMY_DATA' });
    const channels = new Set(next.conversations.map((c: any) => c.channel));
    for (const ch of ['messenger', 'instagram', 'telegram', 'discord']) {
      expect(channels.has(ch)).toBe(true);
    }
    const customerIds = next.conversations.map((c: any) => `${c.channel}:${c.customerId}`);
    expect(new Set(customerIds).size).toBe(customerIds.length);
  });

  it('provides a dummy identity that opens admin-gated routes locally', () => {
    const next: any = reducer(baseState(), { type: 'LOAD_DUMMY_DATA' });
    expect(next.currentUser.email).toBe('micromindomnichannel@gmail.com');
  });
});
