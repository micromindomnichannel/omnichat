import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedBeam } from '../AnimatedBeam';
import { TextRewind } from '../TextRewind';

describe('AnimatedBeam', () => {
  it('renders channel nodes converging into the ORBIT core with accessible role and aria-label', () => {
    const { container } = render(<AnimatedBeam activeChannel={null} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toMatch(/converge/i);
    for (const label of ['Messenger', 'Instagram', 'WhatsApp', 'Telegram', 'Gmail']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('ORBIT')).toBeInTheDocument();
    expect(screen.getByText('Business Action')).toBeInTheDocument();
  });

  it('spotlights the active channel path', () => {
    const { container } = render(<AnimatedBeam activeChannel="instagram" />);
    expect(container.querySelectorAll('text').length).toBeGreaterThanOrEqual(7);
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });
});

describe('TextRewind', () => {
  it('shows the first word with the prefix and carries aria-live=polite', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<TextRewind prefix="Wired for" words={['Messenger', 'Instagram']} />);
      expect(screen.getByText('Wired for')).toBeInTheDocument();
      const liveSpan = container.querySelector('[aria-live="polite"]');
      expect(liveSpan).toBeInTheDocument();
      expect((container.textContent || '').replace(/\s+/g, ' ')).toMatch(/Wired for\s*Messenger/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cycles through words over timer intervals', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<TextRewind prefix="Wired for" words={['Messenger', 'Instagram', 'WhatsApp']} intervalMs={1000} />);
      expect((container.textContent || '').replace(/\s+/g, ' ')).toMatch(/Messenger/);

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect((container.textContent || '').replace(/\s+/g, ' ')).toMatch(/Instagram/);

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect((container.textContent || '').replace(/\s+/g, ' ')).toMatch(/WhatsApp/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders statically when prefers-reduced-motion is active', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.useFakeTimers();
    try {
      const { container } = render(<TextRewind words={['Messenger', 'Instagram']} intervalMs={1000} />);
      expect((container.textContent || '').replace(/\s+/g, '')).toContain('Messenger');

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      // Should remain on first word because reduced-motion is preferred
      expect((container.textContent || '').replace(/\s+/g, '')).toContain('Messenger');
    } finally {
      vi.useRealTimers();
      window.matchMedia = originalMatchMedia;
    }
  });

  it('renders a single word statically', () => {
    const { container } = render(<TextRewind words={['Gmail']} />);
    expect((container.textContent || '').replace(/\s+/g, '')).toContain('Gmail');
  });
});
