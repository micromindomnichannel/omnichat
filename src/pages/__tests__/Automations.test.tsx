import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider, useVertical } from '../../state/verticalContext';
import { Automations } from '../Automations';

const mockAutomations = [
  { id: 'auto1', name: 'Comment to DM', active: true, vertical: 'commerce', steps: ['Instagram Comment', 'Detect purchase question', 'Reply publicly', 'Send DM'] },
  { id: 'auto2', name: 'Appointment Reminder', active: true, vertical: 'appointments', steps: ['Booking confirmed', 'Wait 24h before', 'Send WhatsApp reminder'] }
];

function AutomationsWrapper({ vertical = 'commerce' }: { vertical?: 'commerce' | 'appointments' }) {
  const VerticalSetter = () => {
    const { setVertical } = useVertical();
    React.useEffect(() => {
      setVertical(vertical);
    }, [vertical]);
    return <Automations />;
  };

  return (
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <VerticalSetter />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Automations page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            automations: mockAutomations
          })
        };
      }
      return { ok: true, json: async () => [] };
    });
  });

  it('renders automations for active vertical and displays Coming Soon section', async () => {
    render(<AutomationsWrapper vertical="commerce" />);

    expect(await screen.findByText('Comment to DM')).toBeInTheDocument();
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Broadcast Campaigns')).toBeInTheDocument();
  });

  it('toggles automation active status and badge', async () => {
    render(<AutomationsWrapper vertical="commerce" />);

    expect(await screen.findByText('Comment to DM')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    const toggleBtns = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-power'));
    expect(toggleBtns.length).toBeGreaterThan(0);

    fireEvent.click(toggleBtns[0]);
    expect(await screen.findByText('Paused')).toBeInTheDocument();

    fireEvent.click(toggleBtns[0]);
    expect(await screen.findByText('Active')).toBeInTheDocument();
  });

  it('expands and collapses workflow steps via View/Hide flow button', async () => {
    render(<AutomationsWrapper vertical="commerce" />);

    expect(await screen.findByText('Comment to DM')).toBeInTheDocument();
    const viewFlowBtn = screen.getByRole('button', { name: /view flow/i });

    fireEvent.click(viewFlowBtn);
    expect(screen.getByText('Detect purchase question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide flow/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide flow/i }));
    expect(screen.queryByText('Detect purchase question')).not.toBeInTheDocument();
  });

  it('renders empty state when no automations exist for active vertical', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return { ok: true, json: async () => ({ automations: [] }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<AutomationsWrapper vertical="commerce" />);

    expect(await screen.findByText('No automations for this vertical')).toBeInTheDocument();
  });

  it('switches vertical and displays appointment automations', async () => {
    const { rerender } = render(<AutomationsWrapper vertical="commerce" />);
    expect(await screen.findByText('Comment to DM')).toBeInTheDocument();

    rerender(<AutomationsWrapper vertical="appointments" />);
    expect(await screen.findByText('Appointment Reminder')).toBeInTheDocument();
  });
});
