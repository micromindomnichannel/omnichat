import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider, useVertical } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Customers } from '../Customers';

const mockCustomer = {
  id: 'c1',
  name: 'Sara Ahmed',
  phone: '+20 100 123 4567',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  totalSpent: 3450,
  totalOrders: 4,
  totalAppointments: 2,
  customerSince: 'Jan 2026',
  channels: ['instagram'] as any,
  status: 'VIP' as const,
  tags: ['VIP', 'Repeat Buyer'],
  reliability: {
    completed: 4,
    cancellations: 0,
    returns: 1,
    noShows: 0,
    status: 'Good' as const
  }
};

const mockOrder = {
  id: '1051',
  customer_id: 'c1',
  customerId: 'c1',
  product_name: 'Black Leather Bag',
  productName: 'Black Leather Bag',
  date: '2026-10-01',
  paymentMethod: 'COD' as const,
  total: 900,
  status: 'Confirmed' as const,
  governorate: 'Cairo',
  address: '14 Zamalek St'
};

const mockAppointment = {
  id: 'A-201',
  customer_id: 'c1',
  customerId: 'c1',
  service_name: 'Dental Cleaning',
  serviceName: 'Dental Cleaning',
  date: '2026-10-02',
  time: '11:00',
  status: 'Confirmed' as const,
  duration: 45
};

function CustomersWrapper({ vertical = 'commerce' }: { vertical?: 'commerce' | 'appointments' }) {
  const VerticalSetter = () => {
    const { setVertical } = useVertical();
    React.useEffect(() => {
      setVertical(vertical);
    }, [vertical]);
    return <Customers />;
  };

  return (
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <VerticalSetter />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Customers detail drawer & flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            customers: [mockCustomer],
            orders: [mockOrder],
            appointments: [mockAppointment]
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('opens customer detail drawer on row click and shows reliability score card', async () => {
    render(<CustomersWrapper vertical="commerce" />);

    const customerRow = await screen.findByText('Sara Ahmed');
    fireEvent.click(customerRow);

    // Drawer opens
    expect(await screen.findByText('Reliability Score:')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Returns')).toBeInTheDocument();
    expect(screen.getByText('No-shows')).toBeInTheDocument();
  });

  it('adds and removes tags with appropriate toasts', async () => {
    render(<CustomersWrapper vertical="commerce" />);

    const customerRow = await screen.findByText('Sara Ahmed');
    fireEvent.click(customerRow);

    expect(await screen.findByText('Customer Tags')).toBeInTheDocument();

    // Add new tag
    const tagInput = screen.getByPlaceholderText(/add custom tag/i);
    fireEvent.change(tagInput, { target: { value: 'High Value' } });

    const addTagBtn = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addTagBtn);

    expect(await screen.findByText(/tag added/i)).toBeInTheDocument();
    expect(screen.getAllByText('High Value').length).toBeGreaterThanOrEqual(1);

    // Remove existing tag inside the drawer
    const removeIcon = document.querySelector('span[style*="var(--signal-orange-subtle)"] svg')!;
    fireEvent.click(removeIcon);

    expect(await screen.findByText('Tag removed')).toBeInTheDocument();
  });

  it('displays order history in commerce vertical and appointment history in appointments vertical', async () => {
    const { rerender } = render(<CustomersWrapper vertical="commerce" />);

    const customerRow = await screen.findByText('Sara Ahmed');
    fireEvent.click(customerRow);

    expect(await screen.findByText(/Order History/i)).toBeInTheDocument();
    expect(screen.getByText(/#1051 · Black Leather Bag/i)).toBeInTheDocument();

    rerender(<CustomersWrapper vertical="appointments" />);

    expect(await screen.findByText(/Appointment History/i)).toBeInTheDocument();
    expect(screen.getByText(/#A-201 · Dental Cleaning/i)).toBeInTheDocument();
  });
});
