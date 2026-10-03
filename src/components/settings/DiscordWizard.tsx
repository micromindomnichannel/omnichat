// DiscordWizard: guided "Connect Discord Bot" setup.
// Bot creation happens in the Discord Developer Portal (external step);
// everything after the paste is automatic (token validation, vault, flow,
// gateway listener, test ping). No webhook exists for Discord — intake runs
// over the gateway listener started at connect (and at server boot).
import React, { useState } from 'react';
import { Bot, ExternalLink, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const PORTAL_URL = 'https://discord.com/developers/applications';

const CREATE_STEPS: Array<{ cmd?: string; text: string }> = [
  { text: 'Create an application, then open its Bot page.' },
  { text: 'Reset Token and copy the bot token.' },
  { text: 'Under Privileged Gateway Intents, turn on Message Content Intent (required — without it the bot cannot read messages).' },
  { text: 'Open OAuth2 → URL Generator, tick scopes bot plus permissions View Channel, Read History, Send Messages — then open the generated URL to invite the bot to your server.' },
];

export function DiscordWizard({ workspaceId, showToast, onDone }: {
  workspaceId: string;
  showToast: (msg: string, type?: 'success' | 'warning' | 'danger') => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'create' | 'token' | 'done'>('create');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!token.trim()) {
      showToast('Paste the bot token from the Developer Portal first', 'danger');
      return;
    }
    setBusy(true);
    const res = await api.connectChannel(workspaceId, 'discord', { botToken: token.trim() });
    setBusy(false);
    if (res?.account) {
      setResult(res);
      setStep('done');
      const t = res?.test?.status ? ` — test ${String(res.test.status).replace(/_/g, ' ')}` : '';
      showToast(`discord ${res.status}${t}`, res?.test && res.test.status !== 'test_ok' && res.test.status !== 'skipped' ? 'warning' : 'success');
    } else {
      showToast(res?.error || 'Connect failed (discord)', 'danger');
    }
  };

  const runTest = async () => {
    if (!result?.account?.id) return;
    setTesting(true);
    const res = await api.testChannel(result.account.id);
    setTesting(false);
    if (res?.test) {
      showToast(`discord test: ${String(res.test.status).replace(/_/g, ' ')}`, res.test.status === 'test_ok' ? 'success' : 'warning');
    } else {
      showToast(res?.error || 'Test failed', 'danger');
    }
  };

  const botName = result?.account?.username ? `@${result.account.username}` : 'your bot';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bot size={16} color="#5865F2" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>
          Connect Discord Bot
        </span>
        <span style={{ fontSize: 11, color: 'var(--stone-gray)', marginLeft: 'auto' }}>
          {step === 'create' ? 'Step 1 of 2 — create the bot' : step === 'token' ? 'Step 2 of 2 — paste the token' : 'Connected'}
        </span>
      </div>

      {step === 'create' && (
        <>
          <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
            Orbit can't create the bot for you — that part happens in the Discord Developer Portal.
            Everything after is automatic (no webhook to register: Orbit listens over the gateway).
          </p>
          <button
            className="btn"
            onClick={() => window.open(PORTAL_URL, '_blank', 'noopener')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, border: '1px solid #5865F2', color: '#5865F2', background: 'white' }}
          >
            Open Developer Portal <ExternalLink size={14} />
          </button>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            {CREATE_STEPS.map((s, i) => (
              <li key={i}>
                {s.cmd && <code style={{ background: 'var(--surface-1)', padding: '1px 5px', borderRadius: 4 }}>{s.cmd}</code>} {s.text}
              </li>
            ))}
          </ol>
          <button className="btn btn-primary" onClick={() => setStep('token')} style={{ background: 'var(--signal-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            I have my token <ArrowRight size={14} />
          </button>
        </>
      )}

      {step === 'token' && (
        <>
          <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
            Paste the token here — Orbit validates it, encrypts it, provisions your AI flow,
            and starts listening. The token is never shown again.
          </p>
          <input
            className="input" type="password" value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bot token (Developer Portal → Bot → Token)"
            aria-label="Bot token (Developer Portal)"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={busy} onClick={() => setStep('create')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={submit} style={{ background: 'var(--signal-orange)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {busy ? (<><Loader2 size={14} className="animate-spin" /> Validating…</>) : 'Validate & connect'}
            </button>
          </div>
        </>
      )}

      {step === 'done' && result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F8357' }}>
            <CheckCircle2 size={16} /> Connected as {botName} — {result.status}
            {result?.test?.status ? ` · test ${String(result.test.status).replace(/_/g, ' ')}` : ''}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
            ✅ Gateway listener started. Send a message in a channel {botName} can read — the AI reply
            should arrive in Discord and in the Orbit Inbox. The listener also restarts automatically
            with the server.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={testing} onClick={runTest} style={{ fontWeight: 700 }}>
              {testing ? 'Testing…' : 'Test link'}
            </button>
            <button className="btn btn-primary" onClick={onDone} style={{ background: 'var(--signal-orange)', flex: 1 }}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
