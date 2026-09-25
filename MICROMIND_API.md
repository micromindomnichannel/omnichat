# MICROMIND_API.md — verified against local docs + live instance

Source docs: `C:\MicroMind-Doc` (Flowise fork). Live base: `https://core.aimicromind.com/api/v1`.

## Base + auth

- Management (chatflow/credential CRUD): `Bearer <JWT>` in `Authorization` header
  (`swagger (1) (1) (1).yml`, `bearerAuth`). Verified: `GET /chatflows/{id}`
  without token → `401 Access Denied`. Set `MICROMIND_API_KEY` for P0 CRUD.
- Runtime prediction: open unless the flow has an API key assigned
  (`src/configuration/authorization/chatflow-level.md:25-29`). Reference flow
  needs no key today.

## Endpoints (all under `/api/v1`)

| Op | Call |
|---|---|
| Create flow | `POST /chatflows` `{name, flowData: "<stringified>", deployed, isPublic, type}` |
| Get flow | `GET /chatflows/{id}` |
| Update flow | `PUT /chatflows/{id}` same schema |
| Delete flow | `DELETE /chatflows/{id}` |
| Credentials | `POST /credentials`, `GET|PUT|DELETE /credentials/{id}` `{name, credentialName, encryptedData}` |
| Predict | `POST /prediction/{id}` `{question, overrideConfig?: {sessionId, vars}, history?}` |

`overrideConfig.sessionId` + `vars` must be allow-listed in
Chatflow Configuration → Security (`src/using-aimicromind/api.md:124-128`,
`src/using-aimicromind/variables.md:23-40`).

## Reference flow (Messenger)

- Flow id: `f4a7c66d-dc4c-4f0b-b12d-4b6ca91fe0c8` (export: `facebook flow Chatflow.json`)
- Chain: `messengerTrigger --fullData--> chatPromptTemplate --> toolAgent`
  (+ `chatOpenRouter` model, `bufferMemory`, `facebookMessengerTool`).
- Webhook: `https://core.aimicromind.com/webhook/{chatflowId}/messenger`,
  verify token default `orbit_messenger_2026` (rotate per tenant on provision).
- Template: `server/micromind/templates/messenger.json` — **sanitized**:
  Page Access Token → `<PAGE_ACCESS_TOKEN>`, Page ID → `<PAGE_ID>`.
  Never commit live tokens; MicroMind holds `openRouterApi` + `facebookMessengerApi`.

## P0 probe status (`node scripts/micromind-probe.mjs`)

- `prediction` → reachable, flow found, **500**: `OpenRouter API Key not found.
  Please provide your OpenRouter API key in the credential.` → add/fix the
  `openRouterApi` credential on this flow in MicroMind, then re-run.
- `management-crud` → **PASS** (`create→get→update→delete`, verified live
  2026-09-19 via provisioner login `POST /api/v1/login` → JWT).
  Notes: `flowData` must be `{"nodes":[],"edges":[]}`-shaped (`'{}'` 500s
  with `nodes is not iterable`); `server/micromind/{client,provisioner}.js`
  read env lazily so local `.env` works despite dotenv loading after hoisted
  imports in `server/index.js`.

## Tenant rules (ORBIT side)

- One dedicated flow per `workspace × channel_account`; never one giant flow.
- `sessionId = "{workspaceId}:messenger:{senderPsid}"` (`buildSessionId()`).
- Per-business context via prompt injection at provision time + `vars` at
  runtime; tool contract (`send_messenger_message {recipientPsid, messageText}`) untouched.

## Vertical slice status (Messenger + Instagram, auth skipped)
- Migration `server/migrations/001_multitenant_channels.sql` (auto-runs on boot
  via `server/migrate.js`, `npm run db:migrate`): workspaces, workspace_settings,
  credentials (encrypted), channel_accounts, micromind_flows, oauth_states,
  webhook_events, audit_logs + `workspace_id` on existing tables. Not yet applied
  — PG host is in recovery mode; it applies automatically when the DB is back.
- Connect: `POST /api/v1/workspaces/default/channels/{messenger,instagram}/connect`
  `{pageAccessToken|micromindFlowId, ...}` → vault → account → auto-provision
  dedicated flow (`server/micromind/provisionChannel.js`) → active.
  Templates: `server/micromind/templates/{messenger,instagram}.json`.
- Meta webhooks: `GET /webhooks/{messenger,instagram}` handshake (per-account
  verify_token, template-default fallback), `POST` inbound → idempotent
  (mid ledger) → customer/conversation/message → `predict(flow, sessionId, vars)`
  with `{senderPsid|senderIgsid, input}` vars filling the prompt → Graph send.
