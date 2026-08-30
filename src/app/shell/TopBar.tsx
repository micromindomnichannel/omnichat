import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { Search, Bell, ChevronDown, LogOut, User, Home, ExternalLink } from 'lucide-react';
import { OrbitLogo } from '../../components/shared/OrbitLogo';

const pageTitles: Record<string, string> = {
  '/landing': 'ORBIT Landing Page',
  '/overview': 'Overview Dashboard',
  '/inbox': 'Omnichannel Inbox',
  '/customers': 'Customer CRM',
  '/orders': 'Orders & Logistics',
  '/appointments': 'Appointments Agenda',
  '/products': 'Products & Inventory',
  '/services': 'Services Catalog',
  '/automations': 'AI Automations',
  '/knowledge': 'Knowledge Base',
  '/analytics': 'Analytics & Reports',
  '/settings': 'Platform Settings',
  '/demo': 'Interactive Demo Mode'
};

export function TopBar() {
  const { state } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAccount, setShowAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const title = pageTitles[location.pathname] || 'Overview Dashboard';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--midnight-ink)' }}>
          {title}
        </h1>

        <div className="orbit-badge hide-below-900">
          <span>ORBIT Engine Live</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Navigation to Landing Page */}
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline btn-sm hide-below-768"
          style={{ height: 34, gap: 6, fontSize: 12.5 }}
        >
          <Home size={14} color="var(--signal-orange)" />
          <span>Landing Page</span>
        </button>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
          <input
            type="text"
            placeholder="Search conversations, orders, customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: 280,
              height: 36,
              padding: '0 34px 0 34px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-0)',
              fontSize: 12.5,
              fontFamily: 'var(--font-ui)',
              outline: 'none'
            }}
          />
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 10.5, color: 'var(--stone-gray)', fontFamily: 'var(--font-mono)'
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
          <Bell size={17} strokeWidth={1.5} color="var(--ink-600)" />
          <span style={{
            position: 'absolute', top: 6, right: 6, width: 8, height: 8,
            background: 'var(--signal-orange)', borderRadius: '50%', border: '2px solid var(--surface-1)'
          }} />
        </button>

        {/* Account Menu */}
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
            <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--midnight-ink)' }}>
              {state.businessName}
            </span>
            <ChevronDown size={14} color="var(--stone-gray)" />
          </button>

          {showAccount && (
            <>
              <div style={{ position: 'fixed', inset: 0 }} onClick={() => setShowAccount(false)} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 200, padding: 4, zIndex: 100
              }}>
                <button
                  onClick={() => { navigate('/'); setShowAccount(false); }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                    background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontSize: 13, color: 'var(--ink-600)'
                  }}
                >
                  <Home size={16} /> View Landing Page
                </button>
                <button
                  onClick={() => { navigate('/settings'); setShowAccount(false); }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                    background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontSize: 13, color: 'var(--ink-600)'
                  }}
                >
                  <User size={16} /> Business Profile & Settings
                </button>
                <button style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                  background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 13, color: 'var(--burnt-coral)'
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
