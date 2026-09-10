import React, { useState, useEffect } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { ConversationThread } from '../components/inbox/ConversationThread';
import { ContextPanel } from '../components/inbox/ContextPanel';
import { useStore } from '../state/store';
import { api } from '../services/api';

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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 112px)', margin: -24, background: 'var(--surface-1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {state.dbOnline === false && (
          <div style={{ padding: '8px 16px', background: 'var(--danger-bg)', color: 'var(--burnt-coral)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
            Backend unreachable — showing last synced state. New messages will appear once reconnected.
          </div>
        )}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
          <ConversationThread conversationId={selectedId || ''} />
          <div className="hide-below-1180">
            <ContextPanel conversationId={selectedId || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
