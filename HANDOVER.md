# ORBIT — Teammate Handover: Testing, Frontend & Website↔Core Linking

Date: 2026-10-04 | Branch: `main` (`acaab0e`, pushed, Railway SUCCESS) | Author of record: alisa (with OpenCode agent)

> **Scope of this document:** testing features + UI, frontend work, and linking
> the website with the ORBIT backend/Core. **Out of scope (do not touch):**
> Meta App Review / verifications, Gmail authentication, WhatsApp.
> (Previous Meta/Gmail/WhatsApp notes were moved out of this handover on purpose.)

## 1. What ORBIT is (30-second version)

AI omnichannel inbox for merchants: Messenger, Instagram, Telegram, and
Discord conversations arrive via webhooks/gateway → backend persists them →
MicroMind AI replies → reply is sent back to the provider → everything shows
in the web Inbox. The browser **never** talks to MicroMind or Meta directly;
all tokens live encrypted in the backend vault.

Live right now:

| Piece | Where | State |
|---|---|---|
| Frontend (Vite) | `https://orbit-xi-one-60.vercel.app` | Deployed from `main` |
| Backend (Express) | `https://omnichat-production-65a3.up.railway.app` | `online`, commit `acaab0e`, DB connected |
| Database | Supabase pooler (`aws-1-eu-west-1`, PG 17.6) | 10/10 webhook events `processed` |
| Messenger / Instagram | 2 workspaces × both channels | Live, AI replies in ~3s |
| Telegram / Discord | Connected via the new guided wizards (`@ORBIT_EG_Bot` + Discord bot) | Connected, awaiting full message tests |
| ORBIT Core (analyst flow for reports/knowledge) | MicroMind flow `3b2e8550…` | Prompt retargeted, test pings pass |

## 2. Setup (~30 min)

Assumes Node 20+, git access, and the `.env` file shared securely (never
committed — ask alisa). Your IP must reach Supabase (pooler, no whitelist
needed).

```bash
npm install
cp .env.example .env        # then fill from the shared secrets (ask alisa)
node test_db.cjs            # expect: Supabase connect, migrations ledger ok
npm run probe:micromind     # expect: 5/5 PASS (prediction + CRUD)
node server/index.js         # terminal 1 → :5000, /api/health online
npm run dev                  # terminal 2 → :3000
```

Key checks:

- `GET http://localhost:5000/api/health` → `"status":"online"`, `"connected":true`.
- `npm test` → 222 tests pass (34 files). `npm run build` → clean.
- Frontend talks to the backend via `VITE_API_URL` (default `http://localhost:5000/api`).

Rules of the road:

- One dedicated MicroMind flow per `workspace × channel_account` — never
  hand-edit a tenant flow in the MicroMind GUI (re-provision instead).
- Secrets live ONLY in the `credentials` vault / Railway vars / `.env`.
  Never commit `.env`, tokens, keys, or Page credentials. Never paste a
  secret into chat.
- Run `npm test` + `npm run build` before every push. `main` auto-deploys to
  Railway + Vercel on push.
- Commit style: `feat:` / `fix:` prefix, concise (see `git log`).

## 3. Testing checklist (features + UI)

Work top to bottom. For each item: do the action, note pass/fail + time.

### A. Inbox (highest priority — most recent fixes live here)

- [ ] Open Inbox → conversation list shows **customer names** (never raw `Thread #conv_…` ids) and friendly times (`5m`, `2h`, `Yesterday`).
- [ ] Click a Telegram row → thread **opens immediately** (fallback `Customer XXXXXX` is acceptable for ~10s, then the real name fills in).
- [ ] Click a Discord row → same as above.
- [ ] Click Messenger + Instagram rows → open with history + AI/human styling intact.
- [ ] With Inbox open, have someone send a new message on any channel → it appears **within ~10s with no manual refresh** (list + thread + unread badge).
- [ ] Reply from the composer → message sends (toast confirms), appears in thread.
- [ ] Take over a thread (Human) and return it to AI → status badge + system messages update.
- [ ] Channel filter pills (All / Messenger / Instagram / Telegram / Discord) hide rows but never merge identities.

### B. Overview dashboard

- [ ] "Recent Customer Threads" shows **customer names**, not `Thread #conv_…` ids; status badges read `AI Handling`/`Human`/`Resolved`.
- [ ] KPI cards + activity chart render from live data (no demo numbers).

### C. Settings → Channels (the connect wizards)

- [ ] Telegram card → Connect → wizard opens: Step 1 shows **Open @BotFather** (new tab) + exact `/newbot` → name → `bot`-username steps; Step 2 validates + connects; Step 3 shows `Connected as @bot` + webhook status.
- [ ] Discord card → Connect → wizard opens: Developer Portal steps incl. **Message Content Intent** + invite permissions; validate + connect; gateway-listener confirmation.
- [ ] Empty token → clear danger toast (no request sent).
- [ ] Invalid token → backend `invalid_bot_token` error surfaces, wizard stays (no junk account created).
- [ ] Connected card shows flow link + key link + last test; **Test link** button works.
- [ ] Disconnect → account inactive; Reconnect → same account/flow reused, **no new flow rows**.

### D. Admin (`/admin`, owner/admin role)

