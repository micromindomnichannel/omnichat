import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Demo } from '../Demo';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderDemo(vertical = 'commerce') {
  localStorage.setItem('orbit_user', JSON.stringify({ industry: vertical }));
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <StoreProvider>
        <VerticalProvider>
          <Demo />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Demo Modal', () => {
  it('walks through all 6 commerce steps in order and navigates to orders on final step', () => {
    renderDemo('commerce');

    const expectedCommerceSteps = [
      { title: 'Customer reaches out', desc: 'A customer comments on your Instagram post about a product.' },
      { title: 'AI responds automatically', desc: 'The AI detects a purchase question and replies with product details.' },
      { title: 'Stock check', desc: 'AI checks inventory and confirms availability in real-time.' },
      { title: 'Order creation', desc: 'Customer confirms intent and AI collects order details.' },
      { title: 'Confirmation', desc: 'Order is created and ready for fulfillment.' },
      { title: 'Logistics handoff', desc: 'Send order to logistics with one click.' }
    ];

    // Step 0: Back should be disabled
    const backBtn = screen.getByRole('button', { name: /back/i });
    expect(backBtn).toBeDisabled();

    // Verify step 0
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    expect(screen.getByText(expectedCommerceSteps[0].title)).toBeInTheDocument();
    expect(screen.getByText(expectedCommerceSteps[0].desc)).toBeInTheDocument();

    // Walk forward through steps 1 to 5
    for (let i = 1; i < expectedCommerceSteps.length; i++) {
      const nextBtn = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText(`Step ${i + 1} of 6`)).toBeInTheDocument();
      expect(screen.getByText(expectedCommerceSteps[i].title)).toBeInTheDocument();
      expect(screen.getByText(expectedCommerceSteps[i].desc)).toBeInTheDocument();
    }

    // Step 5: Final CTA is "Try it yourself" and navigates to /orders
    const tryBtn = screen.getByRole('button', { name: /try it yourself/i });
    fireEvent.click(tryBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  it('allows stepping backwards with Back button', () => {
    renderDemo('commerce');
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn); // Step 2
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /back/i });
    expect(backBtn).not.toBeDisabled();
    fireEvent.click(backBtn); // Back to step 1
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
  });

  it('close button (X) navigates to overview', () => {
    const { container } = renderDemo('commerce');
    const closeBtn = container.querySelector('button[style*="position: absolute"]');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });

  it('walks through all 6 appointments steps and navigates to appointments on completion', () => {
    renderDemo('appointments');

    const expectedApptSteps = [
      { title: 'Inquiry received', desc: 'A patient asks about a service via WhatsApp.' },
      { title: 'AI answers', desc: 'AI provides service details and pricing automatically.' },
      { title: 'Availability check', desc: 'AI checks the calendar for open slots.' },
      { title: 'Time selection', desc: 'Patient picks a convenient time slot.' },
      { title: 'Booking confirmed', desc: 'Appointment is booked and added to the schedule.' },
      { title: 'Follow-up ready', desc: 'Automated reminder is queued for the patient.' }
    ];

    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    expect(screen.getByText(expectedApptSteps[0].title)).toBeInTheDocument();

    for (let i = 1; i < expectedApptSteps.length; i++) {
      const nextBtn = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);
      expect(screen.getByText(`Step ${i + 1} of 6`)).toBeInTheDocument();
      expect(screen.getByText(expectedApptSteps[i].title)).toBeInTheDocument();
      expect(screen.getByText(expectedApptSteps[i].desc)).toBeInTheDocument();
    }

    const tryBtn = screen.getByRole('button', { name: /try it yourself/i });
    fireEvent.click(tryBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/appointments');
  });
});
