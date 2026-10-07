// AI workspace panel: ORBIT Core analyst status, knowledge status, and a safe
// test prompt. Read-only surfaces only (flow ids are not secrets; keys, tokens
// and vault material are never fetched or rendered).
import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Card, SectionTitle } from '../dash/kit';

const SOURCE_LABEL: Record<string, string> = {
  micromind: '✅ MicroMind',
  'local-match': '🟡 Local match',
  none: '⚪ Unavailable',
};

export function AiCorePanel({ workspaceId, showToast }: {
  workspaceId: string;
  showToast: (msg: string, type?: 'success' | 'warning' | 'danger') => void;
}) {
  const [mm, setMm] = useState<any>(null);
  const [kbCount, setKbCount] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<{ text: string; source: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.adminMicromind().then((r) => { if (!cancelled && r) setMm(r); });
    api.getKnowledge(workspaceId).then((rows) => {
      if (!cancelled && Array.isArray(rows)) setKbCount(rows.length);
    });
    return () => { cancelled = true; };
  }, [workspaceId]);

  const ask = async () => {
    if (!prompt.trim()) {
      showToast('Type a test question first', 'danger');
      return;
    }
    setAsking(true);
    const res = await api.askKnowledge(workspaceId, prompt.trim());
    setAsking(false);
    if (res?.answer) {
      setAnswer({ text: res.answer, source: res.source || 'unknown' });
    } else {
      showToast('Knowledge service unreachable', 'danger');
    }
  };

  const analystLine = !mm
    ? 'Checking… (owner/admin only)'
    : mm.analyst?.flowSet
      ? `Configured (${mm.analyst?.override || 'env'})`
      : 'Not set — local fallback serves answers';

  return (
    <Card>
      <SectionTitle>ORBIT Core status</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520, fontSize: 12.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Analyst flow</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)', textAlign: 'right' }}>{analystLine}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Tenant folder</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>
            {!mm ? '—' : mm.folder?.id ? `${mm.folder.status} (${String(mm.folder.id).slice(0, 8)}…)` : (mm.folder?.status || '—')}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Knowledge items</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>{kbCount === null ? '—' : kbCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Fallback</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>Local match always available</span>
        </div>
      </div>
      <div style={{ marginTop: 14, maxWidth: 520 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} color="var(--signal-orange)" /> Safe test prompt
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input" value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
            placeholder="Ask what the AI would answer…"
            aria-label="Safe test prompt"
          />
          <button className="btn btn-primary" disabled={asking} onClick={ask} style={{ background: 'var(--signal-orange)', whiteSpace: 'nowrap' }}>
            {asking ? (<><Loader2 size={14} className="animate-spin" /> Asking…</>) : 'Ask'}
          </button>
        </div>
        {answer && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6 }}>
              {SOURCE_LABEL[answer.source] || answer.source}
            </div>
            <div style={{ fontSize: 13, color: 'var(--midnight-ink)', lineHeight: 1.6 }}>{answer.text}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
