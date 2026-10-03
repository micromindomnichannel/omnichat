import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Public page (no auth): linked from the Meta App Dashboard as the Privacy
// Policy URL. Two layers:
//   A. The AI MicroMind LLC corporate Privacy Policy (full text, §§1–10) —
//      the same document hosted at https://www.aimicromind.com/privacy-policy
//      and submitted to LinkedIn + Meta company-profile settings.
//   B. The ORBIT product addendum — the four load-bearing statements for App
//      Review (purpose, retention, deletion, contact) MUST stay consistent
//      with the screencast narration and the App Review data-handling
//      answers. Edit wording only; never remove one of the four.
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
        <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 8 }}>AI MicroMind LLC: Privacy Policy. Last updated: September 16, 2025.</p>
        <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 32 }}>Includes the ORBIT product addendum below (our Meta App Review data-handling disclosure).</p>

        <Section title="1. Our Commitment to Your Privacy">
          Welcome to AI MicroMind. Our mission is to be Your Business Co-Pilot, and the foundation of
          that partnership is trust. This Privacy Policy is our commitment to you. It explains how AI
          MicroMind LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and safeguards your information with
          transparency and integrity when you interact with our website, our Academy, and our Services.
          Please read this policy carefully. By using our services, you agree to the collection and use of
          information in accordance with this policy.
        </Section>

        <Section title="2. The Information We Collect">
          We collect information to provide and improve our services to you. The type of information we
          collect depends on how you interact with us.
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '14px 0 6px' }}>A. For Website Visitors</h3>
          <List items={[
            'Personal Data: when you contact us for information or support, we collect the information you voluntarily provide, such as your name, email address, telephone number, job title, and company name.',
            'Derivative Data: like most websites, our servers automatically collect information like your IP address, browser type, and access times to help us improve our service.',
          ]} />
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '14px 0 6px' }}>B. For AI MicroMind Academy Students</h3>
          <p style={{ margin: 0 }}>When you enroll in our Academy, we collect the necessary registration and enrollment
          data to manage your participation, provide educational services, and issue certifications.
          This includes your name, contact details, and course progress.</p>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '14px 0 6px' }}>C. For Business Service Users (MicroMind Core &amp; Ready Solutions)</h3>
          <p style={{ margin: 0 }}>To create and manage your account, we collect account administration data, including
          the names and email addresses of authorized users, company details, and billing
          information.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <List items={[
            'To Provide and Maintain Our Service: including managing your account, fulfilling orders, and providing customer support.',
            'To Communicate With You: to respond to your inquiries and send you important service updates or marketing communications (from which you can opt out at any time via the unsubscribe link in the email).',
            'For Academy Services: to manage your enrollment, track your progress, and, with your consent, connect you with our network of hiring partners upon successful graduation.',
            'To Improve Our Services: we use derivative and usage data to understand how our services are being used and how we can improve them.',
          ]} />
        </Section>

        <Section title="4. How We Share Your Information">
          We do not sell your personal information. However, we may share the information we collect in
          certain situations to conduct our business. Your information may be disclosed as follows:
          <List items={[
            'Third-Party Service Providers: we may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.',
            'By Law or to Protect Rights: we may share your information if we believe it is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.',
            'Business Partners: for our Academy graduates, we may share your information with our network of hiring partners, but only after receiving your explicit, opt-in consent to do so.',
          ]} />
        </Section>

        <Section title="5. Data Retention">
          We will only retain your personal data for as long as is necessary for the purposes set out in this
          Privacy Policy, unless a longer retention period is required or permitted by law (such as for tax,
          accounting, or other legal requirements). When we have no ongoing legitimate business need
          to process your personal information, we will either delete or anonymize it.
        </Section>

        <Section title="6. Cookies and Tracking Technologies">
          We use standard cookies and similar tracking technologies to track activity on our Website and
          hold certain information to improve your experience. You can instruct your browser to refuse all
          cookies or to indicate when a cookie is being sent. We use analytics partners like Google
          Analytics to understand user activity.
        </Section>

        <Section title="7. Your Business Data & Our Platform (Our Core Promise)">
          This section governs the business data you, as a client, connect to our core platform (MicroMind
          Core). Our promise is absolute.
          AI MicroMind is architected to be a secure, stateless data broker. Our business model is selling
          our software and services, not monetizing your data.
          <List items={[
            'When you use our Services to query your connected data sources, our platform is a transient conduit. The data required to fulfill a request is processed in-memory.',
            'This data is immediately and permanently discarded the moment the task is complete.',
            'We do not store your business data. We do not use your business data for any other purpose. We absolutely do not use your business data to train our or any third-party AI models.',
            'For maximum control, our platform can be deployed in your own on-premise or private cloud environment, giving you absolute data sovereignty.',
          ]} />
        </Section>

        <Section title="8. Your Rights Regarding Your Information (GDPR & Data Protection)">
          If you are a resident of the European Economic Area (EEA) or other regions with comprehensive
          data protection laws, you have specific rights regarding your personal data. AI MicroMind is
          committed to upholding these rights, which include:
          <List items={[
            'The right to access, update, or delete the information we have on you.',
            'The right of rectification.',
            'The right to object.',
            'The right of restriction.',
            'The right to data portability.',
            'The right to withdraw consent.',
          ]} />
          To exercise any of these rights, please contact us using the details below.
        </Section>

        <Section title="9. Policy for Children">
          Our Services are not directed to individuals under the age of 16. We do not knowingly solicit or
          collect information from children. If we learn that we have collected personal information from
          a child without verification of parental consent, we will take steps to delete that information as
          quickly as possible.
        </Section>

        <Section title="10. Contact Us">
          If you have questions or comments about this Privacy Policy, please contact us at <Contact />.
          <List items={[
            'Corporate Address (US): AI MicroMind LLC, 8 The Green, Suite B, Dover, DE 19901, USA.',
            'Regional Headquarters (MEA): AI MicroMind, Fairmont Towers, Nile Cornich, Cairo, 11531, EG.',
          ]} />
        </Section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '36px 0' }} />

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>ORBIT Product Addendum</h2>
        <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 28 }}>
          How the ORBIT AI omnichannel messaging service for merchants handles Meta platform data.
          Last updated: September 25, 2026.
        </p>

        <Section title="A1. Who we are">
          ORBIT (&ldquo;we&rdquo;, &ldquo;our&rdquo;) is a product of AI MicroMind LLC and provides an AI
          customer-messaging service for merchants.
          Merchants connect their own Facebook Pages and Instagram business accounts;
          ORBIT relays customer conversations to the merchant&apos;s AI assistant and sends replies.
          Data controller: AI MicroMind LLC (ORBIT AI portfolio). Contact: <Contact />.
        </Section>

        <Section title="A2. What data we collect and why (purpose)">
          When a customer messages a merchant&apos;s connected Page or Instagram account, Meta
          delivers the following to ORBIT via webhooks, and we store it to operate the service:
          <List items={[
            'Conversation content: message text customers send to the merchant.',
            'Sender identifiers: Page-scoped and Instagram-scoped sender IDs (needed to route replies).',
            'Message metadata: timestamps, delivery/read receipts, postback payloads from interactive buttons.',
            'Merchant account data: Page/Instagram account IDs and access tokens merchants provide at connection (tokens are encrypted at rest — see §A5).',
          ]} />
          We use this data solely to: display conversations in the merchant&apos;s inbox,
          generate AI-drafted replies, and maintain conversation history. We do not sell
          personal data, use it for advertising, or share it except as described in §A5.
        </Section>

        <Section title="A3. Retention">
          Conversation data is retained for as long as the merchant&apos;s account stays
          connected, so message history remains available in the inbox. Inactive
          conversation records older than 24 months may be purged automatically.
        </Section>

        <Section title="A4. Deletion">
          When a merchant disconnects a channel, we delete that channel&apos;s stored access
          token immediately and queue its conversation history for deletion within
          30 days. Any person may request deletion of their data at any time via <Contact />;
          verified requests are completed within 30 days. Webhook delivery logs used for
          abuse prevention are kept for a maximum of 90 days.
        </Section>

        <Section title="A5. How data is protected and shared">
          <List items={[
            'Channel access tokens are encrypted at rest (AES-256-GCM) in our credential vault and never exposed to frontends, logs, or AI providers.',
            'AI processing: message text is sent to our AI execution layer solely to generate replies; it is not used to train models.',
            'Infrastructure processors: managed database and hosting providers, bound by data-processing terms, with no independent use rights.',
            'We disclose data only when required by law.',
          ]} />
        </Section>

        <Section title="A6. Your rights">
          You may request access to, correction of, or deletion of your personal data at
          any time by contacting <Contact />. We respond to verified requests within 30 days.
        </Section>

        <Section title="A7. Changes">
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
