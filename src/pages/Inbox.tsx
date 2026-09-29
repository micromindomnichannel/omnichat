import React, { useState, useEffect } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { ConversationThread } from '../components/inbox/ConversationThread';
import { ContextPanel } from '../components/inbox/ContextPanel';
import { PageHeader, ChannelDot, EmptyState as KitEmptyState } from '../components/dash/kit';
import { useStore } from '../state/store';
import { api } from '../services/api';
import { MessageSquare, MessagesSquare } from 'lucide-react';

const POLL_MS = 10000;

export function Inbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { state, dispatch } = useStore();

  // Realtime sync: refresh list + open thread while the inbox is mounted.
  // Silent no-ops when the backend is unreachable (api returns null).
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const convs = await api.getConversations();
      if (!cancelled && convs) dispatch({ type: 'SET_CONVERSATIONS', conversations: convs });
      if (selectedId) {
        const msgs = await api.getThreadMessages(selectedId);
        if (!cancelled && msgs) dispatch({ type: 'SET_THREAD_MESSAGES', conversationId: selectedId, messages: msgs });
      }
    };
    sync();
    const timer = setInterval(sync, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selectedId]);

  const conversations = state.conversations || [];
  const unreadCount = conversations.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0);
  const channels = Array.from(new Set(conversations.map(c => c.channel).filter(Boolean)));

  return (
    <div style={{ margin: -24, background: 'var(--surface-1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <PageHeader
          eyebrow="Conversations"
          title="Inbox"
          sub={`${conversations.length} threads${unreadCount > 0 ? ` · ${unreadCount} unread` : ''} · synced with live backend`}
          live
          actions={
            <>
              {channels.map(ch => (
                <ChannelDot key={ch} channel={ch} label={ch} />
              ))}
            </>
          }
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {state.dbOnline === false && (
          <div style={{ padding: '8px 16px', background: 'var(--danger-bg)', color: 'var(--burnt-coral)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
            Backend unreachable — showing last synced state. New messages will appear once reconnected.
          </div>
        )}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, height: 'calc(100vh - 112px)' }}>
          <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
          {selectedId ? (
            <ConversationThread conversationId={selectedId || ''} />
          ) : conversations.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', minWidth: 0 }}>
              <KitEmptyState
                icon={<MessageSquare size={24} color="var(--signal-orange)" />}
                title="No conversations yet"
                copy="Customer threads will appear here once messages arrive from connected channels."
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', minWidth: 0 }}>
              <KitEmptyState
                icon={<MessagesSquare size={24} color="var(--signal-orange)" />}
                title="Select a conversation"
                copy="Pick a thread from the list to read the full history and reply. AI and human messages keep their current styling inside the thread."
              />
            </div>
          )}
          <div className="hide-below-1180">
            <ContextPanel conversationId={selectedId || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
