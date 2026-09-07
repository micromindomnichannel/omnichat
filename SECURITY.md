# SECURITY.md — audit of repo + live surface (2026-09-07 — auth update)

Method: static review of all of `server/` + `src/`, secret scan, `npm audit`,
behavioral webhook + auth harnesses (17/17 auth checks pass).
Severity = exploitability with strangers on the site.

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

## Fixed in the auth pass (2026-09-07)

| # | Finding | Fix |
|---|---|---|
| 7 | No authN/Z — localStorage flag, open admin, client-trusted workspace | bcryptjs sessions (httpOnly `SameSite` cookies, SHA-256 stored), `requireAuth` on all API, membership-checked workspaces, owner/admin roles, closed registration after bootstrap, `npm run admin:create-user` |
| 8 | Legacy endpoints hardcoded `workspace_id='default'` (cross-tenant reads once 2nd workspace exists) | All 32 query sites parameterized to the session workspace |
| 9 | Webhooks resolved a single global workspace | Workspace derived per-event from the channel account (verify token / secret / page-ID routing) |
| 10 | Admin endpoints returned all workspaces' data, no gate | Owner/admin role + per-workspace scoping on every admin query |
| 11 | Bare `r.use(auth)` in routers would 401 the whole server (found live in testing) | Path-scoped (`/api/v1…`) + regression check `unknown path 404` |
| 12 | Login brute-forceable | 10/min/IP rate limit; min-10-char passwords; generic invalid-credentials message |

## Accepted risks (must close before production pilot)

| # | Risk | Why accepted | Closes when |
|---|---|---|---|
| A | **DB password in git history** + `server/db.js` dev defaults | Can't un-commit; dev-only host | **Rotate the DB password now** (your step 1), then update `.env` |
| B | `CRED_KEY` dev fallback | Local dev ergonomics | Hard-required in production (boot refuses without it — implemented) |
| C | Rate limiter is per-process memory | Single instance today | Redis-backed limiter with multi-instance deploy |
| D | `express.json({limit:'25mb'})` | Photo upload path | Lower + object storage |
| E | `npm audit`: 2× moderate `react-router-dom` | Not exploitable here (no SSR, internal nav); breaking major | v7 migration + regression pass |

## Still TODO (from the plan, unchanged)

MicroMind `openRouterApi` credential (prediction 500s), `MICROMIND_API_KEY`
(auto-provision), Meta/Google app credentials, verified WhatsApp/Telegram
templates, PG recovery (migrations auto-apply on boot).
