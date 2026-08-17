import React from 'react';
import type { Channel } from '../../state/mockData';
import { CHANNEL_COLORS } from '../../state/mockData';
import { Instagram, MessageCircle, Facebook, Music, Globe } from 'lucide-react';

const iconMap: Record<Channel, React.ElementType> = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  facebook: Facebook,
  tiktok: Music,
  website: Globe
};

interface ChannelIconProps {
  channel: Channel;
  size?: number;
  showLabel?: boolean;
}

export function ChannelIcon({ channel, size = 16, showLabel = false }: ChannelIconProps) {
  const Icon = iconMap[channel];
  const color = CHANNEL_COLORS[channel];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={size} color={color} strokeWidth={1.5} />
      {showLabel && (
        <span style={{ fontSize: 12, color: 'var(--ink-600)', fontWeight: 500 }}>
          {channel.charAt(0).toUpperCase() + channel.slice(1)}
        </span>
      )}
    </span>
  );
}

export function ChannelBadge({ channel, size = 14 }: { channel: Channel; size?: number }) {
  const Icon = iconMap[channel];
  const color = CHANNEL_COLORS[channel];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: 'white',
      position: 'absolute',
      bottom: 0,
      right: 0,
      border: '2px solid var(--surface-1)'
    }}>
      <Icon size={size * 0.55} color="white" strokeWidth={2.5} />
    </span>
  );
}