- Human reply: `POST /api/v1/conversations/:id/reply` (backend sends via Graph).
- Frontend: `VITE_API_URL` support + `ChannelsPanel` (Settings → Channels) with
  real connect/disconnect/reconnect; other channels stay local-preview.
- whatsapp/telegram/gmail/tiktok → `400 channel_pending` until their slice.

## Continued build (all missing externals = placeholders)

- **Plans/limits** (`server/billing/plans.js`): Free 2 / Pro 6 / Business ∞ active
  channels, enforced in connect (`402 upgrade_required`). No billing provider yet.
- **Tenant isolation**: legacy reads/inserts/mutations now carry
  `workspace_id='default'` (single-workspace rule until auth lands).
- **Knowledge** (`002_plans_knowledge.sql`, `server/knowledge/routes.js`):
  `GET|POST /api/v1/workspaces/default/knowledge`, `DELETE /api/v1/knowledge/:id`.
- **WhatsApp** (`server/meta/whatsapp.js`, Cloud API): parser + sender done;
  `GET|POST /webhooks/whatsapp` live; connect is BYOF (`template_pending`
  without `micromindFlowId`). Needs: Meta app, phone-number-id, token.
- **Telegram** (`server/integrations/telegram.js`, Bot API): parser + sender done;
  `POST /webhooks/telegram` checks `X-Telegram-Bot-Api-Secret-Token`; connect
  returns `webhookSecret` once for `setWebhook`. Needs: bot token, BYOF flow.
- **Gmail** (`server/integrations/gmail.js`): `501 gmail_pending` everywhere.
  Needs: Google OAuth consent + refresh token + Pub/Sub watch.
- **Admin** (`server/admin/routes.js`, `src/pages/Admin.tsx` → `/admin`):
  overview/channels/flows/errors/usage; null-safe when DB is down.
- **Reply**: `POST /api/v1/conversations/:id/reply` sends per provider
  (Graph / Cloud API / Bot API); gmail throws not-implemented.
- Frontend `Channel` extended: messenger/telegram/gmail icons + names;
  `ChannelsPanel` supports BYOF connect for whatsapp/telegram/gmail.

## Option B — folder-per-tenant zero-touch (verified live via captures)

- Provisioner identity: `POST /api/v1/login` (email+password) → 24h JWT,
  auto-refresh on 401 (`server/micromind/provisioner.js`). Falls back to
  static `MICROMIND_API_KEY`. Env: `MICROMIND_PROVISIONER_EMAIL/PASSWORD`.
- Folders: `POST /api/v1/folders` → 201 + `{id}` (`server/micromind/folders.js`,
  idempotent per workspace, `004_mm_tenancy.sql`).
- Flows: `POST /chatflows` accepts `folderId` + `deployed` + `apikeyid`.
- Prediction keys: `POST /apikey` (member-mintable, user-bound) → one key per
  tenant, vaulted (`micromind_prediction`), linked to the tenant's flows,
  sent per prediction call. Enforced flows 401 without it (`server/micromind/keys.js`).
