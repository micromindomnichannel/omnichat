import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import { GridPulse } from '../components/shared/GridPulse';
import { AnimatedBeam } from '../components/shared/AnimatedBeam';
import { TextRewind } from '../components/shared/TextRewind';
import { Marquee } from '../components/shared/Marquee';
import {
  MessageSquare, ShoppingBag, Calendar, Bot, Zap, Shield, ArrowRight, CheckCircle2,
  Sparkles, Layers, Users, ChevronRight, Check, BarChart3
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'commerce' | 'appointments'>('commerce');
  const [selectedChannel, setSelectedChannel] = useState<'messenger' | 'instagram' | 'whatsapp' | 'telegram'>('instagram');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const channelExamples = {
    messenger: {
      channel: 'Facebook Messenger',
      color: '#0099FF',
      inbound: 'Customer: "Can I get a 10% discount if I buy 2 pairs of running shoes?"',
      orbitProcess: 'ORBIT AI validated promotional rules, generated a 10% bundle coupon, and prepared draft checkout — inside your dedicated Messenger AI flow.',
      outboundAction: 'Action: Conversion Lead logged in CRM & follow-up queue initialized.'
    },
    instagram: {
      channel: 'Instagram Direct',
      color: '#E4405F',
      inbound: 'Customer: "Is the Black Leather Bag in stock? How much is shipping to Alexandria?"',
      orbitProcess: 'ORBIT AI matched product SKU #1049, checked inventory (12 units remaining), and retrieved Alexandria delivery fee (50 EGP).',
      outboundAction: 'Action: Automated Reply & Draft COD Order #1049 created automatically with 94% confidence.'
    },
    whatsapp: {
      channel: 'WhatsApp Business',
      color: '#25D366',
      inbound: 'Patient: "I need to book a dental checkup slot for Thursday around 11 AM."',
      orbitProcess: 'ORBIT AI synced doctor agenda, identified open 11:00 AM slot, and sent calendar confirmation link.',
      outboundAction: 'Action: Appointment #A-104 confirmed + Automated WhatsApp reminder scheduled 2h before.'
    },
    telegram: {
      channel: 'Telegram',
      color: '#229ED9',
      inbound: 'Client: "My delivery was delayed. Can someone contact the courier?"',
      orbitProcess: 'ORBIT AI flagged high-priority issue, fetched courier status, and alerted a human agent with full context.',
      outboundAction: 'Action: Human Takeover Alert sent to Agent Mariam + Support Ticket #TK-882 escalated.'
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cloud-white)', color: 'var(--midnight-ink)', fontFamily: 'var(--font-ui)', position: 'relative' }}>
      {/* Full-page interactive grid (fixed behind all sections) */}
      <GridPulse variant="light" style={{ position: 'fixed' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 1. Header Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(250, 250, 249, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 74,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
          <OrbitLogo size={110} onClick={() => navigate('/')} />
        </div>

        <nav className="hide-below-768" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#concept" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Brand Concept</a>
          <a href="#features" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Core Features</a>
          <a href="#verticals" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Dual-Vertical Engine</a>
          <a href="#pricing" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Pricing</a>
          <a href="#concept" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Signals to Actions</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/demo')}
            className="btn btn-outline"
            style={{ height: 40, padding: '0 16px' }}
          >
            Interactive Demo
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-outline"
            style={{ height: 40, padding: '0 16px' }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="btn btn-primary"
            style={{ height: 40, padding: '0 20px', background: 'var(--signal-orange)', boxShadow: '0 4px 14px rgba(255, 90, 54, 0.25)' }}
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        padding: '80px 32px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Soft brand wash in the hero (the page-level grid floats above it) */}
        <div style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 400,
          background: 'radial-gradient(circle, rgba(255,90,54,0.08) 0%, rgba(243,232,214,0.3) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="orbit-badge" style={{ marginBottom: 20 }}>
            <Sparkles size={14} color="var(--signal-orange)" />
            <span>ORBIT AI Omnichannel Business Engine</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--midnight-ink)',
            marginBottom: 24,
            maxWidth: 950,
            margin: '0 auto 24px'
          }}>
            Many Signals. <br />
            <span style={{ color: 'var(--signal-orange)' }}>One Intelligent Business Flow.</span>
          </h1>

          <div style={{ marginBottom: 28, fontSize: 'clamp(15px, 1.8vw, 18px)', fontWeight: 600, color: 'var(--ink-600)' }}>
            <TextRewind
              prefix="Wired for"
              words={['Messenger', 'Instagram', 'WhatsApp', 'Telegram', 'Gmail']}
            />
          </div>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--ink-600)',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            ORBIT converges customer chats from Messenger, Instagram, WhatsApp, Telegram, and Gmail into one intelligent AI engine — every channel gets its own dedicated AI flow, auto-provisioned on connect, turning incoming signals into instant sales orders, clinic bookings, qualified leads, and support tickets.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              className="btn btn-primary btn-lg"
              style={{ height: 50, padding: '0 32px', fontSize: 16, background: 'var(--signal-orange)' }}
            >
              Create Free Account <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-dark btn-lg"
              style={{ height: 50, padding: '0 28px', fontSize: 16, background: 'var(--midnight-ink)' }}
            >
              Sign In to Dashboard
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 40, color: 'var(--ink-400)', fontSize: 13, fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--signal-orange)" /> Dedicated AI flow per channel, auto-provisioned
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--signal-orange)" /> Knowledge-grounded answers + AI executive reports
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--signal-orange)" /> Encrypted vault, team roles & audit trail
            </div>
          </div>
        </div>
      </section>

      {/* Proof ticker (eloqwnt-style marquee): capability claims only, no invented results */}
      <Marquee
        items={[
          'Messenger + Instagram + WhatsApp + Telegram + Gmail',
          '24/7 automatic AI replies',
          'One inbox for every channel',
          'Dedicated AI flow per channel',
          'Human takeover anytime',
          'Encrypted credential vault',
        ]}
      />

      {/* 3. Core Brand Principle: "Channels → ORBIT → Actions" */}
      <section id="concept" style={{
        background: 'var(--warm-sand)',
        padding: '70px 32px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: 'var(--burnt-coral)', marginBottom: 8 }}>The ORBIT Visual Principle</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              How Signals Converge into Actions
            </h2>
            <p style={{ fontSize: 15, color: 'var(--graphite)', marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}>
              Multiple customer communication signals enter ORBIT, and ORBIT turns them into concrete business outcomes.
            </p>
          </div>

          {/* Core Concept Flow Visual */}
          <div id="workflow" style={{
            background: 'var(--cloud-white)',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 36px rgba(23, 23, 23, 0.06)'
          }}>
            {/* Channel Selection Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {(['messenger', 'instagram', 'whatsapp', 'telegram'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={'btn ' + (selectedChannel === ch ? 'btn-primary' : 'btn-outline')}
                  style={{
                    height: 38,
                    padding: '0 18px',
                    borderRadius: 20,
                    textTransform: 'capitalize',
                    background: selectedChannel === ch ? 'var(--signal-orange)' : 'white'
                  }}
                >
                  {ch} Signal
                </button>
              ))}
            </div>

            {/* 3-Stage Diagram: Channels -> ORBIT -> Actions */}
            <AnimatedBeam
              activeChannel={selectedChannel}
              actionLabel="Business Action"
              style={{ maxWidth: 720, margin: '0 auto 8px' }}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              alignItems: 'center'
            }}>
              {/* Box 1: Inbound Signal */}
              <div style={{
                background: 'var(--surface-0)',
                borderRadius: 14,
                padding: 24,
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: channelExamples[selectedChannel].color
                  }} />
                  <span className="eyebrow" style={{ color: 'var(--ink-900)' }}>1. Inbound Signal</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--midnight-ink)' }}>
                  {channelExamples[selectedChannel].channel}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--ink-600)', background: 'white', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontStyle: 'italic' }}>
                  {channelExamples[selectedChannel].inbound}
                </p>
              </div>

              {/* Box 2: Central ORBIT Engine */}
              <div style={{
                background: 'var(--midnight-ink)',
                color: 'var(--cloud-white)',
                borderRadius: 16,
                padding: 24,
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(23, 23, 23, 0.2)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <OrbitLogo size={40} theme="dark" />
                </div>
                <span className="eyebrow" style={{ color: 'var(--signal-orange)', marginBottom: 8, display: 'block' }}>2. Central Engine</span>
                <p style={{ fontSize: 12.5, color: '#E5E5E3', lineHeight: 1.5, background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8 }}>
                  {channelExamples[selectedChannel].orbitProcess}
                </p>
              </div>

              {/* Box 3: Outbound Business Action */}
              <div style={{
                background: 'rgba(82, 216, 164, 0.08)',
                borderRadius: 14,
                padding: 24,
                border: '1px solid rgba(82, 216, 164, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Zap size={16} color="#0F8357" />
                  <span className="eyebrow" style={{ color: '#0F8357' }}>3. Outbound Action</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--midnight-ink)' }}>
                  Automated Result
                </h4>
                <p style={{ fontSize: 13, color: 'var(--midnight-ink)', background: 'white', padding: 12, borderRadius: 8, border: '1px solid rgba(82, 216, 164, 0.3)', fontWeight: 500 }}>
                  {channelExamples[selectedChannel].outboundAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Proof in Action (eloqwnt-style selected work): the same demo
          narratives as the concept switcher, expanded as case cards. */}
      <section id="work" style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="eyebrow" style={{ color: 'var(--burnt-coral)', marginBottom: 8 }}>Proof in Action</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
            Live Conversations, Real Outcomes
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', maxWidth: 620, margin: '8px auto 0' }}>
            The same flows running in the demo above — an Instagram sale and a WhatsApp booking, handled end to end.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 28, borderLeft: '4px solid #E4405F' }}>
            <div className="eyebrow" style={{ color: '#E4405F', marginBottom: 8 }}>E-Commerce · Instagram Direct</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--midnight-ink)', marginBottom: 12 }}>
              DM Question → COD Order
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', fontStyle: 'italic', background: 'var(--surface-0)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
              Customer: "Is the Black Leather Bag in stock? How much is shipping to Alexandria?"
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6, marginBottom: 16 }}>
              ORBIT matched SKU #1049 (12 units), quoted Alexandria delivery (50 EGP), and drafted the COD order — all inside the customer's Instagram thread.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['SKU #1049 matched', '12 units in stock', '94% AI confidence'].map((m) => (
                <span key={m} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--signal-orange)', background: 'var(--signal-orange-subtle)', padding: '4px 10px', borderRadius: 20 }}>
                  {m}
                </span>
              ))}
            </div>
            <button onClick={() => navigate('/demo')} className="btn btn-outline" style={{ height: 40, padding: '0 20px' }}>
              See it in the demo <ArrowRight size={16} />
            </button>
          </div>

          <div className="card" style={{ padding: 28, borderLeft: '4px solid #25D366' }}>
            <div className="eyebrow" style={{ color: '#0F8357', marginBottom: 8 }}>Healthcare · WhatsApp Business</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--midnight-ink)', marginBottom: 12 }}>
              Message → Confirmed Booking
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', fontStyle: 'italic', background: 'var(--surface-0)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
              Patient: "I need to book a dental checkup slot for Thursday around 11 AM."
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6, marginBottom: 16 }}>
              ORBIT synced the doctor agenda, offered the open 11:00 AM slot, and scheduled the confirmation reminder — no staff involved.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['Slot found instantly', 'Reminder scheduled', 'Zero staff time'].map((m) => (
                <span key={m} style={{ fontSize: 11.5, fontWeight: 700, color: '#0F8357', background: 'rgba(82, 216, 164, 0.12)', padding: '4px 10px', borderRadius: 20 }}>
                  {m}
                </span>
              ))}
            </div>
            <button onClick={() => navigate('/demo')} className="btn btn-outline" style={{ height: 40, padding: '0 20px' }}>
              See it in the demo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Dual-Vertical Engine Section */}
      <section id="verticals" style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="orbit-badge" style={{ marginBottom: 12 }}>
            <Layers size={14} color="var(--signal-orange)" />
            <span>Built for Retail & Healthcare</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
            Instant Dual-Vertical Adaptation
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', maxWidth: 650, margin: '10px auto 0' }}>
            Switch between E-Commerce mode and Appointments mode with one tap. ORBIT dynamically alters navigation, workflows, AI tools, and CRM state.
          </p>
        </div>

        {/* Vertical Switcher Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => setActiveTab('commerce')}
            className={'btn btn-lg ' + (activeTab === 'commerce' ? 'btn-primary' : 'btn-outline')}
            style={{ width: 220, background: activeTab === 'commerce' ? 'var(--signal-orange)' : 'white' }}
          >
            <ShoppingBag size={18} /> E-Commerce & Retail
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={'btn btn-lg ' + (activeTab === 'appointments' ? 'btn-primary' : 'btn-outline')}
            style={{ width: 220, background: activeTab === 'appointments' ? 'var(--signal-orange)' : 'white' }}
          >
            <Calendar size={18} /> Clinics & Appointments
          </button>
        </div>

        {/* Vertical Preview Card */}
        <div className="card" style={{ padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
          {activeTab === 'commerce' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--signal-orange)' }}>E-Commerce & Retail Mode</span>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginTop: 6, marginBottom: 14 }}>
                  Automate Instagram DM Sales & COD Orders
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', fontSize: 14, color: 'var(--ink-600)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--signal-orange)" /> Instant inventory checking & variant availability (Size, Color)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--signal-orange)" /> Automatic Cash-on-Delivery (COD) checkout collection
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--signal-orange)" /> Customer reliability scoring (Completed vs. Cancelled orders)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--signal-orange)" /> One-click dispatch handoff to courier logistics
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/orders')}
                  className="btn btn-primary mt-24"
                  style={{ background: 'var(--signal-orange)' }}
                >
                  Explore Orders Dashboard <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ background: 'var(--warm-sand-light)', padding: 24, borderRadius: 12, border: '1px solid var(--warm-sand)' }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Live AI Conversation Preview</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px 10px 10px 2px', border: '1px solid var(--border)' }}>
                    Customer: "هو الشنطة السودا الجلد دي بكام؟"
                  </div>
                  <div style={{ background: 'var(--signal-orange-subtle)', color: 'var(--midnight-ink)', padding: '10px 14px', borderRadius: '10px 10px 2px 10px', border: '1px solid rgba(255,90,54,0.2)' }}>
                    ORBIT AI: "The Black Leather Bag is 850 EGP. Size M and L are in stock! Shall I create an order for you?"
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--signal-orange)' }}>Appointments & Clinics Mode</span>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginTop: 6, marginBottom: 14 }}>
                  Automate Patient Consultations & Calendar Slots
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', fontSize: 14, color: 'var(--ink-600)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--mint-signal)" /> Calendar open slot lookup & real-time doctor scheduling
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--mint-signal)" /> Service menu pricing breakdown (Dental Cleaning, Whitening)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--mint-signal)" /> Patient attendance rate tracking (Confirmed vs. No-Shows)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--mint-signal)" /> Automated WhatsApp appointment reminders & rescheduling
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/appointments')}
                  className="btn btn-primary mt-24"
                  style={{ background: 'var(--midnight-ink)' }}
                >
                  Explore Appointments Agenda <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ background: 'rgba(82, 216, 164, 0.08)', padding: 24, borderRadius: 12, border: '1px solid rgba(82, 216, 164, 0.3)' }}>
                <div className="eyebrow" style={{ marginBottom: 8, color: '#0F8357' }}>Live Patient Inquiry Preview</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px 10px 10px 2px', border: '1px solid var(--border)' }}>
                    Patient: "عايز أحجز كشف تنظيف أسنان يوم الخميس"
                  </div>
                  <div style={{ background: 'white', color: 'var(--midnight-ink)', padding: '10px 14px', borderRadius: '10px 10px 2px 10px', border: '1px solid rgba(82,216,164,0.4)' }}>
                    ORBIT AI: "We have available Dental Cleaning slots on Thursday at 09:30 AM, 11:00 AM, and 01:30 PM (600 EGP). Which time works for you?"
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Core Features Grid */}
      <section id="features" style={{ padding: '70px 32px', background: 'var(--surface-0)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Core Platform Architecture</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              Everything You Need to Scale Support & Sales
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Feature 1 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <MessageSquare size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Omnichannel Unified Inbox</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Centralize messages from Messenger, Instagram, WhatsApp, Telegram, and Gmail into one clean thread with real-time AI takeover controls and confidence guardrails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Zap size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>One-Click Channel Connections</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Connect a channel and ORBIT provisions its dedicated AI flow automatically — credentials encrypted in a server-side vault, webhooks registered, replies flowing in minutes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bot size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Knowledge Base + AI Answers</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Upload FAQs, policies, and catalogs from files or quick-adds. The AI answers strictly from your approved knowledge — with a preview mode to test every answer.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <BarChart3 size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>AI Executive Reports</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                One click turns live revenue, AI resolution rate, top channels, and low-stock alerts into a written executive summary — generated by AI over your real data.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Users size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Team Roles & Audit Trail</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Owner, admin, and agent roles with secure session login, self-service password reset, and a full audit log of every channel and workspace action.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Shield size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Security by Architecture</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                AES-256 encrypted credential vault, verified Meta webhook signatures, rate-limited APIs, tenant-isolated data on every query — secrets never reach the browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Numbered channel index (eloqwnt-style services list) */}
      <section style={{ padding: '70px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="eyebrow" style={{ color: 'var(--burnt-coral)', marginBottom: 8 }}>Every Channel, One Engine</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
            Connect Anything That Messages
          </h2>
        </div>
        <div>
          {[
            { n: '01', id: 'messenger', name: 'Messenger', color: '#0099FF', desc: 'Page conversations answered instantly, escalated to you when it matters.' },
            { n: '02', id: 'instagram', name: 'Instagram', color: '#E4405F', desc: 'DMs that sell: stock answers, COD orders, and booking flows in-thread.' },
            { n: '03', id: 'whatsapp', name: 'WhatsApp', color: '#25D366', desc: 'Bookings, reminders, and support on the channel your customers live in.' },
            { n: '04', id: 'telegram', name: 'Telegram', color: '#229ED9', desc: 'Bot-powered support and alerts with human takeover on demand.' },
            { n: '05', id: 'gmail', name: 'Gmail', color: '#A8A29E', desc: 'Email threads triaged and drafted alongside every chat channel.' },
            { n: '06', id: 'scheduler', name: 'Scheduler', color: '#FF5A36', desc: 'Broadcasts that actually publish: Facebook feed + Instagram media, tracked live.' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => document.getElementById('concept')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 20,
                padding: '20px 8px', background: 'none', border: 'none',
                borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--stone-gray)', fontFamily: 'var(--font-mono)', minWidth: 28 }}>
                {s.n}
              </span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: 'var(--midnight-ink)' }}>
                  {s.name}
                </span>
                <span style={{ display: 'block', fontSize: 13.5, color: 'var(--ink-600)', marginTop: 2 }}>
                  {s.desc}
                </span>
              </span>
              <ChevronRight size={18} color="var(--signal-orange)" />
            </button>
          ))}
        </div>
      </section>

      {/* 8. Pricing (plans mirror the backend billing limits; the chosen plan
          is applied to the workspace at signup via /signup?plan=) */}
      <section id="pricing" style={{ padding: '70px 32px', background: 'var(--surface-0)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="orbit-badge" style={{ marginBottom: 12 }}>
              <span>Pricing</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              Pick the plan that fits your business
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-600)', maxWidth: 560, margin: '8px auto 0' }}>
              Every plan includes the unified inbox, dedicated AI flows, and human takeover. Billing provider not connected yet — all plans free during pilot.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { id: 'free', name: 'Starter', price: '$0', per: 'free forever', tint: 'rgba(47, 92, 255, 0.06)', border: 'var(--border)', cta: 'Start free', features: ['2 active channels', '1 team seat', '1,000 AI messages / month', 'Unified inbox + AI replies'] },
              { id: 'pro', name: 'Pro', price: 'Pilot', per: 'free during pilot', tint: 'rgba(255, 90, 54, 0.07)', border: 'var(--signal-orange)', cta: 'Start Pro trial', popular: true, features: ['6 active channels', '5 team seats', '20,000 AI messages / month', 'Everything in Starter', 'Priority support'] },
              { id: 'business', name: 'Business', price: 'Custom', per: 'talk to us', tint: 'rgba(15, 157, 119, 0.07)', border: 'var(--border)', cta: 'Contact sales', mailto: true, features: ['Unlimited channels', '20 team seats', 'Unlimited messages', 'Everything in Pro', 'Dedicated onboarding'] },
            ].map((p) => (
              <div key={p.id} className="card" style={{ padding: 28, background: p.tint, border: `1.5px solid ${p.border}`, position: 'relative' }}>
                {p.popular && (
                  <span style={{ position: 'absolute', top: -12, left: 24, fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--signal-orange)', padding: '3px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>
                    MOST POPULAR
                  </span>
                )}
                <div className="eyebrow" style={{ color: 'var(--signal-orange)', marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-400)', fontWeight: 500 }}>{p.per}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--ink-600)', fontWeight: 500 }}>
                      <Check size={16} color="var(--signal-orange)" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => p.mailto ? (window.location.href = 'mailto:info@aimicromind.com?subject=ORBIT Business plan') : navigate(`/signup?plan=${p.id}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46, background: p.popular ? 'var(--signal-orange)' : 'var(--midnight-ink)', fontSize: 14 }}
                >
                  {p.cta} <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ (eloqwnt-style accordion) */}
      <section style={{ padding: '70px 32px', background: 'var(--surface-0)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="eyebrow" style={{ color: 'var(--burnt-coral)', marginBottom: 8 }}>Questions, Answered</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--midnight-ink)', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </h2>
          </div>
          {[
            {
              q: 'What is ORBIT?',
              a: 'ORBIT is an AI omnichannel inbox for merchants: customer chats from Messenger, Instagram, WhatsApp, Telegram, and Gmail converge into one dashboard, where a dedicated AI flow per channel answers instantly — and you can take over any thread at any time.',
            },
            {
              q: 'How do I connect a channel?',
              a: 'Settings → Channels → pick the channel → paste its token. ORBIT encrypts the token in a server-side vault, auto-provisions a dedicated AI flow for that connection, and starts handling messages. No code, no dashboard outside ORBIT.',
            },
            {
              q: 'Is my Page token safe?',
              a: 'Yes. Tokens are AES-256 encrypted at rest, never returned by any API, never logged, and never visible in the UI after entry. You can disconnect or rotate them anytime from Settings → Channels.',
            },
            {
              q: 'Which channels work today?',
              a: 'Messenger and Instagram connect end to end with auto-provisioned AI flows. Telegram and Discord connect with automatic provisioning too — paste the bot token and ORBIT handles the rest. WhatsApp and Gmail connect bring-your-own-flow (paste a MicroMind flow id).',
            },
            {
              q: 'What happens when the AI cannot answer?',
              a: 'Every reply carries a confidence score. Below your threshold, the thread escalates for human takeover with full context — and you can return it to the AI whenever you like.',
            },
            {
              q: 'Do my customers need to install anything?',
              a: 'No. They message your Page, profile, or number exactly as before. All the intelligence lives on your side, invisible to them.',
            },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, padding: '20px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 750, color: 'var(--midnight-ink)' }}>
                  <span style={{ color: 'var(--signal-orange)', marginRight: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.q}
                </span>
                <span style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: openFaq === i ? 'var(--signal-orange)' : 'var(--surface-1)',
                  color: openFaq === i ? 'white' : 'var(--signal-orange)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <p style={{ fontSize: 14.5, color: 'var(--ink-600)', lineHeight: 1.7, margin: '0 0 22px', paddingLeft: 44, maxWidth: 640 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Call to Action Banner */}
      <section style={{
        background: 'var(--midnight-ink)',
        color: 'var(--cloud-white)',
        padding: '70px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <GridPulse variant="dark" />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <OrbitLogo size={56} theme="dark" />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Ready to Converge Your Customer Signals into Business Growth?
          </h2>
          <p style={{ fontSize: 16, color: '#A8A29E', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Experience the ORBIT core dashboard live in action or customize your store settings.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              className="btn btn-primary btn-lg"
              style={{ background: 'var(--signal-orange)', padding: '0 32px' }}
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline btn-lg"
              style={{ color: 'white', borderColor: 'var(--graphite)' }}
            >
              Sign In to Your Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{
        background: '#111111',
        color: 'var(--stone-gray)',
        padding: '40px 32px 24px',
        borderTop: '1px solid #242424',
        fontSize: 12.5
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <OrbitLogo size={36} theme="dark" />
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span onClick={() => navigate('/overview')} style={{ cursor: 'pointer' }}>Overview</span>
              <span onClick={() => navigate('/inbox')} style={{ cursor: 'pointer' }}>Inbox</span>
              <span onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>Orders</span>
              <span onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>Appointments</span>
              <span onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>Analytics</span>
              <span onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>Settings</span>
              <span onClick={() => navigate('/privacy')} style={{ cursor: 'pointer', color: '#A8A29E' }}>Privacy Policy</span>
              <span onClick={() => navigate('/terms')} style={{ cursor: 'pointer', color: '#A8A29E' }}>Terms of Service</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #242424', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666' }}>
            <span>© {new Date().getFullYear()} ORBIT Platform. All rights reserved. Many signals → one intelligent flow.</span>
            <span>Version 3.0.0 (ORBIT Engine)</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
