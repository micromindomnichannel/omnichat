import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const width = size === 'sm' ? 400 : size === 'md' ? 520 : 720;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--surface-1)',
          borderRadius: 14,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 650, color: 'var(--ink-900)' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'var(--surface-0)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={16} color="var(--ink-600)" />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
