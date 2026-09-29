import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Scheduler } from '../Scheduler';

function renderScheduler() {
  return render(
    <MemoryRouter initialEntries={['/scheduler']}>
      <StoreProvider>
        <VerticalProvider>
          <Scheduler />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Scheduler', () => {
  it('shows the empty state when the backend has no schedules', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
    renderScheduler();
    await waitFor(() => expect(screen.getByText(/nothing scheduled/i)).toBeInTheDocument());
  });

  it('renders live rows with a publish action each', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [{
        id: 'sch_9', title: 'Promo', content_text: 'Hello', media_url: null,
        platforms: ['facebook'], scheduled_time: '2026-10-01T10:00', status: 'scheduled',
      }],
    }));
    renderScheduler();
    await waitFor(() => expect(screen.getByText('Promo')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /publish now/i })).toBeInTheDocument();
  });

  it('publish-now posts to the backend endpoint and marks the row', async () => {
    const calls: Array<[string, any]> = [];
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push([String(url), opts]);
      if (String(url).includes('/publish')) {
        return { ok: true, json: async () => ({ id: 'sch_9', status: 'published', results: { facebook: { ok: true, postId: '1_2' } } }) };
      }
      return {
        ok: true,
        json: async () => [{
          id: 'sch_9', title: 'Promo', content_text: 'Hello', media_url: null,
          platforms: ['facebook'], scheduled_time: '2026-10-01T10:00', status: 'scheduled',
        }],
      };
    });
    renderScheduler();
    fireEvent.click(await screen.findByRole('button', { name: /publish now/i }));
    await waitFor(() => expect(screen.getByText(/live on all target platforms/i)).toBeInTheDocument());
    const pub = calls.find(([u]) => u.includes('/publish'));
    expect(pub).toBeTruthy();
    expect(pub![0]).toContain('/v1/workspaces/default/schedules/sch_9/publish');
    expect(pub![1].method).toBe('POST');
  });

  it('surfaces per-platform failure without losing the row', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/publish')) {
        return { ok: true, json: async () => ({ id: 'sch_9', status: 'failed', results: { facebook: { ok: false, error: 'expired token' } } }) };
      }
      return {
        ok: true,
        json: async () => [{
          id: 'sch_9', title: 'Promo', content_text: 'Hello', media_url: null,
          platforms: ['facebook'], scheduled_time: '2026-10-01T10:00', status: 'scheduled',
        }],
      };
    });
    renderScheduler();
    fireEvent.click(await screen.findByRole('button', { name: /publish now/i }));
    await waitFor(() => expect(screen.getByText(/failed.*expired token/i)).toBeInTheDocument());
    expect(screen.getByText('Promo')).toBeInTheDocument();
  });
});
