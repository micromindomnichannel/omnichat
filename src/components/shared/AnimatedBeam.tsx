import React, { useId } from 'react';

// AnimatedBeam — ORBIT port of the "beam demonstrates integration" concept.
// SVG diagram: channel nodes (left) → curved light-beams → ORBIT core → action
// node (right). Beams animate via stroke-dashoffset; glow dots travel each path
// with <animateMotion>. Zero dependencies. activeChannel spotlights one path.
interface ChannelNode {
  id: string;
  label: string;
  color: string;
}

const DEFAULT_CHANNELS: ChannelNode[] = [
  { id: 'messenger', label: 'Messenger', color: '#0099FF' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { id: 'telegram', label: 'Telegram', color: '#229ED9' },
  { id: 'gmail', label: 'Gmail', color: '#A8A29E' },
];

interface AnimatedBeamProps {
  channels?: ChannelNode[];
  activeChannel?: string | null;
  actionLabel?: string;
  style?: React.CSSProperties;
}

const W = 640;
const H = 380;
const CORE = { x: 360, y: 190, r: 52 };
const ACTION = { x: 572, y: 190 };

export function AnimatedBeam({
  channels = DEFAULT_CHANNELS,
  activeChannel = null,
  actionLabel = 'Business Action',
  style,
}: AnimatedBeamProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = channels.length;
  const ys = channels.map((_, i) => 40 + (i * (H - 80)) / Math.max(1, n - 1));

  const inbound = channels.map((ch, i) => {
    const y = ys[i];
    // Curve from channel node into the core's left edge.
    const d = `M 118 ${y} C 200 ${y}, 220 190, ${CORE.x - CORE.r + 6} 190`;
    return { ch, y, d };
  });
  const outboundD = `M ${CORE.x + CORE.r - 6} 190 C 440 190, 470 190, ${ACTION.x - 44} 190`;

  const beamClass = `orbit-beam-${uid}`;
  const lit = (id: string) => !activeChannel || activeChannel === id;

  return (
    <div style={{ width: '100%', ...style }}>
      <style>{`
        .${beamClass} { stroke-dasharray: 6 10; animation: ${beamClass}-flow 1.1s linear infinite; }
        .${beamClass}-slow { animation-duration: 2.6s; }
        @keyframes ${beamClass}-flow { to { stroke-dashoffset: -16; } }
        @media (prefers-reduced-motion: reduce) {
          .${beamClass} { animation: none; }
        }
      `}</style>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Channels converge through ORBIT into business actions">
        <defs>
          {inbound.map(({ ch }, i) => (
            <linearGradient key={ch.id} id={`${beamClass}-g${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={ch.color} stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FF5A36" stopOpacity="0.9" />
            </linearGradient>
          ))}
          <linearGradient id={`${beamClass}-out`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF5A36" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#52D8A4" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={`${beamClass}-core`} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#2E2E2E" />
            <stop offset="100%" stopColor="#171717" />
          </radialGradient>
        </defs>

        {/* Inbound beams */}
        {inbound.map(({ ch, y, d }, i) => (
          <g key={ch.id} opacity={lit(ch.id) ? 1 : 0.22}>
            <path d={d} fill="none" stroke="#E5E5E3" strokeWidth={2} />
            <path d={d} fill="none" stroke={`url(#${beamClass}-g${i})`} strokeWidth={2.5} strokeLinecap="round"
              className={`${beamClass}${lit(ch.id) ? '' : ` ${beamClass}-slow`}`} />
            {lit(ch.id) && (
              <circle r={4} fill={ch.color}>
                <animateMotion dur={`${2.2 + i * 0.35}s`} begin={`${-i * 0.5}s`} repeatCount="indefinite" path={d} />
              </circle>
            )}
          </g>
        ))}

        {/* Outbound beam */}
        <path d={outboundD} fill="none" stroke="#E5E5E3" strokeWidth={2} />
        <path d={outboundD} fill="none" stroke={`url(#${beamClass}-out)`} strokeWidth={2.5} strokeLinecap="round" className={beamClass} />
        <circle r={4.5} fill="#52D8A4">
          <animateMotion dur="1.8s" repeatCount="indefinite" path={outboundD} />
        </circle>

        {/* Channel nodes */}
        {inbound.map(({ ch, y }) => (
          <g key={ch.id} opacity={lit(ch.id) ? 1 : 0.45}>
            <circle cx={88} cy={y} r={17} fill="#FFFFFF" stroke={ch.color} strokeWidth={3} />
            <circle cx={88} cy={y} r={5} fill={ch.color} />
            <text x={88} y={y + 34} textAnchor="middle" fontSize={11} fontWeight={600} fill="#343434" fontFamily="Inter, sans-serif">
              {ch.label}
            </text>
          </g>
        ))}

        {/* ORBIT core */}
        <circle cx={CORE.x} cy={CORE.y} r={CORE.r} fill={`url(#${beamClass}-core)`} />
        <circle cx={CORE.x} cy={CORE.y} r={CORE.r} fill="none" stroke="#FF5A36" strokeWidth={2.5} opacity={0.85} />
        <circle cx={CORE.x - 24} cy={CORE.y - 20} r={6} fill="#FF5A36" />
        <circle cx={CORE.x - 30} cy={CORE.y} r={6} fill="#FF5A36" />
        <circle cx={CORE.x - 24} cy={CORE.y + 20} r={6} fill="#FF5A36" />
        <path d={`M ${CORE.x - 24} ${CORE.y - 20} C ${CORE.x - 5} ${CORE.y - 20}, ${CORE.x} ${CORE.y - 8}, ${CORE.x + 12} ${CORE.y - 4}`}
          stroke="#FF5A36" strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d={`M ${CORE.x - 30} ${CORE.y} L ${CORE.x + 2} ${CORE.y}`}
          stroke="#FF5A36" strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d={`M ${CORE.x - 24} ${CORE.y + 20} C ${CORE.x - 8} ${CORE.y + 18}, ${CORE.x + 2} ${CORE.y + 8}, ${CORE.x + 8} ${CORE.y}`}
          stroke="#FF5A36" strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d={`M ${CORE.x + 30} ${CORE.y - 28} A 30 30 0 1 1 ${CORE.x + 28} ${CORE.y - 6}`}
          stroke="#FF5A36" strokeWidth={5} strokeLinecap="round" fill="none" />
        <text x={CORE.x} y={CORE.y + CORE.r + 20} textAnchor="middle" fontSize={12} fontWeight={800} letterSpacing={2} fill="#171717" fontFamily="Inter, sans-serif">
          ORBIT
        </text>

        {/* Action node */}
        <rect x={ACTION.x - 44} y={ACTION.y - 30} width={88} height={60} rx={14} fill="#FFFFFF" stroke="#52D8A4" strokeWidth={3} />
        <circle cx={ACTION.x} cy={ACTION.y - 6} r={9} fill="#52D8A4" />
        <path d={`M ${ACTION.x - 4} ${ACTION.y - 6} L ${ACTION.x - 1} ${ACTION.y - 2} L ${ACTION.x + 5} ${ACTION.y - 11}`}
          stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x={ACTION.x} y={ACTION.y + 48} textAnchor="middle" fontSize={11} fontWeight={600} fill="#343434" fontFamily="Inter, sans-serif">
          {actionLabel}
        </text>
      </svg>
    </div>
  );
}
