import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Drawer({ isOpen, onClose, title, children, width = 440 }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.3)'
    }} onClick={onClose}>
      <div
        style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0,
          width: width,
          maxWidth: '100%',
          background: 'var(--surface-1)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          height: 56, flexShrink: 0
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--ink-900)' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'var(--surface-0)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={16} color="var(--ink-600)" />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