- Folders are ORGANIZATION, not a permission boundary — tenancy stays
  backend-enforced (mapping + vault + membership). No per-tenant MicroMind
  identities (requires admin we don't hold).
- Shared analyst flow: one flow + `MICROMIND_ANALYST_API_KEY`, all tenants.

## BYOF-everything: link any flow (no management token required)

ORBIT hosts zero AI. Every flow — channel or analyst — is a **link record**:
`micromind_flows { purpose, label, source, external_flow_id,
prediction_key_credential_id, last_test_* }` (`009_flow_link_registry.sql`).

**Link-any-flow recipe (per flow, MicroMind GUI):**
1. Build/duplicate the flow in MicroMind.
2. Flip it **ACTIVE** (inactive flows 403 every prediction).
3. Assign a prediction key (flow's API protection setting) — mint per tenant.
4. Copy the **flow id** (from the prediction URL) and the **key value**.
5. In ORBIT: connect form (channels) or workspace analyst setting →
   paste both → ORBIT vaults the key, links the row, and runs a harmless
   test ping (`Reply with exactly: OK`) automatically.

**Validation vocabulary** (`last_test_status` on every row): `test_ok` |
`invalid_key` (401 — wrong key) | `inactive` (403 — flip ACTIVE) |
`blocked` (403 other) | `model_error` (500 — fix the model credential) |
`unreachable` (network) | `skipped` (no key stored yet).

**Key rotation:** paste the new key (Settings → channel → Replace key);
ORBIT swaps the vault ref and re-tests. The old vault row is left in place
by design — **revoke the old key inside MicroMind GUI manually**, since
ORBIT holds no management token and will never pretend to delete server-side.

**Analyst resolution order:** per-workspace override
(`workspace_settings.analyst_flow_id` + vaulted key) → shared env link
(`MICROMIND_ANALYST_FLOW_ID` + `MICROMIND_ANALYST_API_KEY`) → legacy
messenger-flow fallback → local template fallback. Callers pass
`pool + workspaceId` to `askAnalyst()`.

## Track 2 — bypass-killer changes (2026-09-19, uncommitted)

Live triage (via Codex-relayed Meta MCP) proved both production subscriptions
point at MicroMind (`core.aimicromind.com/...`), so ORBIT received zero events,
and the MicroMind-direct replies died on placeholder page tokens. Fixes:

- **App-level verify tokens** (`server/channels/routes.js`): connect no longer
  appends a random suffix — Meta holds ONE token per app, so the token is the
  stable `defaultVerifyToken` (`orbit_messenger_2026` /
  `orbit_instagram_verify`). Per-event routing stays via
  `entry.id → channel_accounts.external_account_id`. Explicit body
  `verifyToken` still overrides.
- **Setup-guide rewrite** (`orbitSetupGuide()` + provision-time stamp in
  `buildTenantFlowData`, shipped `messenger.json`/`instagram.json` patched):
  clones and reference files now instruct Meta → `{ORBIT_BACKEND_URL}/
  webhooks/{messenger,instagram}` with the app-level token, and forbid tokens
  inside flows. Backend URL resolves from `ORBIT_BACKEND_URL` →
  `RAILWAY_PUBLIC_DOMAIN` → `https://YOUR-ORBIT-BACKEND` placeholder.
  (`scripts/patch-template-guides.mjs` kept for future re-stamps.)
- **Send-tool stripping extended** (`STRIP_SEND_TOOLS`): messenger
  (`facebookMessengerTool`) + instagram (`instagramMessenger`) join telegram —
  verified against template `tools` arrays (`{{..._0.data.instance}}` refs).
  Clone check: `tools=[]`, verify token injected, guide + business ctx present
  (both channels, `scripts/verify-clone` ad-hoc run).
- **Reply-shape hardening** (`extractReplyText()` in `server/webhooks/routes.js`):
  `string | text | json.{answer,text,output} | answer`; unknown shapes log keys
  and fall back to the generic acknowledgement.
- **Probe re-run:** all 5 checks PASS after the changes (no regressions).
- **DB gate cleared 2026-09-20:** `pg_hba` whitelist applied, `test_db.cjs`
  connects; `npm run db:migrate` applied pending `009/010/011`; triage reads:
  `webhook_events` = 0 rows, `channel_accounts` = 0 rows, `micromind_flows` =
  0 rows, one `default` workspace — data-layer proof Meta never delivered to
  ORBIT and all connections were manual-in-MicroMind. Server boots,
  `/api/health` → `online`, DB `connected:true` (PG 18.6).
- **Supabase cutover 2026-09-25 (replaces VPS Postgres):** project
  `hakpywamwyyquhdzneyn` (eu-west-1). Schema built via Supabase MCP migrant:
  base + `001`–`011` (plain SQL, no extensions — fully compatible), 30 tables,
  seeds (`default` workspace/settings, `business_settings` id=1). Advisors:
  only default RLS-policy noise (irrelevant — backend is `postgres` role, no
  PostgREST). `.env` → Session-pooler URI; ledger synced via `npm run
  db:migrate` (idempotent re-run). Backend health on Supabase: `online`,
  PG 17.6, `connected:true`.
- **Tier-1 simulation 2026-09-25 (Supabase, simulated-only):** fake Page token +
  open reference flow, fabricated Meta POST → `EVENT_RECEIVED`. PASS:
  journaled `processed`, account routing, customer/conversation/message rows.
  FAIL (external): `predict()` → MicroMind 500/402 `Insufficient credits` —
  pipeline reached the model correctly; the OpenRouter balance is empty.
  **Action: top up OpenRouter credit, then re-run sim.** All `sim_*` rows
  deleted afterwards (tables back to zero); temp scripts removed.
- **Production single-DB + deploy 2026-09-25:** Railway backend
  (`omnichat-production-65a3.up.railway.app`, commit `29674c5`) switched from
  Railway Postgres to Supabase (`DATABASE_URL` + `PGSSLMODE` + new
  `ORBIT_BACKEND_URL` via Railway MCP; health `online`, PG 17.6,
  `connected:true`). Vercel (`orbit-xi-one-60.vercel.app`) serves `/privacy`
  + `/terms` (200). Meta handshakes verified live against Railway for both
  messenger (`orbit_messenger_2026`) and instagram (`orbit_instagram_verify`)
  tokens — portal verification will pass. `vercel.json` rewrites retargeted
  VPS → Railway. Still open: Vercel `VITE_API_URL` dashboard value (frontend
  falls back to `localhost:5000/api` without it), OpenRouter credit top-up,
  real DPO contact.