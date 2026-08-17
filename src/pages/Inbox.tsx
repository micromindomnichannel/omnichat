import React, { useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { ConversationThread } from '../components/inbox/ConversationThread';
import { ContextPanel } from '../components/inbox/ContextPanel';

export function Inbox() {
  const [selectedId, setSelectedId] = useState<string | null>('conv1');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 112px)', margin: -24, background: 'var(--surface-1)' }}>
      <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
      <ConversationThread conversationId={selectedId || ''} />
      <div className="hide-below-1180">
        <ContextPanel conversationId={selectedId || ''} />
      </div>
    </div>
  );
}
