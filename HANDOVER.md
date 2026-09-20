# ORBIT — Team Handover: Multi-Tenant Channel Connections

Date: 2026-09-20 | Branch: `main` | Author of record: alisa (with OpenCode agent)

## 1. What we are building

Every ORBIT business (workspace) connects its **own** Instagram / WhatsApp /
Messenger / Telegram / Gmail accounts. Each connection is **isolated** and gets
an **auto-provisioned MicroMind flow** (one dedicated flow per
`workspace × channel_account`). Everything is managed from the ORBIT frontend;
MicroMind/Flowise is never exposed to tenants.

Target architecture:

```
ORBIT Frontend (Vite :3000)
  → ORBIT Backend (Express :5000, control plane)
    → PostgreSQL (148.251.171.147:5432/omnichannel)
    → MicroMind API (https://core.aimicromind.com/api/v1, AI/execution layer)
      → Channel providers (Meta Graph, WhatsApp Cloud, Telegram Bot API, Gmail)
```

Key tenant rules (do not break these):

- `sessionId = "{workspaceId}:{channel}:{external_customer_id}"`
  (`buildSessionId()` in `server/micromind/provisionChannel.js`).
- Per-business context via prompt injection at provision time + `overrideConfig.vars`
  at runtime (`senderPsid|senderIgsid`, `input`, `business_name`, `ai_tone`, `language`).
- Flows are created with `deployed=true, isPublic=false`, inside the workspace's
  MicroMind folder, with a per-tenant prediction key linked (`apikeyid`).
- **The backend ALWAYS sends replies itself** (Graph / Cloud API / Bot API) with
  the tenant secret from the ORBIT vault. Cloned flows must never hold tenant
  channel secrets and must never execute channel send-tools (else: double
  messages + token leakage into MicroMind).

## 2. Current state (verified live, 2026-09-19/20)

### P0 MicroMind verification — COMPLETE (5/5 probe checks PASS)

- `npm run probe:micromind` → prediction + create→get→update→delete all PASS.
- Reference flow `f4a7c66d-dc4c-4f0b-b12d-4b6ca91fe0c8` answers (OpenRouter
  credential `orbit` fixed in MicroMind dashboard).
- Management auth = provisioner login (`MICROMIND_PROVISIONER_EMAIL/PASSWORD`
  in `.env` → 24h JWT, auto-refresh on 401). No static `MICROMIND_API_KEY` needed.
- `server/micromind/{client,provisioner}.js` read env **lazily** (dotenv in
  `server/index.js` runs after hoisted imports — module-level captures were
  silently empty in local dev; fixed).

### The inbox-silence root cause — FOUND AND PROVEN

Symptom: probe green, but connected Page/IG never answered and ORBIT inbox stayed empty.

1. **Bypass (Meta layer):** both Meta subscriptions (`Orbit` 1677448363989869,
   `test_ranim_Mess` 1522030056346232) point at MicroMind
   (`https://core.aimicromind.com/webhook/...`), NOT at ORBIT. Proven via the
   Meta Social Technologies MCP (relayed through Codex — OpenCode cannot
   authenticate to it: "Dynamic registration is not available for this client").
2. **Broken direct path:** the flows carry the sanitized `<PAGE_ACCESS_TOKEN>`
   placeholder, so MicroMind-side send-tools fail silently.
3. **Data-layer proof:** `webhook_events` = 0 rows, `channel_accounts` = 0 rows,
   `micromind_flows` = 0 rows. The pipeline was never fed — all connections were
   manual-in-MicroMind.
4. **Permissions landmine:** `Orbit` has `pages_messaging`, `instagram_basic`,
   `instagram_manage_messages` **Rejected**, dev mode, empty paperwork. The only
   app with policy artifacts (Drive privacy-policy link + terms) is
   `test_ranim_Mess` (Live, `messages` field delivering). No submission history
   exists on any app.

### Track 2 fixes — BUILT, VERIFIED, IN THIS COMMIT

- **App-level verify tokens** (`server/channels/routes.js`): connect stores the
  stable default (`orbit_messenger_2026` / `orbit_instagram_verify`), no random
  suffix — Meta holds ONE token per app; routing is per-event via Page ID.
- **Setup-guide rewrite** (`orbitSetupGuide()` + provision-time stamp in
  `buildTenantFlowData`; shipped `messenger.json`/`instagram.json` patched):
  guides now say Meta → `{ORBIT_BACKEND_URL}/webhooks/...` and forbid tokens in
  flows. URL resolves `ORBIT_BACKEND_URL` → `RAILWAY_PUBLIC_DOMAIN` → placeholder.
- **Send-tool stripping extended** (`STRIP_SEND_TOOLS`): messenger
  (`facebookMessengerTool`) + instagram (`instagramMessenger`) join telegram.
  Clone check passes for both channels (tools empty, token/guide/context present).
- **Reply-shape hardening** (`extractReplyText()` in `server/webhooks/routes.js`).
- **Docs/env:** `MICROMIND_API.md` changelog, `ORBIT_BACKEND_URL` in `.env.example`.
- `scripts/patch-template-guides.mjs` kept for future template re-stamps.

### Database — GATE CLEARED

- `148.251.171.147:5432/omnichannel` reachable after `pg_hba` whitelist of
  `156.197.40.219`. `test_db.cjs` connects (PG 18.6).
- Migrations `009/010/011` applied (`npm run db:migrate`); schema complete 001–011.
- Backend `:5000` boots, `/api/health` → `online` + DB connected; Meta handshake
  with the app token returns the challenge; unauthenticated connect → 401.
- Frontend `:3000` serves (200).

### Tooling notes for the teammate

