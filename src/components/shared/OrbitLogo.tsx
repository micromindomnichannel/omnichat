import React from 'react';
import orbitLogo from '../../assets/orbit-logo.png';
import orbitLogoWhiteText from '../../assets/orbit-logo-white-text.png';

export interface OrbitLogoProps {
  variant?: 'primary' | 'horizontal' | 'icon';
  colorMode?: 'default' | 'dark' | 'monochrome-black' | 'monochrome-white';
  theme?: 'light' | 'dark';
  size?: number;
  width?: number | string;
  height?: number | string;
  showTagline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function OrbitLogo({
  size = 32,
  width,
  height,
  colorMode = 'default',
  theme,
  className = '',
  style,
  onClick
}: OrbitLogoProps) {
  const isDark = theme === 'dark' || colorMode === 'dark';
  const logoSrc = isDark ? orbitLogoWhiteText : orbitLogo;
  const w = width ?? size;
  const h = height ?? size;
  return (
    <img
      src={logoSrc}
      alt="ORBIT"
      style={{
        width: w,
        height: h,
        objectFit: 'contain',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        ...style
      }}
      className={className}
      onClick={onClick}
    />
  );
}

