import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { TopBar } from '../TopBar';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';

function renderShell(initialPath = '/overview', role = 'agent', industry = 'commerce') {
  localStorage.setItem('orbit_authenticated', 'true');
  localStorage.setItem('orbit_user', JSON.stringify({
    email: role === 'owner' ? 'micromindomnichannel@gmail.com' : 'user@orbit.com',
    industry
  }));
  localStorage.setItem('orbit_memberships', JSON.stringify([{ workspace_id: 'default', role }]));

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <StoreProvider>
        <VerticalProvider>
          <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ flex: 1 }}>
              <TopBar />
              <Routes>
                <Route path="/overview" element={<div>Overview Page Content</div>} />
                <Route path="/inbox" element={<div>Inbox Page Content</div>} />
                <Route path="/customers" element={<div>Customers Page Content</div>} />
                <Route path="/orders" element={<div>Orders Page Content</div>} />
                <Route path="/appointments" element={<div>Appointments Page Content</div>} />
                <Route path="/products" element={<div>Products Page Content</div>} />
                <Route path="/services" element={<div>Services Page Content</div>} />
                <Route path="/settings" element={<div>Settings Page Content</div>} />
                <Route path="/admin" element={<div>Admin Page Content</div>} />
                <Route path="/login" element={<div>Login Page Content</div>} />
                <Route path="/" element={<div>Landing Page Content</div>} />
              </Routes>
            </div>
          </div>
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('App Shell — Sidebar & TopBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            customers: [
              {
                id: 'c1',
                name: 'Ahmed Hassan',
                phone: '0102 345 6789',
                channels: ['instagram'],
                tags: ['VIP'],
                status: 'VIP',
                totalSpent: 1200,
                totalOrders: 2,
                totalAppointments: 0,
                reliability: { status: 'Good', completed: 2, cancellations: 0, returns: 0, noShows: 0 }
              }
            ],
            conversations: [],
            products: [],
            services: [],
            orders: [],
            appointments: []
          })
        };
      }
      return { ok: true, json: async () => null };
    });
  });

  describe('Sidebar', () => {
    it('filters vertical navigation items correctly in commerce mode', () => {
      renderShell('/overview', 'agent', 'commerce');

      expect(screen.getByRole('button', { name: /^orders$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^products$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^appointments$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^services$/i })).not.toBeInTheDocument();
    });

    it('filters vertical navigation items correctly in appointments mode', () => {
      renderShell('/overview', 'agent', 'appointments');

      expect(screen.getByRole('button', { name: /^appointments$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^services$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^orders$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^products$/i })).not.toBeInTheDocument();
    });

    it('gates admin navigation item based on user role', () => {
      // 1. Regular agent: no admin item
      const { unmount } = renderShell('/overview', 'agent');
      expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument();
      unmount();

      // 2. Owner/Admin: admin item is rendered
      renderShell('/overview', 'owner');
      expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    });

    it('navigates to pages on click and executes logout flow', async () => {
      renderShell('/overview');

      // Click customers
      fireEvent.click(screen.getByRole('button', { name: /customers/i }));
      expect(screen.getByText('Customers Page Content')).toBeInTheDocument();

      // Click logout
      const logoutBtn = screen.getByRole('button', { name: /^log out$/i });
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByText('Login Page Content')).toBeInTheDocument();
      });
      expect(localStorage.getItem('orbit_authenticated')).toBeNull();
    });
  });

  describe('TopBar', () => {
    it('displays route title corresponding to current location', () => {
      renderShell('/inbox');
      expect(screen.getByText('Omnichannel Inbox')).toBeInTheDocument();
    });

    it('supports quick search with keyboard shortcut Ctrl+K and escape dismissal', async () => {
      renderShell('/overview');

      const searchInput = screen.getByPlaceholderText(/search conversations, orders, customers/i);

      // Trigger Ctrl+K
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      expect(searchInput).toHaveFocus();

      // Search for 'Ahmed'
      fireEvent.change(searchInput, { target: { value: 'Ahmed' } });

      // Verify Ahmed Hassan rendered in search results
      expect(await screen.findByText('Ahmed Hassan')).toBeInTheDocument();

      // Press Escape to close search dropdown
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByText('Ahmed Hassan')).not.toBeInTheDocument();
    });

    it('toggles notifications popover and marks all as read', async () => {
      renderShell('/overview');

      const notifBtn = screen.getByTitle('Notifications');
      fireEvent.click(notifBtn);

      expect(screen.getByText('PostgreSQL Engine Live')).toBeInTheDocument();
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();

      // Click mark all as read
      fireEvent.click(screen.getByText('Mark all as read'));
      expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();

      // Navigate to notification preferences
      fireEvent.click(screen.getByRole('button', { name: /notification preferences/i }));
      expect(screen.getByText('Settings Page Content')).toBeInTheDocument();
    });

    it('toggles account menu and provides profile links and logout', async () => {
      renderShell('/overview');

      const accountBtn = screen.getByAltText(/account/i).closest('button')!;
      fireEvent.click(accountBtn);

      expect(screen.getByText('Business Profile & Settings')).toBeInTheDocument();
      expect(screen.getByText('View Landing Page')).toBeInTheDocument();

      // Click landing page link
      fireEvent.click(screen.getByText('View Landing Page'));
      expect(screen.getByText('Landing Page Content')).toBeInTheDocument();
    });
  });
});
