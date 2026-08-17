import React from 'react';
import { useStore } from '../../state/store';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export function Toast() {
  const { state, dispatch } = useStore();

  if (state.toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8
    }}>
      {state.toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-slide-up"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: 280
          }}
        >
          {toast.type === 'success' && <CheckCircle size={18} color="#12875A" />}
          {toast.type === 'warning' && <AlertTriangle size={18} color="#B25E09" />}
          {toast.type === 'danger' && <XCircle size={18} color="#C22E2E" />}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-900)', flex: 1 }}>
            {toast.message}
          </span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} color="var(--ink-400)" />
          </button>
        </div>
      ))}
    </div>
  );
}
