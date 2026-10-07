// AI workspace panel: ORBIT Core analyst status, knowledge status, and a safe
// test prompt. Read-only surfaces only (flow ids are not secrets; keys, tokens
// and vault material are never fetched or rendered).
import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { getMemberships } from '../../services/session';
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
  const [flows, setFlows] = useState<any[] | null>(null);
  const [prompt, setPrompt] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<{ text: string; source: string } | null>(null);
  const memberships = getMemberships();
  const [selectedWs, setSelectedWs] = useState(
    workspaceId || memberships[0]?.workspace_id || 'default'
  );

  useEffect(() => {
    let cancelled = false;
    api.adminMicromind().then((r) => { if (!cancelled && r) setMm(r); });
    api.getKnowledge(selectedWs).then((rows) => {
      if (!cancelled && Array.isArray(rows)) setKbCount(rows.length);
    });
    // Channel flow status + last AI test per flow (owner/admin surfaces;
    // null-safe for everyone else). Scoped to the selected workspace.
    api.adminFlows().then((rows) => {
      if (!cancelled && Array.isArray(rows)) {
        setFlows(rows.filter((f: any) => f.purpose === 'channel' || !f.purpose));
      }
    });
    return () => { cancelled = true; };
  }, [selectedWs]);

  const ask = async () => {
    if (!prompt.trim()) {
      showToast('Type a test question first', 'danger');
      return;
    }
    setAsking(true);
    const res = await api.askKnowledge(selectedWs, prompt.trim());
    setAsking(false);
    if (res?.answer) {
      setAnswer({ text: res.answer, source: res.source || 'unknown' });
    } else {
      showToast('Knowledge service unreachable', 'danger');
    }
  };

  const channelFlows = (flows || []).filter((f: any) => (f.purpose || 'channel') === 'channel');
  const wsOptions = memberships.map((m: any) => m.workspace_id).filter(Boolean);

  const analystLine = !mm
    ? 'Checking… (owner/admin only)'
    : mm.analyst?.flowSet
      ? `Configured (${mm.analyst?.override || 'env'})`
      : 'Not set — local fallback serves answers';

  return (
    <Card>
      <SectionTitle>ORBIT Core status</SectionTitle>
      {wsOptions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, maxWidth: 520 }}>
          <label htmlFor="aicore-ws" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)' }}>Workspace</label>
          <select
            id="aicore-ws" className="input" value={selectedWs}
            onChange={(e) => { setSelectedWs(e.target.value); setAnswer(null); }}
            style={{ flex: 1 }}
          >
            {wsOptions.map((w: string) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520, fontSize: 12.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Analyst flow (login workspace)</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)', textAlign: 'right' }}>{analystLine}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Tenant folder</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>
            {!mm ? '—' : mm.folder?.id ? `${mm.folder.status} (${String(mm.folder.id).slice(0, 8)}…)` : (mm.folder?.status || '—')}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Knowledge items ({selectedWs.slice(-6)})</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>{kbCount === null ? '—' : kbCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--ink-400)' }}>Fallback</span>
          <span style={{ fontWeight: 700, color: 'var(--midnight-ink)' }}>Local match always available</span>
        </div>
      </div>
      <div style={{ marginTop: 14, maxWidth: 520 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6 }}>
          Channel flows + last AI test (login workspace)
        </div>
        {flows === null ? (
          <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>Checking… (owner/admin only)</div>
        ) : channelFlows.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>No channel flows linked yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {channelFlows.map((f: any) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: 'var(--midnight-ink)', textTransform: 'capitalize' }}>{f.template || f.label || 'flow'}</span>
                <span style={{ color: f.status === 'active' ? '#0F8357' : 'var(--burnt-coral)', fontWeight: 700 }}>{f.status}</span>
                <span style={{ color: 'var(--ink-400)', marginLeft: 'auto' }}>
                  last test: {f.last_test_status || 'never'}
                </span>
              </div>
            ))}
          </div>
        )}
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
