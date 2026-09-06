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
- `management-crud` → SKIP/401 without `MICROMIND_API_KEY`; re-run with key
  to complete `create→get→update→delete` before building auto-provisioning.

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
