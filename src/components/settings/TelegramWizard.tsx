// TelegramWizard: guided "Connect Telegram Bot" setup.
// Orbit cannot create BotFather bots or read their tokens automatically, so
// bot creation is one short external step; everything after the paste is
// fully automatic (getMe validation, vault, webhook, flow, test ping).
import React, { useState } from 'react';
import { Send, ExternalLink, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const BOTFATHER_URL = 'https://t.me/BotFather';

const CREATE_STEPS: Array<{ cmd?: string; text: string }> = [
  { cmd: '/newbot', text: 'Send this command to @BotFather.' },
  { text: 'Pick a display name (e.g. Luna Store Bot).' },
  { text: 'Pick a username ending in bot (e.g. luna_store_bot).' },
  { text: 'BotFather replies with a token like 123456:ABC-DEF… — copy it.' },
];

export function TelegramWizard({ workspaceId, showToast, onDone }: {
  workspaceId: string;
  showToast: (msg: string, type?: 'success' | 'warning' | 'danger') => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'create' | 'token' | 'done'>( 'create');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!token.trim()) {
      showToast('Paste the bot token from @BotFather first', 'danger');
      return;
    }
    setBusy(true);
    const res = await api.connectChannel(workspaceId, 'telegram', { botToken: token.trim() });
    setBusy(false);
    if (res?.account) {
      setResult(res);
      setStep('done');
      const t = res?.test?.status ? ` — test ${String(res.test.status).replace(/_/g, ' ')}` : '';
      showToast(`telegram ${res.status}${t}`, res?.test && res.test.status !== 'test_ok' && res.test.status !== 'skipped' ? 'warning' : 'success');
    } else {
      showToast(res?.error || 'Connect failed (telegram)', 'danger');
    }
  };

  const runTest = async () => {
    if (!result?.account?.id) return;
    setTesting(true);
    const res = await api.testChannel(result.account.id);
    setTesting(false);
    if (res?.test) {
      showToast(`telegram test: ${String(res.test.status).replace(/_/g, ' ')}`, res.test.status === 'test_ok' ? 'success' : 'warning');
    } else {
      showToast(res?.error || 'Test failed', 'danger');
    }
  };

  const botName = result?.account?.username ? `@${result.account.username}` : 'your bot';
  const intakeOk = result?.intake?.ok === true;
  const manualSecret = !intakeOk ? result?.webhookSecret : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Send size={16} color="#229ED9" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>
          Connect Telegram Bot
        </span>
        <span style={{ fontSize: 11, color: 'var(--stone-gray)', marginLeft: 'auto' }}>
          {step === 'create' ? 'Step 1 of 2 — create the bot' : step === 'token' ? 'Step 2 of 2 — paste the token' : 'Connected'}
        </span>
      </div>

      {step === 'create' && (
        <>
          <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
            Orbit can't create the bot for you — that part happens in Telegram and takes about a minute.
            Everything after is automatic.
          </p>
          <button
            className="btn"
            onClick={() => window.open(BOTFATHER_URL, '_blank', 'noopener')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, border: '1px solid #229ED9', color: '#229ED9', background: 'white' }}
          >
            Open @BotFather <ExternalLink size={14} />
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
            Paste the token here — Orbit validates it with Telegram, encrypts it, provisions your AI flow,
            and registers its webhook automatically. The token is never shown again.
          </p>
          <input
            className="input" type="password" value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bot token from @BotFather (e.g. 123456:ABC-DEF…)"
            aria-label="Bot token from @BotFather"
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
          {intakeOk ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0, lineHeight: 1.6 }}>
              ✅ Webhook registered automatically. Send {botName} a test message — the AI reply should arrive in Telegram and in the Orbit Inbox.
            </p>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 6px' }}>⚠️ Auto-registration didn't complete ({result?.intake?.error || 'manual setup needed'}). Register manually once:</p>
              <code style={{ display: 'block', background: 'var(--surface-1)', padding: '6px 8px', borderRadius: 6, wordBreak: 'break-all', fontSize: 11.5 }}>
                https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url={result?.intake?.url || '…/webhooks/telegram'}&amp;secret_token={manualSecret || '…'}
              </code>
              {manualSecret && <p style={{ margin: '6px 0 0', fontSize: 11.5 }}>Secret shown once — it is stored encrypted and never displayed again.</p>}
            </div>
          )}
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
