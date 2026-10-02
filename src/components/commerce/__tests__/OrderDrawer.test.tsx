import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';
import { Toast } from '../../../components/shared/Toast';
import { OrderDrawer } from '../OrderDrawer';

const mockCustomer = {
  id: 'c1',
  name: 'Sara Ahmed',
  phone: '+20 100 123 4567',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
};

const mockProduct = {
  id: 'prod1',
  name: 'Black Leather Bag',
  price: 850,
  stock: 12,
  variants: [
    { name: 'Standard', available: true },
    { name: 'Limited Gold', available: false }
  ]
};

function renderOrderDrawer(onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <OrderDrawer customerId="c1" onClose={onClose} />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('OrderDrawer flow and validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            customers: [mockCustomer],
            products: [mockProduct],
            orders: []
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('gates order confirmation button until all required fields are filled', async () => {
    renderOrderDrawer();

    expect(await screen.findByText('Black Leather Bag — 850 EGP')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirm order/i });
    expect(confirmBtn).toBeDisabled();

    // Select Product
    const productSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(productSelect, { target: { value: 'prod1' } });
    expect(confirmBtn).toBeDisabled();

    // Fill Name
    const nameInput = screen.getByPlaceholderText(/full name \*/i);
    fireEvent.change(nameInput, { target: { value: 'Sara Ahmed' } });
    expect(confirmBtn).toBeDisabled();

    // Fill Phone
    const phoneInput = screen.getByPlaceholderText(/phone number \*/i);
    fireEvent.change(phoneInput, { target: { value: '01001234567' } });
    expect(confirmBtn).toBeDisabled();

    // Fill Governorate
    const govSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(govSelect, { target: { value: 'Cairo' } });
    expect(confirmBtn).toBeDisabled();

    // Fill Address
    const addressInput = screen.getByPlaceholderText(/address \*/i);
    fireEvent.change(addressInput, { target: { value: '14 Zamalek St, Apt 4' } });

    expect(confirmBtn).not.toBeDisabled();
  });

  it('updates total price when quantity changes (unit price * qty + 50 EGP delivery fee)', async () => {
    renderOrderDrawer();

    expect(await screen.findByText('Black Leather Bag — 850 EGP')).toBeInTheDocument();
    const productSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(productSelect, { target: { value: 'prod1' } });

    // Base total: 850 * 1 + 50 = 900 EGP
    expect(screen.getByText('900 EGP')).toBeInTheDocument();

    // Increase quantity to 2: 850 * 2 + 50 = 1,750 EGP
    const plusBtn = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusBtn);
    expect(screen.getByText('1,750 EGP')).toBeInTheDocument();

    // Decrease quantity back to 1
    const minusBtn = screen.getByRole('button', { name: '-' });
    fireEvent.click(minusBtn);
    expect(screen.getByText('900 EGP')).toBeInTheDocument();

    // Decreasing below 1 remains 1
    fireEvent.click(minusBtn);
    expect(screen.getByText('900 EGP')).toBeInTheDocument();
  });

  it('disables unavailable variants and allows selecting available variants', async () => {
    renderOrderDrawer();

    expect(await screen.findByText('Black Leather Bag — 850 EGP')).toBeInTheDocument();
    const productSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(productSelect, { target: { value: 'prod1' } });

    const standardVariant = screen.getByRole('button', { name: 'Standard' });
    const limitedVariant = screen.getByRole('button', { name: 'Limited Gold' });

    expect(standardVariant).not.toBeDisabled();
    expect(limitedVariant).toBeDisabled();

    fireEvent.click(standardVariant);
  });

  it('completes order submission, advances to success step, and sends to logistics', async () => {
    const onClose = vi.fn();
    renderOrderDrawer(onClose);

    expect(await screen.findByText('Black Leather Bag — 850 EGP')).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'prod1' } });
    fireEvent.change(screen.getByPlaceholderText(/full name \*/i), { target: { value: 'Sara Ahmed' } });
    fireEvent.change(screen.getByPlaceholderText(/phone number \*/i), { target: { value: '01001234567' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Cairo' } });
    fireEvent.change(screen.getByPlaceholderText(/address \*/i), { target: { value: '14 Zamalek St' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm order/i });
    fireEvent.click(confirmBtn);

    // Success step
    expect(await screen.findByText(/created successfully/i)).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();

    // Logistics action
    const logisticsBtn = screen.getByRole('button', { name: /send to logistics/i });
    fireEvent.click(logisticsBtn);

    expect(await screen.findByText('Sent to logistics — simulated')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });
});
