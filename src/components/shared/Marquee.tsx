import React from 'react';

// Marquee — infinite proof strip (eloqwnt-style ticker) in ORBIT palette.
// Duplicated content looped with a CSS translateX animation; pause on hover,
// static under reduced motion.
interface MarqueeProps {
  items: string[];
  dark?: boolean;
  speedSeconds?: number;
  style?: React.CSSProperties;
}

export function Marquee({ items, dark = false, speedSeconds = 28, style }: MarqueeProps) {
  const row = [...items, ...items, ...items];
  const anim = `orbit-marquee-${dark ? 'dark' : 'light'}`;
  return (
    <div
      aria-label="ORBIT highlights"
      style={{
        overflow: 'hidden',
        background: dark ? 'var(--midnight-ink)' : 'var(--warm-sand)',
        borderTop: `1px solid ${dark ? '#242424' : 'var(--border)'}`,
        borderBottom: `1px solid ${dark ? '#242424' : 'var(--border)'}`,
        padding: '14px 0',
        ...style,
      }}
    >
      <style>{`
        @keyframes ${anim} { from { transform: translateX(0); } to { transform: translateX(-33.3333%); } }
        .${anim} { display: inline-flex; gap: 0; white-space: nowrap; animation: ${anim} ${speedSeconds}s linear infinite; will-change: transform; }
        .${anim}-wrap:hover .${anim} { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .${anim} { animation: none; } }
      `}</style>
      <div className={`${anim}-wrap`} style={{ display: 'flex' }}>
        <div className={anim}>
          {row.map((item, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 28px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: dark ? '#E5E5E3' : 'var(--graphite)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-orange)', flexShrink: 0 }} />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
