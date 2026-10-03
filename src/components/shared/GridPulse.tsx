import React, { useEffect, useRef } from 'react';

// GridPulse — ORBIT port of the "grid pulse" concept (hairline grid that lights
// up where the pointer passes, then fades). Zero dependencies: canvas + rAF,
// palette-locked to ORBIT tokens (signal-orange → burnt-coral spectrum).
// Props:
//   variant: 'light' (cloud-white surfaces) | 'dark' (midnight-ink surfaces)
//   cell: grid cell size in px (default 44)
//   radius: pulse radius in px (default 140)
//   decay: per-frame intensity retention 0..1 (default 0.94 — lower = faster fade)
//   maxAlpha: peak glow alpha (default 0.28)
interface GridPulseProps {
  variant?: 'light' | 'dark';
  cell?: number;
  radius?: number;
  decay?: number;
  maxAlpha?: number;
  style?: React.CSSProperties;
}

export function GridPulse({
  variant = 'light',
  cell = 44,
  radius = 140,
  decay = 0.94,
  maxAlpha = 0.28,
  style,
}: GridPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dark = variant === 'dark';
    const lineBase = dark ? '23,23,23' : '23,23,23';
    const lineAlpha = dark ? 0.16 : 0.07;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let heat: Float32Array = new Float32Array(0);
    let raf = 0;
    let running = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      cols = Math.ceil(w / cell) + 1;
      rows = Math.ceil(h / cell) + 1;
      heat = new Float32Array(cols * rows);
    };

    const paint = (px: number, py: number) => {
      const gr = Math.ceil(radius / cell);
      const cx = Math.floor(px / cell);
      const cy = Math.floor(py / cell);
      for (let y = Math.max(0, cy - gr); y <= Math.min(rows - 1, cy + gr); y++) {
        for (let x = Math.max(0, cx - gr); x <= Math.min(cols - 1, cx + gr); x++) {
          const dx = x * cell - px;
          const dy = y * cell - py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > radius) continue;
          const v = 1 - d / radius;
          const i = y * cols + x;
          // Spectrum across the radius: hot signal-orange core → burnt-coral edge.
          heat[i] = Math.min(1, heat[i] + v * v);
        }
      }
      kick();
    };

    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      // Hairlines.
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${lineBase},${lineAlpha})`;
      ctx.beginPath();
      for (let x = 0; x <= cols; x++) {
        ctx.moveTo(x * cell + 0.5, 0);
        ctx.lineTo(x * cell + 0.5, h);
      }
      for (let y = 0; y <= rows; y++) {
        ctx.moveTo(0, y * cell + 0.5);
        ctx.lineTo(w, y * cell + 0.5);
      }
      ctx.stroke();
      // Heat glow per cell.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const v = heat[i];
          if (v < 0.01) continue;
          alive = true;
          const a = v * maxAlpha;
          const g = ctx.createRadialGradient(x * cell, y * cell, 0, x * cell, y * cell, cell * 1.4);
          g.addColorStop(0, `rgba(255,90,54,${a})`);
          g.addColorStop(1, `rgba(217,76,50,0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x * cell - cell * 1.4, y * cell - cell * 1.4, cell * 2.8, cell * 2.8);
          heat[i] = v * decay;
        }
      }
      if (alive) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        ctx.clearRect(0, 0, w, h);
        // Repaint bare hairlines once so the grid never vanishes.
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${lineBase},${lineAlpha})`;
        ctx.beginPath();
        for (let x = 0; x <= cols; x++) {
          ctx.moveTo(x * cell + 0.5, 0);
          ctx.lineTo(x * cell + 0.5, h);
        }
        for (let y = 0; y <= rows; y++) {
          ctx.moveTo(0, y * cell + 0.5);
          ctx.lineTo(w, y * cell + 0.5);
        }
        ctx.stroke();
      }
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      paint(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onLeave = () => kick();

    // Respect reduced motion: static hairlines, no pulse loop.
    const reduced = typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resize();
    frame();
    running = false;
    cancelAnimationFrame(raf);
    if (!reduced) {
      parent.addEventListener('pointermove', onMove);
      parent.addEventListener('pointerleave', onLeave);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => {
      cancelAnimationFrame(raf);
      running = false;
      ro.disconnect();
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
    };
  }, [variant, cell, radius, decay, maxAlpha]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    />
  );
}
