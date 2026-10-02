import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Landing } from '../Landing';

function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname}</span>;
}

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LocationProbe />
      <Landing />
    </MemoryRouter>
  );
}

describe('Landing', () => {
  it('renders header nav with working anchors (no dead #workflow link)', () => {
    const { container } = renderLanding();
    const anchors = Array.from(container.querySelectorAll('header a[href^="#"]'));
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) {
      const id = (a.getAttribute('href') || '').slice(1);
      expect(container.querySelector(`#${CSS.escape(id)}`),
        `anchor #${id} must have a target section`).not.toBeNull();
    }
  });

  it('hero CTAs navigate to signup and login', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));
    expect(screen.getByTestId('location').textContent).toBe('/signup');
  });

  it('proof marquee renders capability claims', () => {
    renderLanding();
    expect(screen.getAllByText(/one inbox for every channel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/encrypted credential vault/i).length).toBeGreaterThan(0);
  });

  it('channel selector swaps the concept copy and spotlights the beam', () => {
    const { container } = renderLanding();
    // Default is instagram (SKU story present).
    expect(screen.getByText(/matched product SKU #1049/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /whatsapp signal/i }));
    expect(screen.getByText(/synced doctor agenda/i)).toBeInTheDocument();
    // Beam diagram present with the ORBIT core (scoped to the diagram svg).
    const beam = container.querySelector('svg[aria-label]');
    expect(beam).not.toBeNull();
    expect(beam!.textContent).toMatch(/ORBIT/);
  });

  it('vertical tabs swap the engine preview', () => {
    renderLanding();
    expect(screen.getByText(/automate instagram dm sales/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /clinics & appointments/i }));
    expect(screen.getByText(/automate patient consultations/i)).toBeInTheDocument();
  });

  it('FAQ accordion opens one answer at a time', () => {
    renderLanding();
    expect(screen.queryByText(/AES-256 encrypted at rest/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /is my page token safe\?/i }));
    expect(screen.getByText(/AES-256 encrypted at rest/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /which channels work today\?/i }));
    expect(screen.queryByText(/AES-256 encrypted at rest/i)).toBeNull();
    expect(screen.getByText(/bring-your-own-flow/i)).toBeInTheDocument();
  });

  it('footer links to legal pages', () => {
    renderLanding();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });
});
