import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Analytics } from '../Analytics';

function renderAnalytics() {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <Analytics />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Analytics page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return { ok: false, status: 404 };
      }
      return { ok: true, json: async () => [] };
    });
  });

  it('switches report period between daily, weekly, and monthly', () => {
    renderAnalytics();

    const dailyBtn = screen.getByRole('button', { name: /^daily$/i });
    const weeklyBtn = screen.getByRole('button', { name: /^weekly$/i });
    const monthlyBtn = screen.getByRole('button', { name: /^monthly$/i });

    expect(weeklyBtn).toHaveStyle({ background: 'var(--signal-orange)' });

    fireEvent.click(dailyBtn);
    expect(dailyBtn).toHaveStyle({ background: 'var(--signal-orange)' });
    expect(weeklyBtn).not.toHaveStyle({ background: 'var(--signal-orange)' });

    fireEvent.click(monthlyBtn);
    expect(monthlyBtn).toHaveStyle({ background: 'var(--signal-orange)' });
  });

  it('filters metrics by platform and shows channel scope', () => {
    renderAnalytics();

    const allBtn = screen.getByRole('button', { name: /all platforms combined/i });
    const igBtn = screen.getByRole('button', { name: /instagram direct/i });
    const waBtn = screen.getByRole('button', { name: /whatsapp business/i });

    expect(allBtn).toBeInTheDocument();
    fireEvent.click(igBtn);
    expect(igBtn).toHaveClass('btn-primary');

    fireEvent.click(waBtn);
    expect(waBtn).toHaveClass('btn-primary');
  });

  it('displays empty state placeholders when no messages or conversations exist', () => {
    renderAnalytics();

    expect(screen.getByText('No message volume yet')).toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('generates report using live AI insights from backend', async () => {
    const mockReport = {
      id: 'rep_1',
      title: 'Weekly Performance Report',
      ai_insights: 'Store sales grew 24% this week. Alexandria courier delivery is highly rated.',
      ai_source: 'MicroMind Analytics',
      period: 'weekly',
      created_at: new Date().toISOString()
    };

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/reports/generate') || (String(url).includes('/reports') && !String(url).endsWith('/reports'))) {
        return { ok: true, json: async () => mockReport };
      }
      if (String(url).includes('/reports')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: false, status: 404 };
    });

    renderAnalytics();

    const generateBtn = screen.getByRole('button', { name: /generate ai report/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Report generated via MicroMind Analytics!')).toBeInTheDocument();
    expect(screen.getByText(/Store sales grew 24% this week/i)).toBeInTheDocument();
  });

  it('falls back to local data report when backend report generator is offline', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 500 }));

    renderAnalytics();

    const generateBtn = screen.getByRole('button', { name: /generate ai report/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Executive report generated from current data')).toBeInTheDocument();
    expect(screen.getByText(/ORBIT LIVE DATABASE EXECUTIVE SUMMARY/i)).toBeInTheDocument();
  });

  it('copies generated report text to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 500 }));

    renderAnalytics();

    const generateBtn = screen.getByRole('button', { name: /generate ai report/i });
    fireEvent.click(generateBtn);

    const copyBtn = await screen.findByRole('button', { name: /copy report/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    expect(await screen.findByText('Report copied to clipboard')).toBeInTheDocument();
  });

  it('loads historical reports and allows viewing past insights', async () => {
    const scrollMock = vi.fn();
    window.scrollTo = scrollMock;

    const mockHistory = [
      {
        id: 'rep_hist_1',
        title: 'Q1 Comprehensive Review',
        ai_insights: 'Historical analysis: 92% AI resolution achieved across all channels.',
        period: 'monthly',
        total_revenue: 125000,
        ai_resolution_rate: 92,
        created_at: new Date('2026-09-01').toISOString()
      }
    ];

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/reports')) {
        return { ok: true, json: async () => mockHistory };
      }
      return { ok: false, status: 404 };
    });

    renderAnalytics();

    expect(await screen.findByText('Q1 Comprehensive Review')).toBeInTheDocument();

    const viewInsightsBtn = screen.getByRole('button', { name: /view insights/i });
    fireEvent.click(viewInsightsBtn);

    expect(screen.getByText(/92% AI resolution achieved across all channels/i)).toBeInTheDocument();
    expect(scrollMock).toHaveBeenCalledWith(expect.objectContaining({ top: 400 }));
  });
});
