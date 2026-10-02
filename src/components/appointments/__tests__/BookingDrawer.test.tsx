import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';
import { Toast } from '../../../components/shared/Toast';
import { BookingDrawer } from '../BookingDrawer';

const mockCustomer = {
  id: 'c1',
  name: 'Mariam Khalil',
  phone: '+20 100 555 1234',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'
};

const mockService = {
  id: 'srv1',
  name: 'Dental Cleaning & Consultation',
  price: 600,
  duration: 45
};

function renderBookingDrawer(onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <BookingDrawer customerId="c1" onClose={onClose} />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('BookingDrawer flow and validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            customers: [mockCustomer],
            services: [mockService],
            appointments: []
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('gates appointment confirmation until service, time slot, name, and phone are provided', async () => {
    renderBookingDrawer();

    expect(await screen.findByText('Dental Cleaning & Consultation — From 600 EGP')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirm appointment/i });
    expect(confirmBtn).toBeDisabled();

    // Select service
    const serviceSelect = screen.getByRole('combobox');
    fireEvent.change(serviceSelect, { target: { value: 'srv1' } });
    expect(confirmBtn).toBeDisabled();

    // Select time slot
    const timeBtn = screen.getByRole('button', { name: '11:00' });
    fireEvent.click(timeBtn);
    expect(confirmBtn).toBeDisabled();

    // Enter full name
    const nameInput = screen.getByPlaceholderText(/full name \*/i);
    fireEvent.change(nameInput, { target: { value: 'Mariam Khalil' } });
    expect(confirmBtn).toBeDisabled();

    // Enter phone
    const phoneInput = screen.getByPlaceholderText(/phone number \*/i);
    fireEvent.change(phoneInput, { target: { value: '01005551234' } });

    expect(confirmBtn).not.toBeDisabled();
  });

  it('selects appointment date and time slots', async () => {
    renderBookingDrawer();

    expect(await screen.findByText('Dental Cleaning & Consultation — From 600 EGP')).toBeInTheDocument();

    const time1330 = screen.getByRole('button', { name: '13:30' });
    fireEvent.click(time1330);
    expect(time1330).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  it('completes appointment booking and renders success confirmation', async () => {
    const onClose = vi.fn();
    renderBookingDrawer(onClose);

    expect(await screen.findByText('Dental Cleaning & Consultation — From 600 EGP')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'srv1' } });
    fireEvent.click(screen.getByRole('button', { name: '09:30' }));
    fireEvent.change(screen.getByPlaceholderText(/full name \*/i), { target: { value: 'Mariam Khalil' } });
    fireEvent.change(screen.getByPlaceholderText(/phone number \*/i), { target: { value: '01005551234' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm appointment/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByRole('heading', { name: /confirmed/i })).toBeInTheDocument();
    const doneBtn = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
