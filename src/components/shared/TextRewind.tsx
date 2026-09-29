import React, { useEffect, useState } from 'react';

// TextRewind — rotating hero words with a rewind cascade: the outgoing word's
// letters exit last-to-first (tape rewinding), the incoming word's cascade in
// first-to-last. Palette: word in signal-orange, static text inherits parent.
interface TextRewindProps {
  words: string[];
  intervalMs?: number;
  prefix?: string;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}

export function TextRewind({ words, intervalMs = 2800, prefix, style, wordStyle }: TextRewindProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (words.length < 2) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let outTimer: ReturnType<typeof setTimeout>;
    let inTimer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setPhase('out');
      outTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setPhase('in');
      }, 420);
      inTimer = setTimeout(tick, intervalMs);
    };
    inTimer = setTimeout(tick, intervalMs);
    return () => {
      clearTimeout(outTimer);
      clearTimeout(inTimer);
    };
  }, [words.length, intervalMs]);

  const word = words[index % words.length] || '';
  const letters = word.split('');

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, ...style }}>
      {prefix ? <span>{prefix}</span> : null}
      <span
        aria-live="polite"
        style={{
          display: 'inline-flex',
          overflow: 'hidden',
          color: 'var(--signal-orange)',
          fontWeight: 800,
          ...wordStyle,
        }}
      >
        {letters.map((ch, i) => {
          // Rewind: exit cascades from the LAST letter; enter cascades from first.
          const delay = phase === 'out' ? (letters.length - 1 - i) * 28 : i * 34;
          return (
            <span
              key={`${index}-${i}`}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                transform: phase === 'out' ? 'translateY(-110%)' : 'translateY(0)',
                opacity: phase === 'out' ? 0 : 1,
                transition: `transform 0.32s cubic-bezier(0.6,0,0.2,1) ${delay}ms, opacity 0.25s ease ${delay}ms`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    </span>
  );
}
