# ORBIT — AI Omnichannel Sales & Booking Platform

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
npm run admin:create-user -- --email=you@biz.com --password='<10+ chars>'  # first owner
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
| `MICROMIND_ANALYST_FLOW_ID` | backend | Dedicated analyst flow for reports + knowledge answers (falls back to messenger flow) |
| `META_GRAPH_VERSION` | backend | Graph API version for sends (default `v19.0`) |
| `CORS_ORIGIN` | backend | Comma-separated browser origins (required in production) |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | backend | `None`+Secure for cross-site prod (Vercel + VPS); Lax default |
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
  micromind/analyst.js       single gateway for ALL non-channel AI (reports, knowledge)
                             (MicroMind primary, local template/match fallback — never 500s)
  micromind/provisioner.js    ops-account login (24h JWT, auto-refresh on 401)
  micromind/folders.js        one MicroMind folder per workspace (verified API)
  micromind/keys.js           per-tenant prediction keys (mint/link/revoke, vaulted)
  micromind/provisionChannel.js  per-tenant flow provisioner (folderId + key link)
  micromind/templates/     messenger.json, instagram.json (sanitized exports)
mcp-micromind/             MCP server for MicroMind (22 tools: folders, flows,
                           prediction keys, capped predictions, extended reads;
                           SKILL.md documents policy + recipes)
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
Auth (bcrypt + server-side sessions in httpOnly cookies)
  POST   /api/auth/signup     (open only until the first user exists, then 403)
  POST   /api/auth/login      (rate-limited) | POST /api/auth/logout | GET /api/auth/me
  POST   /api/auth/forgot|reset  (self-service reset, 1h tokens, no enumeration)
  All /api/* (except /health, /auth/*, OAuth callback) require a session and
  resolve the workspace from membership. Admin routes require owner/admin role.
```
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
  GET    /api/v1/conversations/:id/messages  (realtime thread polling)
  POST   /api/v1/conversations/:id/reply   (backend sends to the provider)

Knowledge / Admin
  GET|POST /api/v1/workspaces/:id/knowledge, DELETE /api/v1/knowledge/:id
  POST   /api/v1/workspaces/:id/knowledge/ask   (MicroMind analyst → local-match → none)
  POST   /api/v1/workspaces/:id/knowledge/upload (txt/md/csv/json/pdf/docx → chunked items)
  GET    /api/v1/workspaces/:id/plan (plan limits + 30d usage; billing provider pending)
  GET    /api/v1/admin/overview|channels|flows|errors|usage|micromind|users

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
