// Public legal pages: must render logged-out (Meta reviewers never sign in)
// and MUST contain the four review load-bearing statements.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Privacy } from '../Privacy';
import { Terms } from '../Terms';

function renderPublic(ui: React.ReactElement) {
  return render(<MemoryRouter initialEntries={['/privacy']}>{ui}</MemoryRouter>);
}

describe('Privacy', () => {
  it('renders with purpose, retention, deletion, and contact', () => {
    renderPublic(<Privacy />);
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    // Full-text assertions (some sentences span elements around the contact link).
    const body = (document.body.textContent || '').replace(/\s+/g, ' ');
    // purpose: what + why
    expect(body).toMatch(/message text customers send/i);
    // retention
    expect(body).toMatch(/retained for as long as/i);
    // deletion: token immediate + history window + request path
    expect(body).toMatch(/delete that channel's stored access token immediately/i);
    expect(body).toMatch(/deletion within 30 days/i);
    expect(body).toMatch(/verified requests are completed within 30 days/i);
    // contact: real address in every slot, never a placeholder
    const contacts = screen.getAllByRole('link', { name: /info@aimicromind.com/i });
    expect(contacts.length).toBeGreaterThan(0);
    for (const c of contacts) expect(c).toHaveAttribute('href', 'mailto:info@aimicromind.com');
    expect(body).not.toMatch(/orbit\.example/);
  });
});

describe('Terms', () => {
  it('renders and cross-links the privacy policy', () => {
    renderPublic(<Terms />);
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(/disconnecting a channel deletes/i)).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /privacy policy/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/privacy');
  });
});
