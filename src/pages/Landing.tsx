import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrbitLogo } from '../components/shared/OrbitLogo';
import {
  MessageSquare, ShoppingBag, Calendar, Bot, Zap, Shield, ArrowRight, CheckCircle2,
  Sparkles, Layers, Users, TrendingUp, ChevronRight, Globe, Check, Smartphone, BarChart3, RefreshCw
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'commerce' | 'appointments'>('commerce');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'instagram' | 'facebook' | 'email'>('instagram');

  const channelExamples = {
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
    facebook: {
      channel: 'Facebook Messenger',
      color: '#1877F2',
      inbound: 'Customer: "Can I get a 10% discount if I buy 2 pairs of running shoes?"',
      orbitProcess: 'ORBIT AI validated promotional rules, generated 10% bundle coupon code, and prepared draft checkout.',
      outboundAction: 'Action: Conversion Lead logged in CRM & follow-up queue initialized.'
    },
    email: {
      channel: 'Customer Email Support',
      color: '#171717',
      inbound: 'Client: "My delivery was delayed. Can someone contact the courier?"',
      orbitProcess: 'ORBIT AI flagged high-priority issue, fetched Bosta logistics status, and alerted human agent.',
      outboundAction: 'Action: Human Takeover Alert sent to Agent Mariam + Support Ticket #TK-882 escalated.'
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cloud-white)', color: 'var(--midnight-ink)', fontFamily: 'var(--font-ui)' }}>
      {/* 1. Header Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(250, 250, 249, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <OrbitLogo variant="horizontal" size={32} onClick={() => navigate('/')} />

        <nav className="hide-below-768" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#concept" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Brand Concept</a>
          <a href="#features" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Core Features</a>
          <a href="#verticals" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Dual-Vertical Engine</a>
          <a href="#workflow" style={{ color: 'var(--ink-600)', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>Signals to Actions</a>
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
        {/* Subtle Brand Background Pattern */}
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

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--ink-600)',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            ORBIT converges customer chats from Instagram, WhatsApp, Facebook, TikTok, and Web into an intelligent AI engine—automatically turning incoming signals into instant sales orders, clinic bookings, qualified leads, and support tickets.
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
              <CheckCircle2 size={16} color="var(--signal-orange)" /> 24/7 AI Automated Responses
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--signal-orange)" /> Dual Commerce & Appointment Modes
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--signal-orange)" /> Egyptian Dialects & Franco Support
            </div>
          </div>
        </div>
      </section>

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
          <div style={{
            background: 'var(--cloud-white)',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 36px rgba(23, 23, 23, 0.06)'
          }}>
            {/* Channel Selection Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {(['instagram', 'whatsapp', 'facebook', 'email'] as const).map(ch => (
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
                  <OrbitLogo variant="primary" colorMode="dark" size={32} />
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

      {/* 4. Dual-Vertical Engine Section */}
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

      {/* 5. Core Features Grid */}
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
                Centralize messages from Instagram DMs, WhatsApp, Facebook Messenger, TikTok comments, and Web Chat into one clean thread with real-time AI takeover controls.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bot size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>AI Guardrails & Thresholds</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Configure confidence thresholds (e.g. 75%). Higher confidence queries auto-checkout/book; lower confidence inquiries seamlessly trigger human staff escalation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Users size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Customer CRM & Reliability Scoring</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Track VIP status, tags, order completion rates, returns, and appointment no-shows so your team always knows who they're talking to.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <RefreshCw size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Abandoned Lead Recovery Queue</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Automatically queue smart follow-ups for customers who asked about products or clinic slots but left before finalizing their booking or order.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Shield size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Working Hours & Access Control</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Set support schedules per day and manage staff permissions (Owner, Agent, Viewer) with instant email and in-app alert triggers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--signal-orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <BarChart3 size={20} color="var(--signal-orange)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Analytics & Revenue Reports</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Visualize revenue trends, AI resolution rate vs. human handoffs, average response times, top products, and service utilization rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section style={{
        background: 'var(--midnight-ink)',
        color: 'var(--cloud-white)',
        padding: '70px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <OrbitLogo variant="primary" colorMode="dark" size={44} />
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
            <OrbitLogo variant="horizontal" colorMode="dark" size={28} />
            <div style={{ display: 'flex', gap: 20 }}>
              <span onClick={() => navigate('/overview')} style={{ cursor: 'pointer' }}>Overview</span>
              <span onClick={() => navigate('/inbox')} style={{ cursor: 'pointer' }}>Inbox</span>
              <span onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>Orders</span>
              <span onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>Appointments</span>
              <span onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>Analytics</span>
              <span onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>Settings</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #242424', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666' }}>
            <span>© {new Date().getFullYear()} ORBIT Platform. All rights reserved. Many signals → one intelligent flow.</span>
            <span>Version 2.4.0 (ORBIT Engine)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
