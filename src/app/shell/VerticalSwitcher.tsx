import React, { useState, useRef, useEffect } from 'react';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { Package, Calendar, ChevronDown, Check } from 'lucide-react';

interface VerticalSwitcherProps {
  collapsed?: boolean;
}

export function VerticalSwitcher({ collapsed = false }: VerticalSwitcherProps) {
  const { vertical, setVertical } = useVertical();
  const { showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (mode: 'commerce' | 'appointments') => {
    if (mode === vertical) {
      setIsOpen(false);
      return;
    }
    setVertical(mode);
    try {
      const user = JSON.parse(localStorage.getItem('orbit_user') || '{}');
      user.industry = mode;
      localStorage.setItem('orbit_user', JSON.stringify(user));
    } catch {}

    showToast(`Switched workspace to ${mode === 'commerce' ? 'Commerce' : 'Appointments'} Mode`, 'success');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 38,
          borderRadius: 8,
          background: isOpen ? 'var(--surface-0)' : 'var(--surface-0)',
          border: `1px solid ${isOpen ? 'var(--signal-orange)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? 0 : '0 10px',
          cursor: 'pointer',
          gap: 8,
          transition: 'all 0.15s ease'
        }}
        title={collapsed ? (vertical === 'commerce' ? 'Commerce Mode' : 'Appointments Mode') : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: vertical === 'commerce' ? 'var(--signal-orange)' : 'var(--mint-signal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {vertical === 'commerce' ? <Package size={13} color="white" /> : <Calendar size={13} color="white" />}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--midnight-ink)' }}>
              {vertical === 'commerce' ? 'Commerce Mode' : 'Appointments Mode'}
            </span>
          )}
        </div>
        {!collapsed && <ChevronDown size={14} color="var(--stone-gray)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: collapsed ? 200 : '100%',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--stone-gray)' }}>
            Workspace Vertical
          </div>

          <button
            onClick={() => handleSelect('commerce')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 6,
              background: vertical === 'commerce' ? 'var(--signal-orange-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--signal-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={12} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--midnight-ink)' }}>Commerce Mode</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-500)' }}>Orders, Products, Catalog</div>
              </div>
            </div>
            {vertical === 'commerce' && <Check size={14} color="var(--signal-orange)" />}
          </button>

          <button
            onClick={() => handleSelect('appointments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 6,
              background: vertical === 'appointments' ? 'var(--mint-signal-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--mint-signal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={12} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--midnight-ink)' }}>Appointments Mode</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-500)' }}>Agenda, Services, Clinics</div>
              </div>
            </div>
            {vertical === 'appointments' && <Check size={14} color="var(--mint-signal)" />}
          </button>
        </div>
      )}
    </div>
  );
}