- Meta MCP (`meta_social_technologies` in `opencode.json`, currently
  `enabled:false`) **cannot authenticate from OpenCode** (Meta rejects dynamic
  client registration; only Claude/Codex/ChatGPT/Cursor are supported). Meta
  reads were relayed via Codex CLI (`@openai/codex`, installed globally) with
  `~/.codex/config.toml` holding the server entry. Relay prompts live in the
  chat history — ask alisa for the P1–P5 set (rollback baseline, cutover, test-send).
- Codex CLI shim requires `C:\Users\alisa\AppData\Roaming\npm` on PATH
  (or full-path invocation); that dir was missing from PATH on this machine.
- Railway CLI (`@railway/cli`) is installed globally for backend checks.

## 3. Decisions already taken

- Production Meta app: **`test_ranim_Mess` (1522030056346232)**, renamed to
  `ORBIT` (guideline-safe per P1 check). It is Live, holds the only policy
  artifacts, and has proven `messages` delivery. `Orbit` stays as backup.
- Architecture: **ORBIT-owned loop** (Meta → ORBIT → predict → Graph send).
  MicroMind-direct rejected (no inbox, no isolation, silent failures).
- One Meta app serves all tenants (routing by Page ID); per-client apps deferred.

## 4. Next steps to production (in order)

### A. Portal + paperwork (owner: teammate with Meta admin, ~1–2h + review wait)

1. Rename `test_ranim_Mess` → `ORBIT`; fill category, icon, contact email, DPO.
2. Host privacy policy + terms on a real URL (NOT the Drive link — rejection
   predictor); swap into Basic Settings. (Alt: build an ORBIT `/privacy` route.)
3. Write down the FULL MicroMind callback URLs + verify token (portal GUI only;
   MCP redacts them) — rollback record, required before cutover.
4. Create test child app; start **Business Verification** (slowest item, first).
5. Record screencasts; submit Advanced Access (`pages_messaging` + deps,
   `instagram_basic`, `instagram_manage_messages`). 2–7 day turnaround.

### B. Backend URL + connect (needs Railway domain from alisa)

6. Set `ORBIT_BACKEND_URL` (Railway dashboard) to the verified-public domain.
7. Connect Page via ORBIT UI → expect `active` + link test `test_ok`.
8. Repeat for Instagram (IG Business account linked to the Page).

### C. Cutover day (together)

9. Portal: callback → `{BACKEND}/webhooks/messenger` + `orbit_messenger_2026`
   (instagram analog). KEEP the MicroMind subscription for now.
10. Live test (FB + IG): native reply + ORBIT inbox both sides +
    `webhook_events=processed`. Plus staged Codex P5 test-send.
11. Only when green: delete the MicroMind-direct subscription (kills double-send).
    Rollback = step A3 note if anything fails.

### D. Production hardening (code, post-cutover)

12. Set `META_APP_SECRET` (signature verification is warn-only today).
13. `COOKIE_SAMESITE=None` + `COOKIE_SECURE=1` for split-domain prod.
14. Confirm Railway DB target (same host → migrate there too; separate → document).
15. Schedule `GRAPH_VERSION` bump (`v19.0` vs platform `v26.0`).
16. Full probe + live-message round as acceptance gate.

## 5. Teammate onboarding (do this first, ~30 min)

Assumes: Node 20+, git access to this repo, the `.env` file shared securely
(never committed — ask alisa), IP whitelisted on the DB (`pg_hba`).

**Step 1 — Read (10 min).**
Read this file §1–§2. Skim `MICROMIND_API.md` (endpoint contract + tenant
rules). Do not change anything yet.

**Step 2 — Install + verify MicroMind link (5 min).**
```
npm install
npm run probe:micromind
```
Expect 5/5 PASS (`prediction`, `createFlow`, `getFlow`, `updateFlow`,
`deleteFlow`). If `prediction` FAILs with 500 OpenRouter key: the
`orbit` credential in MicroMind needs attention (see §2). If management
checks SKIP/401: `.env` provisioner credentials are missing or wrong.

**Step 3 — Verify database (5 min).**
```
node test_db.cjs
```
Expect: connect to `omnichannel`, 28 public tables, migrations `001`–`011`.
If connection fails with `pg_hba`: your public IP
(`curl ifconfig.me`) must be whitelisted on `148.251.171.147` first.
If migrations below `011`: run `npm run db:migrate`.

**Step 4 — Boot both servers (5 min).**
```
node server/index.js        # terminal 1 → expect /api/health online
npm run dev                 # terminal 2 → http://localhost:3000/ → 200
```
Health check: `curl http://localhost:5000/api/health` must show
`"status":"online"` and `"connected":true`. Handshake check:
`GET /webhooks/messenger?hub.mode=subscribe&hub.verify_token=orbit_messenger_2026&hub.challenge=x`
must echo `x`. Stop both servers when done (do not leave dev servers running).

**Step 5 — Pick up work.**
Re-read §4 above and take the next open item. Rules of the road:
- One dedicated flow per `workspace × channel_account`; never hand-edit a
  tenant flow in MicroMind GUI (re-provision instead).
- Tenant secrets live ONLY in the `credentials` vault — never in flows, logs,
  or chat.
- Run `npm run probe:micromind` after any `server/micromind/` change.
- Commit messages: `feat:` / `fix:` prefix, concise, matching repo style.
- Never commit `.env`, tokens, keys, or Page credentials.

## 6. Standing contacts / secrets map (where things live)

- MicroMind ops login: `.env` (`MICROMIND_PROVISIONER_*`, gitignored).
- Tenant channel tokens: `credentials` table (AES via `CRED_KEY`).
- Tenant prediction keys: `credentials` (`micromind_prediction`) ↔ `micromind_flows`.
- Meta app roles: alisa is Admin on all three apps (via Meta MCP reads).
- Never commit: `.env`, real tokens, prediction keys, Page tokens.
