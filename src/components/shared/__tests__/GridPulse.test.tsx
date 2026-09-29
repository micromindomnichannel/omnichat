import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GridPulse } from '../GridPulse';

describe('GridPulse', () => {
  it('renders an absolute, non-interactive canvas', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 400, height: 300 }}>
        <GridPulse variant="light" />
      </div>
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas?.style.position).toBe('absolute');
    expect(canvas?.style.pointerEvents).toBe('none');
  });

  it('supports the dark variant without crashing', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 400, height: 300 }}>
        <GridPulse variant="dark" cell={32} radius={100} />
      </div>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
