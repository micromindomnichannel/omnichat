import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../state/store';
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/overview': 'Overview',
  '/inbox': 'Inbox',
  '/customers': 'Customers',
  '/orders': 'Orders',
  '/appointments': 'Appointments',
  '/products': 'Products',
  '/services': 'Services',
  '/automations': 'Automations',
  '/knowledge': 'Knowledge Base',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/demo': 'Demo Mode'
};

export function TopBar() {
  const { state } = useStore();
  const location = useLocation();
  const [showAccount, setShowAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const title = pageTitles[location.pathname] || 'Overview';

  return (
    <header style={{
      height: 64,
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 650, letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: 320,
              height: 36,
              padding: '0 12px 0 36px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-0)',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              outline: 'none'
            }}
          />
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 11, color: 'var(--ink-400)', fontFamily: 'var(--font-mono)'
          }}>
            ⌘K
          </span>
        </div>

        {/* Notifications */}
        <button style={{
          width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)',
          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative'
        }}>
          <Bell size={18} strokeWidth={1.5} color="var(--ink-600)" />
          <span style={{
            position: 'absolute', top: 6, right: 6, width: 8, height: 8,
            background: '#C22E2E', borderRadius: '50%', border: '2px solid var(--surface-1)'
          }} />
        </button>

        {/* Account */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAccount(!showAccount)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: 'transparent', border: 'none', padding: '4px 8px', borderRadius: 6
            }}
          >
            <img
              src={state.currentUser.avatar}
              alt={state.currentUser.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
              {state.businessName}
            </span>
            <ChevronDown size={14} color="var(--ink-400)" />
          </button>

          {showAccount && (
            <>
              <div style={{ position: 'fixed', inset: 0 }} onClick={() => setShowAccount(false)} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: 200, padding: 4, zIndex: 100
              }}>
                <button style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                  background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 13, color: 'var(--ink-600)'
                }}>
                  <User size={16} /> Business Profile
                </button>
                <button style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                  background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 13, color: 'var(--ink-600)'
                }}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
