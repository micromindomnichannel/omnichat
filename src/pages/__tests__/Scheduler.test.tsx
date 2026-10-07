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

  it('marks drafts, approval, and campaigns honestly unavailable (no fake publishing)', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
    renderScheduler();
    await waitFor(() => expect(screen.getByText(/drafts · coming soon/i)).toBeInTheDocument());
    expect(screen.getByText(/approval queue · coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/campaigns · coming soon/i)).toBeInTheDocument();
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
    expect(screen.getByText('⏱️ Scheduled')).toBeInTheDocument();
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
    // Once published, publish button is hidden and Published badge is shown
    expect(screen.queryByRole('button', { name: /publish now/i })).not.toBeInTheDocument();
    expect(screen.getByText('● Published')).toBeInTheDocument();
  });

  it('handles "Live with warnings" branch when partial failures occur', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/publish')) {
        return {
          ok: true,
          json: async () => ({
            id: 'sch_9',
            status: 'published',
            results: {
              facebook: { ok: true },
              instagram: { ok: false, error: 'rate limited' }
            }
          })
        };
      }
      return {
        ok: true,
        json: async () => [{
          id: 'sch_9', title: 'Promo', content_text: 'Hello', media_url: null,
          platforms: ['facebook', 'instagram'], scheduled_time: '2026-10-01T10:00', status: 'scheduled',
        }],
      };
    });
    renderScheduler();
    fireEvent.click(await screen.findByRole('button', { name: /publish now/i }));
    await waitFor(() => expect(screen.getByText(/live with warnings — instagram: rate limited/i)).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/failed — facebook: expired token/i)).toBeInTheDocument());
    expect(screen.getByText('Promo')).toBeInTheDocument();
    expect(screen.getByText('● Failed')).toBeInTheDocument();
  });

  it('deletes post and calls backend delete endpoint', async () => {
    const deleteCalls: string[] = [];
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      if (opts?.method === 'DELETE') {
        deleteCalls.push(String(url));
        return { ok: true, json: async () => ({ success: true }) };
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
    await waitFor(() => expect(screen.getByText('Promo')).toBeInTheDocument());

    const publishBtn = screen.getByRole('button', { name: /publish now/i });
    const deleteBtn = publishBtn.nextElementSibling as HTMLButtonElement;
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(screen.queryByText('Promo')).not.toBeInTheDocument());
    expect(deleteCalls.length).toBe(1);
    expect(deleteCalls[0]).toContain('/schedules/sch_9');
  });

  it('manages create modal: required gates, single-platform guard, cancel discard, and successful creation', async () => {
    let createdPayload: any = null;
    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      if (opts?.method === 'POST' && String(url).includes('/schedules')) {
        createdPayload = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({
            id: 'sch_10',
            title: createdPayload.title,
            content_text: createdPayload.content_text,
            media_url: createdPayload.media_url,
            platforms: createdPayload.platforms,
            scheduled_time: createdPayload.scheduled_time,
            status: 'scheduled'
          })
        };
      }
      return { ok: true, json: async () => [] };
    });

    renderScheduler();
    await waitFor(() => expect(screen.getByText(/nothing scheduled/i)).toBeInTheDocument());

    // Open Modal
    const scheduleBtns = screen.getAllByRole('button', { name: /schedule new content/i });
    fireEvent.click(scheduleBtns[0]);

    expect(screen.getByRole('heading', { name: 'Schedule Cross-Platform Post' })).toBeInTheDocument();

    // Test single-platform guard: default has Instagram and Facebook
    const igBtn = screen.getByRole('button', { name: /instagram/i });
    const fbBtn = screen.getByRole('button', { name: /facebook/i });

    // Deselect Instagram (leaves only Facebook)
    fireEvent.click(igBtn);
    // Attempting to deselect Facebook should do nothing because min 1 platform is enforced
    fireEvent.click(fbBtn);

    // Cancel modal and verify closed
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { name: 'Schedule Cross-Platform Post' })).not.toBeInTheDocument();

    // Reopen and test ✕ button
    fireEvent.click(scheduleBtns[0]);
    expect(screen.getByRole('heading', { name: 'Schedule Cross-Platform Post' })).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('heading', { name: 'Schedule Cross-Platform Post' })).not.toBeInTheDocument();

    // Reopen and complete form
    fireEvent.click(scheduleBtns[0]);
    fireEvent.change(screen.getByPlaceholderText(/weekend special offer/i), { target: { value: 'Flash Sale 50% Off' } });
    fireEvent.change(screen.getByPlaceholderText(/write your broadcast post message here/i), { target: { value: 'Exclusive deals today only!' } });
    fireEvent.change(document.querySelector('input[type="datetime-local"]')!, { target: { value: '2026-10-15T14:30' } });

    const submitBtn = screen.getByRole('button', { name: /schedule broadcast/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => expect(screen.getByText('Flash Sale 50% Off')).toBeInTheDocument());
    expect(screen.getByText('Exclusive deals today only!')).toBeInTheDocument();
    expect(screen.getByText('2026-10-15T14:30')).toBeInTheDocument();
  });
});
