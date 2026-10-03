import React from 'react';

interface OrbitLogoProps {
  variant?: 'primary' | 'horizontal' | 'icon';
  colorMode?: 'default' | 'dark' | 'monochrome-black' | 'monochrome-white';
  size?: number;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export function OrbitLogo({
  variant = 'horizontal',
  colorMode = 'default',
  size = 32,
  showTagline = false,
  className = '',
  onClick
}: OrbitLogoProps) {
  // Determine color palette based on mode
  let symbolColor = '#2563EB'; // Signal Orange default
  let textColor = '#171717';   // Midnight Ink default

  if (colorMode === 'dark') {
    symbolColor = '#2563EB';
    textColor = '#FAFAF9';
  } else if (colorMode === 'monochrome-black') {
    symbolColor = '#171717';
    textColor = '#171717';
  } else if (colorMode === 'monochrome-white') {
    symbolColor = '#FAFAF9';
    textColor = '#FAFAF9';
  }

  // Symbol SVG: three signal nodes flowing into an open loop (2026 mark).
  // Dots left; tapered-feel converging strokes; large ring with a lower-left
  // gap where the rising stroke enters. viewBox 200x160 (wide mark).
  const SymbolSvg = ({ width = size, height = size, color = symbolColor }: { width?: number; height?: number; color?: string }) => (
    <svg
      width={width}
      height={(height * 0.8)}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Signal nodes */}
      <circle cx="52" cy="38" r="17" fill={color} />
      <circle cx="38" cy="80" r="17" fill={color} />
      <circle cx="52" cy="122" r="17" fill={color} />
      {/* Converging flows */}
      <path
        d="M52 38 C 80 38, 92 48, 108 58"
        stroke={color}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 80 L 104 80"
        stroke={color}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M52 122 C 75 118, 88 100, 100 84"
        stroke={color}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      {/* Open loop: 330° arc, gap at lower-left */}
      <path
        d="M101.9 62.3 A42 42 0 1 1 98.2 83.7"
        stroke={color}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  // Standalone App Icon
  if (variant === 'icon') {
    const bg = colorMode === 'dark' ? '#171717' : '#2563EB';
    // Symbol must contrast the tile: white on the orange tile, orange on dark.
    const mark = bg === '#2563EB' ? '#FFFFFF' : symbolColor;
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(6, Math.round(size * 0.22)),
          background: bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0
        }}
      >
        <SymbolSvg width={size * 0.65} height={size * 0.65} color={mark} />
      </div>
    );
  }

  // Primary Vertical Lockup (Symbol above wordmark)
  if (variant === 'primary') {
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: Math.round(size * 0.25),
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none'
        }}
      >
        <SymbolSvg width={size * 1.5} height={size * 1.5} />
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: Math.round(size * 0.75),
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: textColor,
            lineHeight: 1,
            display: 'block'
          }}>
            ORBIT
          </span>
          {showTagline && (
            <span style={{
              fontSize: Math.max(10, Math.round(size * 0.28)),
              fontWeight: 600,
              color: colorMode === 'dark' ? '#A8A29E' : '#343434',
              letterSpacing: '0.04em',
              marginTop: 4,
              display: 'block',
              textTransform: 'uppercase'
            }}>
              Powered Omnichannel Platform
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Lockup (Symbol + ORBIT Wordmark)
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.32),
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      <SymbolSvg width={size} height={size} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: Math.round(size * 0.68),
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: textColor,
          lineHeight: 1
        }}>
          ORBIT
        </span>
        {showTagline && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: colorMode === 'dark' ? '#A8A29E' : '#A8A29E',
            letterSpacing: '0.04em',
            marginTop: 2
          }}>
            Omnichannel Engine
          </span>
        )}
      </div>
    </div>
  );
}
