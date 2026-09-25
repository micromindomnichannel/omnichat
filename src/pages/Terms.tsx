import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Public page (no auth): linked from the Meta App Dashboard as the Terms of
// Service URL. Companion to Privacy.tsx — keep the data-deletion commitment
// (§3) consistent with Privacy §4.
export function Terms() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-0)', color: 'var(--ink-900)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 14, marginBottom: 24 }}
        >
          <ArrowLeft size={16} /> Back to ORBIT
        </button>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 32 }}>ORBIT — AI omnichannel messaging for merchants. Last updated: September 25, 2026.</p>

        <Section title="1. The service">
          ORBIT provides merchants with an AI-assisted inbox for their Facebook Pages and
          Instagram business accounts: incoming customer messages are relayed to the
          merchant's AI assistant, replies are sent back through Meta's platforms, and
          both sides are stored as conversation history. Use requires a merchant account
          and an explicit channel connection (Settings → Channels).
        </Section>

        <Section title="2. Merchant responsibilities">
          Merchants must: (a) own or be authorized to administer every Page/account they
          connect; (b) use AI replies in compliance with Meta's Platform Terms, Messaging
          Policies (including the 24-hour messaging window and tagged-message rules), and
          applicable law; (c) maintain accurate business information in their workspace
          settings. ORBIT may disable channels used in violation of platform policies.
        </Section>

        <Section title="3. Data and deletion">
          Conversation data is processed as described in our <a href="/privacy">Privacy Policy</a>.
          Disconnecting a channel deletes its stored access token immediately and queues
          its conversation history for deletion within 30 days. Deletion requests sent to
          the contact in the Privacy Policy are completed within 30 days of verification.
        </Section>

        <Section title="4. Availability and limits">
          The service is provided on a best-effort basis; AI-generated replies are
          merchant-configurable and merchants remain responsible for compliance of
          messages sent from their accounts. Plan limits (connected channels, message
          volume) are shown in workspace settings and enforced at connection time.
        </Section>

        <Section title="5. Termination">
          Either party may terminate via account closure or channel disconnection, with
          the deletion consequences in §3. We may suspend accounts for abuse, platform
          violations, or non-payment where applicable.
        </Section>

        <Section title="6. Changes and contact">
          Material changes will be posted here with an updated date and notified via the
          dashboard where appropriate. Questions: see the contact in our <a href="/privacy">Privacy Policy</a>.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-700)' }}>{children}</div>
    </section>
  );
}
