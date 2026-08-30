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
  let symbolColor = '#FF5A36'; // Signal Orange default
  let textColor = '#171717';   // Midnight Ink default

  if (colorMode === 'dark') {
    symbolColor = '#FF5A36';
    textColor = '#FAFAF9';
  } else if (colorMode === 'monochrome-black') {
    symbolColor = '#171717';
    textColor = '#171717';
  } else if (colorMode === 'monochrome-white') {
    symbolColor = '#FAFAF9';
    textColor = '#FAFAF9';
  }

  // Symbol SVG rendering matching official ORBIT guide (3 signal nodes merging into loop)
  const SymbolSvg = ({ width = size, height = size }: { width?: number; height?: number }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Input signal nodes (3 dots on left) */}
      <circle cx="22" cy="24" r="8" fill={symbolColor} />
      <circle cx="16" cy="50" r="8" fill={symbolColor} />
      <circle cx="22" cy="76" r="8" fill={symbolColor} />

      {/* Curved converging signal paths into central loop */}
      <path
        d="M22 24 C 42 24, 48 38, 56 46
           C 66 56, 82 56, 82 40
           C 82 24, 62 24, 52 42
           C 42 60, 30 76, 22 76
           M16 50 C 32 50, 42 46, 54 44"
        stroke={symbolColor}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  // Standalone App Icon
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(6, Math.round(size * 0.22)),
          background: colorMode === 'dark' ? '#171717' : '#FF5A36',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(255, 90, 54, 0.25)',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0
        }}
      >
        <SymbolSvg width={size * 0.65} height={size * 0.65} />
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
