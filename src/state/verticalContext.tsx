import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Vertical } from './mockData';

interface VerticalContextType {
  vertical: Vertical;
  setVertical: (v: Vertical) => void;
  accentColor: string;
  accentBg: string;
  isCommerce: boolean;
  isAppointments: boolean;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const [vertical, setVerticalState] = useState<Vertical>('commerce');

  const setVertical = useCallback((v: Vertical) => {
    setVerticalState(v);
    // Update CSS variable for accent
    document.documentElement.style.setProperty('--brand-active', v === 'commerce' ? '#2F5CFF' : '#0F9D77');
  }, []);

  const accentColor = vertical === 'commerce' ? '#2F5CFF' : '#0F9D77';
  const accentBg = vertical === 'commerce' ? 'rgba(47, 92, 255, 0.08)' : 'rgba(15, 157, 119, 0.08)';

  return (
    <VerticalContext.Provider value={{
      vertical,
      setVertical,
      accentColor,
      accentBg,
      isCommerce: vertical === 'commerce',
      isAppointments: vertical === 'appointments'
    }}>
      {children}
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  const ctx = useContext(VerticalContext);
  if (!ctx) throw new Error('useVertical must be used within VerticalProvider');
  return ctx;
}
