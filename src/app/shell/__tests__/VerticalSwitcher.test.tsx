import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerticalSwitcher } from '../VerticalSwitcher';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';

function renderSwitcher(email: string, industry = 'commerce') {
  localStorage.setItem('orbit_user', JSON.stringify({ email, industry }));
  return render(
    <StoreProvider>
      <VerticalProvider>
        <VerticalSwitcher />
      </VerticalProvider>
    </StoreProvider>
  );
}

describe('VerticalSwitcher gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => null }));
  });

  it('non-admin sees a static mode badge (no switching)', () => {
    renderSwitcher('agent@biz.com', 'commerce');
    expect(screen.getByText('Commerce Mode')).toBeInTheDocument();
    expect(screen.getByTitle(/set by your workspace/i)).toBeInTheDocument();
    // No dropdown affordance for normal users.
    expect(screen.queryByText('Workspace Vertical')).not.toBeInTheDocument();
    expect(screen.queryByText('Appointments Mode')).not.toBeInTheDocument();
  });

  it('admin keeps both modes and can switch', () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => null }));
    renderSwitcher('micromindomnichannel@gmail.com', 'commerce');
    fireEvent.click(screen.getByText('Commerce Mode'));
    expect(screen.getByText('Workspace Vertical')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Appointments Mode'));
    expect(screen.getByText('Appointments Mode')).toBeInTheDocument();
  });
});
