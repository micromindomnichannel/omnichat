import React from 'react';

// Dashboard kit: one visual language for every app page (matches the landing
// rebuild). Presentation only — no data logic lives here.
// Rules for reskin work: replace page headers with PageHeader, stat blocks with
// Stat, panels with Card, empty views with EmptyState, channel dots with
// ChannelDot. Never change behavior, routes, or data flow.

export function PageHeader({
  eyebrow,
  title,
  sub,
  live,
  actions,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  live?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="eyebrow" style={{ color: 'var(--burnt-coral)' }}>{eyebrow}</span>
          {live ? <LiveDot label="Live" /> : null}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        {sub ? <p style={{ fontSize: 14, color: 'var(--ink-600)', marginTop: 6, maxWidth: 640 }}>{sub}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

export function LiveDot({ label }: { label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <style>{`@keyframes orbit-live-ping { 0% { box-shadow: 0 0 0 0 rgba(255,90,54,0.45); } 70% { box-shadow: 0 0 0 7px rgba(255,90,54,0); } 100% { box-shadow: 0 0 0 0 rgba(255,90,54,0); } }`}</style>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--signal-orange)', animation: 'orbit-live-ping 1.8s ease-out infinite' }} />
      {label ? <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--signal-orange)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span> : null}
    </span>
  );
}

export function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h3 style={{ fontSize: 15, fontWeight: 750, color: 'var(--midnight-ink)', margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: 'up' | 'down' | 'neutral';
}) {
  const chip = tone === 'up'
    ? { bg: 'var(--success-bg)', fg: '#0F8357' }
    : tone === 'down'
      ? { bg: 'var(--danger-bg)', fg: 'var(--danger)' }
      : { bg: 'var(--surface-0)', fg: 'var(--ink-600)' };
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '18px 20px',
      boxShadow: 'var(--shadow-card)',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>{value}</span>
        {delta ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: chip.fg, background: chip.bg, padding: '3px 9px', borderRadius: 20 }}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const CHANNEL_COLORS: Record<string, string> = {
  messenger: '#0099FF',
  instagram: '#E4405F',
  whatsapp: '#25D366',
  telegram: '#229ED9',
  discord: '#5865F2',
  gmail: '#A8A29E',
  facebook: '#1877F2',
};

export function ChannelDot({ channel, label }: { channel: string; label?: string }) {
  const color = CHANNEL_COLORS[channel.toLowerCase()] || 'var(--stone-gray)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label ? <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-600)', textTransform: 'capitalize' }}>{label}</span> : null}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  copy,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--signal-orange-subtle)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        {icon}
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 750, color: 'var(--midnight-ink)', margin: '0 0 8px' }}>{title}</h4>
      <p style={{ fontSize: 13.5, color: 'var(--ink-600)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>{copy}</p>
      {action}
    </div>
  );
}
