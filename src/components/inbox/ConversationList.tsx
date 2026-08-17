import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { ChannelBadge } from '../../components/shared/ChannelIcon';
import { Search } from 'lucide-react';

const filters = ['All', 'Unread', 'AI Handling', 'Needs Human', 'High Intent', 'Converted'];

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const { state } = useStore();
  const { accentColor } = useVertical();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = state.conversations.filter(conv => {
    const customer = state.customers.find(c => c.id === conv.customerId);
    const matchesSearch = !searchQuery || 
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (activeFilter === 'Unread') matchesFilter = conv.unreadCount > 0;
    else if (activeFilter === 'AI Handling') matchesFilter = conv.status === 'ai_handling';
    else if (activeFilter === 'Needs Human') matchesFilter = conv.status === 'human' || conv.status === 'escalated';
    else if (activeFilter === 'High Intent') matchesFilter = conv.intent === 'purchase' || conv.intent === 'booking';
    else if (activeFilter === 'Converted') matchesFilter = conv.status === 'resolved';

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{
      width: 320,
      minWidth: 320,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Search */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: 34, padding: '0 10px 0 30px',
              borderRadius: 6, border: '1px solid var(--border)',
              fontSize: 12, background: 'var(--surface-0)', outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '4px 10px', borderRadius: 14, border: '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeFilter === filter ? accentColor : 'transparent',
                color: activeFilter === filter ? 'white' : 'var(--ink-600)'
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map(conv => {
          const customer = state.customers.find(c => c.id === conv.customerId);
          const isSelected = conv.id === selectedId;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              style={{
                width: '100%', padding: '12px 16px', border: 'none',
                borderBottom: '1px solid var(--border)',
                background: isSelected ? 'var(--surface-0)' : 'transparent',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: 'pointer', textAlign: 'left',
                position: 'relative', transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-0)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 32, background: accentColor, borderRadius: '0 2px 2px 0'
                }} />
              )}

              {/* Avatar with channel badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={customer?.avatar}
                  alt={customer?.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <ChannelBadge channel={conv.channel} size={14} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }} className="truncate">
                    {customer?.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                    {conv.lastMessageTime}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ink-600)' }} className="truncate">
                  {conv.lastMessage}
                </p>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {conv.unreadCount > 0 ? (
                  <span style={{
                    background: '#C22E2E', color: 'white', fontSize: 11, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center'
                  }}>
                    {conv.unreadCount}
                  </span>
                ) : (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10.5, fontWeight: 600,
                    color: conv.status === 'ai_handling' ? accentColor : 'var(--ink-600)'
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: conv.status === 'ai_handling' ? accentColor : conv.status === 'human' ? 'var(--ink-900)' : 'var(--ink-400)'
                    }} />
                    {conv.status === 'ai_handling' ? 'AI' : conv.status === 'human' ? 'Human' : 'Resolved'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
