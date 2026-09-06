# SECURITY.md — audit of repo + live surface (2026-09-06)

Method: static review of all of `server/` + `src/`, secret scan, `npm audit`,
behavioral webhook tests. Severity = exploitability in the current MVP
(single-tenant, auth skipped by decision).

## Fixed in this pass

| # | Finding | Fix |
|---|---|---|
| 1 | `app.use(cors())` — any website could call the API from a victim's browser | `CORS_ORIGIN` allowlist (`server/index.js`); non-browser callers unaffected |
| 2 | Webhook POSTs accepted **unsigned** — forgery mints fake chats and triggers paid MicroMind calls | `X-Hub-Signature-256` verification (`server/meta/verify.js`), enforced when `META_APP_SECRET` is set; warns loudly until then |
| 3 | No rate limiting on cost-amplifying endpoints (webhook → AI → send) | In-memory sliding window (`server/middleware/rateLimit.js`): 300/min webhooks, 60/min human-reply per IP |
| 4 | `/api/upload` wrote any base64 blob to disk under a served path | Magic-byte allowlist: JPEG/PNG/GIF/WEBP only, else 400 |
| 5 | `.env.example` committed with the **real dev DB password** | Scrubbed to placeholders |
| 6 | Inbox ran on mocks even with backend up; human send double-wrote | `src/services/normalize.ts` bootstrap mapping; `replyToConversation` single-write with `_synced` flag; fake AI now offline-fallback only |

## Verified safe (no change)

- **SQL injection**: every query is parameterized (`$1…`); no string-built SQL anywhere.
- **Credential exposure**: vault envelope (AES-256-GCM) is the only persisted form;
  `safeAccount`, admin endpoints, logs and errors never include secrets.
- **XSS**: no `dangerouslySetInnerHTML`/`innerHTML`/`eval`; React escapes by default.
  Inbox renders provider text as text nodes.
- **Telegram webhook**: `X-Telegram-Bot-Api-Secret-Token` checked against the
  per-account secret (returned once at connect).
- **`.env` hygiene**: `.env` never committed (gitignored, confirmed in history);
  `server/uploads/` + `local_db_cache.json` now ignored too.
- **MicroMind template**: sanitized export — no live tokens in
  `server/micromind/templates/`.

## Accepted risks (MVP, must close before production pilot)

| # | Risk | Why accepted | Closes when |
|---|---|---|---|
| A | **No authN/Z** — `localStorage orbit_authenticated`, `requireWorkspace()` → `'default'`, open admin | Explicit MVP decision | Real auth (JWT/session) + workspace membership checks + admin gate |
| B | **Dev DB password in git history** (`postgres/admin@148.251.171.147` in old commits + `server/db.js` defaults) | Can't un-commit; dev-only host | **Rotate the DB password now**, then update `.env`/deploy env |
| C | `CRED_KEY` dev fallback (stable local key, loud warning) | Keeps local dev working without setup | Hard-require `CRED_KEY`; refuse boot in production without it |
| D | Rate limiter is per-process memory | Single instance today | Redis-backed limiter with multi-instance deploy |
| E | `express.json({limit:'25mb'})` | Needed for photo upload path | Lower + stream uploads to object storage |
| F | `npm audit`: 2× moderate `react-router-dom` (open-redirect-via-backslash; SSR `deserializeErrors`) | Not exploitable here: no SSR, navigation targets are internal constants; fix is a breaking major (v6→v7) | Schedule the v7 migration + regression pass |

## Still TODO (from the plan, unchanged)

MicroMind `openRouterApi` credential (prediction 500s), `MICROMIND_API_KEY`
(auto-provision), Meta/Google app credentials, verified WhatsApp/Telegram
templates, PG recovery (migrations auto-apply on boot).
