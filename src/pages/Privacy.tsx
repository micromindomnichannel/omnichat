import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Public page (no auth): linked from the Meta App Dashboard as the Privacy
// Policy URL. The four load-bearing statements for App Review — purpose,
// retention, deletion, contact — MUST stay consistent with the screencast
// narration and the App Review data-handling answers. Edit wording only;
// never remove one of the four.
export function Privacy() {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 32 }}>ORBIT — AI omnichannel messaging for merchants. Last updated: September 25, 2026.</p>

        <Section title="1. Who we are">
          ORBIT ("we", "our") is a product of AI MicroMind LLC and provides an AI
          customer-messaging service for merchants.
          Merchants connect their own Facebook Pages and Instagram business accounts;
          ORBIT relays customer conversations to the merchant's AI assistant and sends replies.
          Data controller: AI MicroMind LLC (ORBIT AI portfolio). Contact: <Contact />.
        </Section>

        <Section title="2. What data we collect and why (purpose)">
          When a customer messages a merchant's connected Page or Instagram account, Meta
          delivers the following to ORBIT via webhooks, and we store it to operate the service:
          <List items={[
            'Conversation content: message text customers send to the merchant.',
            'Sender identifiers: Page-scoped and Instagram-scoped sender IDs (needed to route replies).',
            'Message metadata: timestamps, delivery/read receipts, postback payloads from interactive buttons.',
            'Merchant account data: Page/Instagram account IDs and access tokens merchants provide at connection (tokens are encrypted at rest — see §4).',
          ]} />
          We use this data solely to: display conversations in the merchant's inbox,
          generate AI-drafted replies, and maintain conversation history. We do not sell
          personal data, use it for advertising, or share it except as described in §5.
        </Section>

        <Section title="3. Retention">
          Conversation data is retained for as long as the merchant's account stays
          connected, so message history remains available in the inbox. Inactive
          conversation records older than 24 months may be purged automatically.
        </Section>

        <Section title="4. Deletion">
          When a merchant disconnects a channel, we delete that channel's stored access
          token immediately and queue its conversation history for deletion within
          30 days. Any person may request deletion of their data at any time via <Contact />;
          verified requests are completed within 30 days. Webhook delivery logs used for
          abuse prevention are kept for a maximum of 90 days.
        </Section>

        <Section title="5. How data is protected and shared">
          <List items={[
            'Channel access tokens are encrypted at rest (AES-256-GCM) in our credential vault and never exposed to frontends, logs, or AI providers.',
            'AI processing: message text is sent to our AI execution layer solely to generate replies; it is not used to train models.',
            'Infrastructure processors: managed database and hosting providers, bound by data-processing terms, with no independent use rights.',
            'We disclose data only when required by law.',
          ]} />
        </Section>

        <Section title="6. Your rights">
          You may request access to, correction of, or deletion of your personal data at
          any time by contacting <Contact />. We respond to verified requests within 30 days.
        </Section>

        <Section title="7. Changes">
          Material changes to this policy will be reflected here with an updated date and,
          where appropriate, notified to merchants through the ORBIT dashboard.
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

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 22 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

// Contact of record: must match the Meta DPO field, the screencast narration,
// and the App Review data-handling answers (all four name the SAME contact).
function Contact() {
  return <a href="mailto:info@aimicromind.com" style={{ color: 'var(--accent, #6d5cff)' }}>info@aimicromind.com</a>;
}
