import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { OrbitLogo } from '../../components/shared/OrbitLogo';
import {
  LayoutDashboard, MessageSquare, Users, ShoppingBag, Calendar, Package, Scissors,
  Bot, BookOpen, BarChart3, Settings, HelpCircle, ChevronDown, Menu, X, Home, ExternalLink
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/overview' },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare, path: '/inbox', badge: 'unread' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/orders', commerceOnly: true },
  { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/appointments', appointmentsOnly: true },
  { id: 'products', label: 'Products', icon: Package, path: '/products', commerceOnly: true },
  { id: 'services', label: 'Services', icon: Scissors, path: '/services', appointmentsOnly: true },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar, path: '/scheduler' },
  { id: 'automations', label: 'Automations', icon: Bot, path: '/automations' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, path: '/knowledge' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
];

const bottomItems = [
  { id: 'landing', label: 'Landing Page', icon: Home, path: '/' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const { vertical, setVertical } = useVertical();
  const { state } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1180);
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const unreadCount = state.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filteredNav = navItems.filter(item => {
    if (item.commerceOnly && vertical !== 'commerce') return false;
    if (item.appointmentsOnly && vertical !== 'appointments') return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;
  const sidebarWidth = collapsed ? 72 : 240;

  const sidebarContent = (
    <>
      {/* ORBIT Brand Logo Header */}
      <div style={{
        padding: '20px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
        {!collapsed ? (
          <OrbitLogo
            variant="horizontal"
            size={28}
            colorMode="default"
            showTagline={false}
            onClick={() => navigate('/')}
          />
        ) : (
          <OrbitLogo
            variant="icon"
            size={36}
            colorMode="default"
            onClick={() => navigate('/')}
          />
        )}
      </div>

      {/* Vertical Switcher */}
      <div style={{ padding: '0 14px 16px', position: 'relative' }}>
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          style={{
            width: '100%',
            height: 38,
            borderRadius: 8,
            background: 'var(--surface-0)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? 0 : '0 12px',
            cursor: 'pointer',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              background: vertical === 'commerce' ? 'var(--signal-orange)' : 'var(--mint-signal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {vertical === 'commerce' ? <Package size={12} color="white" /> : <Calendar size={12} color="white" />}
            </div>
            {!collapsed && (
              <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--midnight-ink)' }}>
                {vertical === 'commerce' ? 'Commerce Mode' : 'Appointments Mode'}
              </span>
            )}
          </div>
          {!collapsed && <ChevronDown size={14} color="var(--stone-gray)" />}
        </button>

        {showSwitcher && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 14,
            right: 14,
            marginTop: 4,
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: 4
          }}>
            <button
              onClick={() => { setVertical('commerce'); setShowSwitcher(false); }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 6, border: 'none',
                background: vertical === 'commerce' ? 'var(--signal-orange-subtle)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                color: vertical === 'commerce' ? 'var(--signal-orange)' : 'var(--ink-600)',
                fontSize: 13, fontWeight: 650
              }}
            >
              <Package size={16} /> E-Commerce Mode
            </button>
            <button
              onClick={() => { setVertical('appointments'); setShowSwitcher(false); }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 6, border: 'none',
                background: vertical === 'appointments' ? 'rgba(82, 216, 164, 0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                color: vertical === 'appointments' ? '#0F8357' : 'var(--ink-600)',
                fontSize: 13, fontWeight: 650
              }}
            >
              <Calendar size={16} /> Appointments Mode
            </button>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredNav.map(item => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: active ? 'var(--signal-orange-subtle)' : 'transparent',
                  color: active ? 'var(--signal-orange)' : 'var(--ink-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? 0 : '0 12px',
                  gap: 12,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font-ui)',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-0)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3.5, height: 22, background: 'var(--signal-orange)', borderRadius: '0 4px 4px 0'
                  }} />
                )}
                <Icon size={18} strokeWidth={active ? 2 : 1.6} color={active ? 'var(--signal-orange)' : undefined} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge === 'unread' && unreadCount > 0 && (
                      <span style={{
                        background: 'var(--signal-orange)', color: 'white', fontSize: 11, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center'
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Items */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bottomItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', height: 38, borderRadius: 8, border: 'none',
                  background: active ? 'var(--surface-0)' : 'transparent',
                  color: active ? 'var(--midnight-ink)' : 'var(--ink-600)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? 0 : '0 12px', gap: 12, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ui)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'}
                onMouseLeave={e => e.currentTarget.style.background = active ? 'var(--surface-0)' : 'transparent'}
              >
                <Icon size={18} strokeWidth={1.5} color="var(--ink-600)" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  if (window.innerWidth < 768) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: 'fixed', top: 14, left: 16, zIndex: 200,
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {mobileOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
          }} onClick={() => setMobileOpen(false)}>
            <div
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 240, background: 'var(--surface-1)',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column'
              }}
              onClick={e => e.stopPropagation()}
            >
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'width 0.2s ease',
      overflow: 'hidden'
    }}>
      {sidebarContent}
    </aside>
  );
}