- [ ] Overview stats, MicroMind control plane, Channels table (status/flow/key/last test/convs/last webhook), Flows table, Templates table all load.
- [ ] Errors card lists failed/stuck intake with a **Retry** button per row; retry reports the outcome and refreshes (never duplicates — refusals say so explicitly).
- [ ] Usage table renders 30d counts.

### E. Auth + account flows

- [ ] Signup OTP email arrives; verify creates account + session.
- [ ] Login/logout; forgot-password sends a **real reset link email** (check inbox, link opens `/reset?token=…`); reset sets the new password.
- [ ] Wrong credentials / unknown email → clean errors, no enumeration (forgot always returns success).

### F. Regression safety after any change

- [ ] `npm test` green, `npm run build` clean, `git diff --stat` shows only related files.
- [ ] No duplicate conversations/customers/messages after polling for 5 minutes with the Inbox open.
- [ ] No console errors on Inbox/Overview/Settings/Admin pages.

## 4. Frontend tasks (where things live)

```
src/
  pages/            Overview, Inbox, Settings, Admin, Analytics, … (one file per page)
  pages/__tests__/  one test file per page — extend these, don't skip them
  components/
    inbox/          ConversationList, ConversationThread (+__tests__)
    settings/       ChannelsPanel, TelegramWizard, DiscordWizard (+__tests__)
    dash/kit.tsx    PageHeader, Card, Stat, SectionTitle (shared admin/dashboard UI)
    shared/         ChannelIcon, ChannelDot/Badge (channel identity — keep separate)
  services/api.ts   API client (VITE_API_URL, credentials:include, null-on-unreachable)
  services/normalize.ts  backend snake_case → UI models (+ formatListTime)
  state/store.tsx   useStore + reducer (SET_* actions; ADD_MESSAGE sync rules)
```

Conventions that matter:

- API client returns `null` when unreachable → UI shows last-synced/offline states. Never guess data.
- Inbox polls every 10s with `cache: 'no-store'` (`getConversations`, `getThreadMessages`, `getCustomers`). Don't reintroduce caching on this path.
- `lastMessageTime` is pre-formatted by `formatListTime` in `normalize.ts` — never render raw ISO in the UI.
- Channel identity stays separate everywhere (filtering hides, never merges).
- Tests: vitest + Testing Library, mocked `fetch`. New UI behavior needs a test in the co-located `__tests__` file.

## 5. Linking the website with the ORBIT Core

"The website" = Vercel frontend. "The core" = Railway backend + MicroMind AI layer. The link is three settings + one flow:

1. **API base:** `VITE_API_URL` (Vercel env) must equal `{backend}/api`. Local dev defaults to `http://localhost:5000/api`. If the site loads but all data is empty/offline, check this first.
2. **Backend health:** `GET {backend}/api/health` → `online` + `connected:true` + current commit hash. The startup log prints the real DB target (`DATABASE_URL` wins).
3. **CORS + cookies:** backend `CORS_ORIGIN` must list the exact frontend origin; cross-site prod needs `COOKIE_SAMESITE=None` + `COOKIE_SECURE=1` (Railway vars). Symptom of misconfiguration: login succeeds but `/auth/me` 401s.
4. **ORBIT Core analyst flow** (reports + knowledge answers): shared default flow `3b2e8550…` + `MICROMIND_ANALYST_API_KEY` (Railway vars; per-workspace override possible via `workspace_settings.analyst_flow_id`). Prompt was retargeted from an Instagram-channel prompt to an analyst prompt — do not point it at a channel flow. Verify with:
   ```
   node -e "import('dotenv').then(async({default:d})=>{d.config({path:'.env'});const{pool}=await import('./server/db.js');const{askAnalyst}=await import('./server/micromind/analyst.js');console.log(await askAnalyst('Reply with exactly: OK',{pool,workspaceId:'default'}));await pool.end();})"
   ```
   Expect `{ text:'OK', source:'micromind', … }`. If `source` falls back or it throws, the flow/key needs attention in MicroMind — ask alisa, don't rewire callers.

## 6. Explicitly out of scope (do not start these)

- **Meta App Review / verifications** — submissions, Advanced Access, Business Verification, permission paperwork (owner's portal work).
- **Gmail authentication** — placeholder slice (`501 gmail_pending`); needs Google OAuth + Pub/Sub.
- **WhatsApp** — parser/sender exist but template is draft/BYOF; needs Meta phone assets first.

If you hit anything Meta/Gmail/WhatsApp-shaped while testing, record it and hand it to alisa — don't attempt fixes in those areas.

## 7. Secrets map (where things live)

- Local dev: `.env` (gitignored) — provisioner login, analyst key, DB URL, `CRED_KEY`.
- Production: Railway variables (same names). Frontend: only `VITE_API_URL` (public, not secret).
- Tenant channel tokens / prediction keys: `credentials` table (AES via `CRED_KEY`) — never in flows, logs, or chat.
- MicroMind flows dashboard: `core.aimicromind.com` (ask alisa for access).
- Supabase dashboard: project tables + SQL (no RLS policies by design — backend connects as `postgres` role).

## 8. Done checklist for your first session

- [ ] Setup boots (§2), health `online`, tests green.
- [ ] Walk §3A–§3C, file pass/fail + times back to alisa.
- [ ] Confirm `VITE_API_URL` → Railway backend linkage (§5.1–5.3) from the deployed site.
- [ ] Run the §5.4 analyst ping, confirm `source:'micromind'`.
- [ ] Leave Meta/Gmail/WhatsApp alone (§6).
