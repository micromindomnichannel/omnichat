import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedBeam } from '../AnimatedBeam';
import { TextRewind } from '../TextRewind';

describe('AnimatedBeam', () => {
  it('renders channel nodes converging into the ORBIT core', () => {
    const { container } = render(<AnimatedBeam activeChannel={null} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('aria-label')).toMatch(/converge/i);
    for (const label of ['Messenger', 'Instagram', 'WhatsApp', 'Telegram', 'Gmail']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('ORBIT')).toBeInTheDocument();
    expect(screen.getByText('Business Action')).toBeInTheDocument();
  });

  it('spotlights the active channel path', () => {
    const { container } = render(<AnimatedBeam activeChannel="instagram" />);
    // Inactive groups render dimmed; the svg still carries all five nodes.
    expect(container.querySelectorAll('text').length).toBeGreaterThanOrEqual(7);
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });
});

describe('TextRewind', () => {
  it('shows the first word with the prefix', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<TextRewind prefix="Wired for" words={['Messenger', 'Instagram']} />);
      expect(screen.getByText('Wired for')).toBeInTheDocument();
      // Letters render in per-letter spans: assert on normalized full text.
      expect((container.textContent || '').replace(/\s+/g, ' ')).toMatch(/Wired for\s*Messenger/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders a single word statically', () => {
    const { container } = render(<TextRewind words={['Gmail']} />);
    expect((container.textContent || '').replace(/\s+/g, '')).toContain('Gmail');
  });
});
