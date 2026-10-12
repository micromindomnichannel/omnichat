# ORBIT — Project Description

> **ORBIT** is an AI-powered Omnichannel Sales & Booking Platform built for Egyptian and MENA merchants.

---

## What is ORBIT?

ORBIT is a complete customer-conversation platform designed specifically for merchants who sell through social media and chat. It unifies customer messages from Messenger, Instagram, Telegram, and Discord into one intelligent inbox — with an AI assistant that replies instantly, books appointments, and hands over to a human when needed.

The system comes in three layers:
- **A web dashboard** for merchants and their teams — inbox, catalog, orders, appointments, analytics, and settings
- **A backend control plane** that owns every channel connection, encrypts all tokens, and routes each message to the right business
- **An AI layer** that answers customers in Arabic and English, grounds answers in each business's own knowledge, and generates executive reports

---

## The Problem It Solves

Merchants in Egypt typically run their business through scattered DMs — a Facebook message here, an Instagram DM there, a Telegram chat somewhere else. This leads to:

- **Missed messages** — customer inquiries sit unanswered for hours across four different apps, and buyers move on to competitors
- **Slow replies** — one person can't watch every inbox, especially at night or during busy hours
- **No booking system** — appointments are scribbled in notebooks or lost in chat history, with no reminders or confirmations
- **No order tracking** — cash-on-delivery orders, customer reliability, and repeat buyers live only in someone's memory
- **No insight** — owners have no idea how fast they reply, which channel sells best, or what customers keep asking

ORBIT eliminates all of this by giving every business — from a Cairo clothing store to a clinic — a single, shared, always-awake system that answers, books, sells, and reports.

---

## Key Features

### 💬 Unified Inbox
All Messenger, Instagram, Telegram, and Discord conversations in one place — with channel filters, search, unread badges, AI/human status, and friendly timestamps. New messages appear automatically without refreshing.

### 🤖 AI Auto-Replies
The AI answers customers instantly in Arabic, English, or both — in the business's own tone — using each workspace's products, FAQs, and knowledge base. Human takeover is one click away, and returning to AI is just as easy.

### 🔌 Channel Connections
Guided setup wizards connect each channel in minutes — Meta OAuth for Messenger/Instagram, a BotFather walkthrough for Telegram, a Developer Portal walkthrough for Discord. Tokens are encrypted server-side, webhooks register automatically, and every connection gets its own isolated AI flow.

### 📚 Knowledge Base
Upload FAQs, policies, and catalogs from files or quick-adds. The AI answers strictly from approved knowledge — with a test mode to preview every answer and an honest badge showing whether each answer came from AI or local match.

### 📅 Appointments & Bookings
Services with durations and availability, customer booking flow, confirmations, and calendar views for clinics and service businesses.

### 📦 Orders & COD
Commerce orders with cash-on-delivery support, customer reliability scoring, repeat-buyer tracking, and manual order entry from inside any conversation.

### 🛍️ Catalog
Products and services with images, variants, pricing, stock levels, and low-stock alerts.

### 📣 Scheduler & Broadcasts
Plan social content ahead, schedule posts across platforms, publish instantly, and track scheduled/published/failed status on a month-grid calendar.

### 📈 Analytics & Executive Reports
Live dashboards — conversation volume, channel mix, AI vs. human replies, response times, unread load, buying-intent threads — plus AI-generated executive summaries saved to the database.

### 👥 Team & Plans
Email invitations with roles (owner/admin/agent), per-plan channel limits, workspace settings, and a full admin panel with flow diagnostics and one-click webhook replay.

---

## The AI Features

What makes ORBIT stand out is its AI integration:

1. **Instant Replies, Day and Night** — A customer messages at 2 AM in Egyptian Arabic: _"بكام الشحن للاسكندرية؟"_ (How much is shipping to Alexandria?). The AI answers on the spot from the business's own knowledge — no waiting for morning.

2. **Knowledge-Grounded Answers** — The AI never improvises business facts. Every answer comes from approved FAQs, policies, and catalog data, and the dashboard shows exactly which answers came from AI versus local match.

3. **AI Executive Reports** — Owners get plain-language weekly summaries — revenue, order counts, AI resolution rate, top channels, stock warnings — generated from live database numbers.

4. **Brand Voice Control** — Each business sets its tone (Friendly, Professional, Casual), reply language, confidence thresholds, and custom human-takeover rules. The AI behaves like a trained team member, not a generic chatbot.

---

## Who Uses It?

| Role | What They Do |
|---|---|
| **Owner / Admin** | Connects channels, manages the team, configures AI settings, views reports and diagnostics |
| **Agent** | Answers conversations, takes over from AI, creates orders and bookings |
| **Viewer** | Read-only access to conversations and reports |
| **Customer (end buyer)** | Messages the business on any channel and gets instant, helpful replies |

---

## Tech Summary

- **Web App:** React + Vite (frontend), Node.js + Express (backend), PostgreSQL (database, hosted on Supabase)
- **AI:** MicroMind (Flowise-based) flows — one isolated flow per business × channel, plus a shared analyst flow for reports and knowledge answers
- **Channels:** Meta Graph API (Messenger/Instagram), Telegram Bot API, Discord gateway, WhatsApp Cloud API (in progress)
- **Languages:** Full Arabic and English support, including Egyptian dialect understanding
- **Security:** Session-cookie auth, AES-256 encrypted credential vault, role-based permissions, audit logging, rate limiting
- **Hosting:** Railway (backend) + Vercel (frontend), auto-deployed from the main branch

---

## Brand

- **Name:** ORBIT — AI Omnichannel Sales & Booking Platform
- **Theme Color:** `#FF5A36` (Signal Orange) on deep ink `#171717` and warm cloud surfaces
- **Tagline:** _"Every conversation. One inbox. Always awake."_
- **Built by:** the ORBIT team ([micromindomnichannel](https://github.com/micromindomnichannel))
