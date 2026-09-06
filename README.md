# SELLER — AI Omnichannel Sales & Booking Platform

An omnichannel AI sales and booking platform for Egyptian & MENA merchants. It unifies
customer conversations across Messenger, Instagram, WhatsApp, Telegram, and Gmail into
autonomous sales and appointment-booking pipelines, with human takeover and COD logistics.

## Architecture

```text
React Frontend (Vite :3000)
      ↓  (VITE_API_URL, default http://localhost:5000/api)
ORBIT Backend — Express (:5000, the control plane)
      ↓
PostgreSQL (multi-tenant: every row scoped to workspace_id)
      ↓
MicroMind API (AI/execution layer — one dedicated flow per workspace × channel)
      ↓
Channel providers (Meta Graph, WhatsApp Cloud, Telegram Bot API, Gmail)
```

The browser **never** talks to MicroMind or providers directly. All tokens live
encrypted in the backend vault (`credentials` table, AES-256-GCM).

## Quick start

```bash
npm install
cp .env.example .env        # then fill CRED_KEY, MICROMIND_*, DB_*
npm run db:init             # base schema + seed (needs PG up)
npm run db:migrate          # slice migrations (also auto-run on server boot)
npm run server              # Express API on :5000 (terminal 1)
npm run dev                 # Vite frontend on :3000 (terminal 2)
```

Optional checks:

```bash
node test_db.cjs            # PG connectivity + applied migrations
npm run probe:micromind     # MicroMind prediction + management CRUD probe
```

## Environment

| Var | Where | Purpose |
|---|---|---|
| `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`, `DATABASE_URL` | backend | PostgreSQL connection |
| `PORT` | backend | Express port (default 5000) |
| `CRED_KEY` | backend | 64-hex-char vault key (required in production) |
| `MICROMIND_BASE_URL` | backend | e.g. `https://core.aimicromind.com/api/v1` |
| `MICROMIND_API_KEY` | backend | Bearer token for flow/credential management (P0 CRUD) |
| `MICROMIND_MESSENGER_FLOW_ID` | backend | Reference flow for the probe |
| `META_GRAPH_VERSION` | backend | Graph API version for sends (default `v19.0`) |
| `VITE_API_URL` | frontend | API base, default `http://localhost:5000/api` |

## Project structure

```text
server/
  index.js                 Express app (catalog, inbox, orders, reply, routers)
  db.js / schema.sql       PG pool + base single-tenant schema
  initDb.js                schema.sql + slice migrations + seed (npm run db:init)
  migrate.js               idempotent migration runner (npm run db:migrate)
  migrations/              001_multitenant_channels.sql, 002_plans_knowledge.sql
  channels/routes.js       connect/list/disconnect/reconnect + OAuth stubs
  webhooks/routes.js       Meta handshake + idempotent inbound → AI → send
  credentials/crypto.js    AES-256-GCM vault (CRED_KEY)
  billing/plans.js         Free 2 / Pro 6 / Business ∞ channel limits
  knowledge/routes.js      workspace knowledge base CRUD
  admin/routes.js          internal overview/channels/flows/errors/usage
  meta/graph.js            Messenger + Instagram Send API
  meta/whatsapp.js         WhatsApp Cloud API parser + sender
  integrations/telegram.js Telegram Bot API parser + sender (+secret check)
  integrations/gmail.js    placeholder (501 until Google OAuth + Pub/Sub)
  micromind/client.js      chatflow/credential CRUD + prediction
  micromind/provisionChannel.js  per-tenant flow provisioner (all channels)
  micromind/templates/     messenger.json, instagram.json (sanitized exports)
src/
  pages/                   Overview, Inbox, Customers, Orders, Appointments,
                           Products, Services, Scheduler, Automations,
                           Knowledge, Analytics, Settings, Admin, …
  components/settings/ChannelsPanel.tsx  real connect UI (Settings → Channels)
  services/api.ts          API client (VITE_API_URL, null-safe fallbacks)
scripts/micromind-probe.mjs  P0 verification probe
MICROMIND_API.md           verified endpoints, auth, templates, tenant rules
```

## API overview

```text
Catalog & CRM (tenant-scoped to the default workspace until auth lands)
  GET/POST/PUT/DELETE /api/products, /api/services
  GET/POST /api/orders (+ /api/orders/ai-confirm), /api/appointments
  GET /api/conversations, PUT /api/conversations/:id/status, POST /api/messages
  GET/PUT /api/customers, /api/faqs, /api/schedules, /api/reports*, /api/settings

Channels (AUTH skipped in MVP → default workspace)
  GET    /api/v1/workspaces/:id/channels
  POST   /api/v1/workspaces/:id/channels/:channel/connect
  POST   /api/v1/workspaces/:id/channels/:channel/oauth/start
  GET    /api/v1/channels/:channel/oauth/callback
  POST   /api/v1/channels/:id/disconnect|reconnect

Inbox
  GET    /api/v1/conversations  (+ legacy /api/conversations)
  POST   /api/v1/conversations/:id/reply   (backend sends to the provider)

Knowledge / Admin
  GET|POST /api/v1/workspaces/:id/knowledge, DELETE /api/v1/knowledge/:id
  GET    /api/v1/admin/overview|channels|flows|errors|usage

Webhooks (Meta owns the callback URL → ORBIT)
  GET|POST /webhooks/messenger, /webhooks/instagram, /webhooks/whatsapp
  POST     /webhooks/telegram (secret-token checked), /webhooks/gmail (501)
```

## Channel slices

| Channel | Status | Notes |
|---|---|---|
| Messenger | ✅ Live | Verified template, auto-provision, webhook + AI reply |
| Instagram | ✅ Live | Verified template, auto-provision, webhook + AI reply |
| WhatsApp | 🟡 BYOF | Parser/sender/webhook done; connect needs `micromindFlowId` until template is verified |
| Telegram | 🟡 BYOF | Same as WhatsApp + `webhookSecret` returned once for `setWebhook` |
| Gmail | ⚪ Placeholder | `501 gmail_pending` — needs Google OAuth + Pub/Sub |
| TikTok | ⚪ Not started | `400 channel_pending` |

Multi-tenant rule: **one dedicated MicroMind flow per workspace × channel**.
Inbound identity is deterministic — `{workspace}:{channel}:{senderId}` via
`overrideConfig.sessionId` — never the flow's random memory id.

## Deployment

- `vercel.json` deploys the **frontend only** (`npm run build` → `dist/`).
- The Express backend runs separately (`npm start`, currently beside Postgres on
  the VPS). Point the deployed frontend at it via `VITE_API_URL`.
- Before any production pilot: add real auth (replace the `default`-workspace
  stub), set `CRED_KEY`, and gate `/api/v1/admin/*` + `/webhooks/*` appropriately.

## Legacy files

- `index2.html` / `standalone-demo.html` — pre-React static demos, kept for
  reference; the Vite app in `src/` is the real frontend.
- `MICROMIND_API.md` — the verified MicroMind contract + slice status log.
