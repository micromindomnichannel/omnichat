---
name: micromind
description: Operate the MicroMind AI platform (folders, flows, prediction keys, capped predictions, document stores, variables, assistants, monitoring) with full user power and tiered confirmations. Use whenever the task touches MicroMind flows, tenant provisioning, prediction testing, key rotation, or platform inspection.
version: 1.0.0
---

# MicroMind Skill

MCP-backed operator for the MicroMind AI platform (`mcp-micromind` server,
stdio transport, registered in `opencode.json` as `micromind`).

## Routing rule

- **Backend code first**: ORBIT's `server/micromind/*` modules own tenant logic
  (provisioning, vaulting, session rules). Edit those for behavior changes.
- **MCP for live-platform actions**: inspect, provision, test, rotate, or delete
  real MicroMind resources. Never reimplement what the MCP exposes.

## Auth

Provisioner identity via environment (`MICROMIND_PROVISIONER_EMAIL` /
`MICROMIND_PROVISIONER_PASSWORD` → ~24h JWT, auto-refresh, single-flight).
Static `MICROMIND_API_KEY` fallback. Run `micromind_health` first in any
session touching live resources.

## Tool tiers (locked policy — no exceptions)

| Tier | Rule | Tools |
|---|---|---|
| read | Free, no confirmation | `micromind_health`, `micromind_list_folders`, `micromind_list_flows`, `micromind_get_flow`, `micromind_list_keys`, `micromind_list_variables`, `micromind_get_variable`, `micromind_list_assistants`, `micromind_list_document_stores`, `micromind_monitoring` |
| write | Requires the user's explicit ask per invocation | `micromind_create_folder`, `micromind_clone_flow`, `micromind_update_flow`, `micromind_activate_flow`, `micromind_mint_key`, `micromind_link_key`, `micromind_set_variable`, `micromind_query_documents` |
| predict | Explicit ask **plus** a spending cap `{maxCalls, maxChars}` supplied by the user; first live send per flow requires a `dryRun` preview (enforced in code) | `micromind_predict` (deterministic `sessionId` mandatory — random sessions rejected) |
| destructive | `confirm:"CONFIRM"` in the call **plus** explicit user approval; secret destruction needs a second confirmation | `micromind_delete_flow`, `micromind_revoke_key`, `micromind_delete_folder` |

## Invariants

1. **Tenants by workspace, never bare IDs.** Resolve tenant → folder/flow/key
   through ORBIT's mapping (`channel_accounts` / `micromind_flows`) before
   calling. A flow ID without a tenant context is a refused call.
2. **Secrets never surface.** Key values, tokens, passwords, and variable
   values are redacted from all output. Key *references* (record IDs) are the
   only thing that travels. Credential scope beyond prediction keys
   (provider credentials) is per-call user-determined.
3. **Spending caps are pre-gates**, tracked per flow, across calls. Dry runs
   are always free and always precede first live sends.
4. **Folders organize; they don't isolate.** Tenancy is backend-enforced.
   Never describe a folder as a security boundary.
5. **Audit everything.** Every write-tier call appends to `audit.log.jsonl`.
6. **Proving ground.** Live runs touch `PROBE_DELETE_ME` assets only, full
   lifecycle: folder → clone → link → capped prediction → revoke → delete.

## Recipes

**New tenant onboard:** `create_folder` → `mint_key` → `clone_flow`
(template + `verifyToken` + `promptContext` + `folderId` + `deployed:true` +
`apikeyid`) → `activate_flow` (GET-assert, flip-once) → record IDs in ORBIT.

**Prediction test:** `predict(dryRun:true)` → show payload → user approves +
cap → live send → report text + usage vs cap.

**Key rotation:** `mint_key` → `link_key` (new record) → verify one prediction
→ `revoke_key` (old record, confirmed) → update ORBIT vault ref.

**Full teardown:** `revoke_key` → `delete_flow` (each, confirmed) →
`delete_folder` (confirmed) → verify list calls empty.

**Template registration:** export flow JSON from GUI → save under ORBIT
`server/micromind/templates/` → future `clone_flow` calls reference it.
