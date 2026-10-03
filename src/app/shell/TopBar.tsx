import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import { clearSessionCache } from '../../services/session';
import {
  Search, Bell, ChevronDown, LogOut, User, Home, CheckCircle2,
  Package, ShoppingBag, MessageSquare, Users, Scissors, X, ExternalLink
} from 'lucide-react';
import { LiveDot } from '../../components/dash/kit';

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
  '/scheduler': 'Content Scheduler',
  '/admin': 'Operations Admin',
  '/demo': 'Interactive Demo Mode'
};

export function TopBar() {
  const { state } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showAccount, setShowAccount] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const title = pageTitles[location.pathname] || 'Overview Dashboard';

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowNotifications(false);
        setShowAccount(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter search results
  const q = searchQuery.toLowerCase().trim();
  const matchedCustomers = q ? state.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 3) : [];
  const matchedOrders = q ? state.orders.filter(o => o.id.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedProducts = q ? state.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedServices = q ? state.services.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedConversations = q ? state.conversations.filter(c => {
    const cust = state.customers.find(cu => cu.id === c.customerId);
    const name = cust?.name || '';
    return name.toLowerCase().includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
  }).slice(0, 3) : [];

  const hasSearchResults = matchedCustomers.length > 0 || matchedOrders.length > 0 || matchedProducts.length > 0 || matchedServices.length > 0 || matchedConversations.length > 0;

  const handleNavigate = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

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
          <LiveDot label="Engine Live" />
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
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations, orders, customers..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
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

          {/* Quick Search Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsSearchOpen(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 340,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                zIndex: 100,
                maxHeight: 400,
                overflowY: 'auto',
                padding: '8px 0'
              }}>
                {hasSearchResults ? (
                  <>
                    {matchedCustomers.length > 0 && (
                      <div style={{ padding: '6px 12px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
                          Customers
                        </div>
                        {matchedCustomers.map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleNavigate('/customers')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Users size={14} color="var(--signal-orange)" />
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 'auto' }}>{c.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchedOrders.length > 0 && (
                      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
                          Orders
                        </div>
                        {matchedOrders.map(o => (
                          <div
                            key={o.id}
                            onClick={() => handleNavigate('/orders')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <ShoppingBag size={14} color="var(--signal-orange)" />
                            <span style={{ fontWeight: 600 }}>#{o.id}</span>
                            <span style={{ color: 'var(--ink-600)' }}>{o.productName}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 'auto' }}>{o.total} EGP</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchedProducts.length > 0 && (
                      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
                          Products
                        </div>
                        {matchedProducts.map(p => (
                          <div
                            key={p.id}
                            onClick={() => handleNavigate('/products')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Package size={14} color="var(--signal-orange)" />
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            <span style={{ fontSize: 11, marginLeft: 'auto' }}>{p.price} EGP</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchedServices.length > 0 && (
                      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
                          Services
                        </div>
                        {matchedServices.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleNavigate('/services')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Scissors size={14} color="var(--mint-signal)" />
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            <span style={{ fontSize: 11, marginLeft: 'auto' }}>{s.price} EGP</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchedConversations.length > 0 && (
                      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 4 }}>
                          Inbox Messages
                        </div>
                        {matchedConversations.map(conv => {
                          const cust = state.customers.find(cu => cu.id === conv.customerId);
                          return (
                            <div
                              key={conv.id}
                              onClick={() => handleNavigate('/inbox')}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-0)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <MessageSquare size={14} color="var(--signal-orange)" />
                              <span style={{ fontWeight: 600 }}>{cust?.name || 'Customer'}</span>
                              <span style={{ fontSize: 11, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                                {conv.lastMessage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 12.5 }}>
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAccount(false);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: showNotifications ? 'var(--surface-0)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            title="Notifications"
          >
            <Bell size={17} strokeWidth={1.5} color="var(--ink-600)" />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: 'var(--signal-orange)',
                borderRadius: '50%',
                border: '2px solid var(--surface-1)'
              }} />
            )}
          </button>

          {showNotifications && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowNotifications(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>Notifications</span>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={() => setUnreadNotifications(0)}
                      style={{ background: 'none', border: 'none', color: 'var(--signal-orange)', fontSize: 11, fontWeight: 650, cursor: 'pointer', padding: 0 }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                    <CheckCircle2 size={16} color="var(--mint-signal)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--ink-900)' }}>PostgreSQL Engine Live</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>28 tables verified and synchronized.</div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                    <MessageSquare size={16} color="var(--signal-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--ink-900)' }}>AI Automations Active</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>MicroMind execution layer responding to customer intents.</div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
                    <Package size={16} color="var(--signal-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--ink-900)' }}>Catalog Synced</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>Real products and clinic services ready for omnichannel checkouts.</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '10px 16px', background: 'var(--surface-0)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/settings'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Notification Preferences →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Account Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowAccount(!showAccount);
              setShowNotifications(false);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: 'transparent', border: 'none', padding: '4px 8px', borderRadius: 6
            }}
          >
            <img
              src={state.currentUser.avatar}
              alt={state.currentUser.name || 'Account'}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--midnight-ink)' }}>
                {state.currentUser.name || state.currentUser.email || 'Account'}
              </span>
              {state.currentUser.email && (
                <span style={{ fontSize: 10.5, color: 'var(--stone-gray)' }}>
                  {state.currentUser.email}
                </span>
              )}
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
                <button
                  onClick={async () => {
                    await api.logout();
                    clearSessionCache();
                    setShowAccount(false);
                    navigate('/login', { replace: true });
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
                    background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontSize: 13, color: 'var(--danger)'
                  }}
                >
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
