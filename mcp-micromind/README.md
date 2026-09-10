# mcp-micromind — MCP server for the MicroMind AI platform

Model Context Protocol server exposing the operator's full MicroMind power:
tenant folders, flow lifecycle (clone/deploy/activate/delete), per-tenant
prediction keys, spending-capped predictions, and extended reads
(document stores, variables, assistants, analytics).

## Safety model (locked policy)

- **Reads are free.** Creates and predictions require the user's explicit ask.
- **Prediction additionally requires a spending cap** (`maxCalls`, `maxChars`)
  supplied per invocation; the tool stops itself at the cap.
- **Deletes, revokes, and secret writes require explicit per-call approval**,
  with a second confirmation for secret destruction.
- **Tenants are addressed by workspace, never bare flow IDs** — cross-tenant
  mistakes are structurally impossible.
- **Secrets never appear in tool output.** Key material is redacted; only
  references (credential/vault IDs) are returned.
- Every write is appended to a local audit log (`audit.log.jsonl`).

## Auth

Provisioner identity via environment (same pattern as the ORBIT backend):

```text
MICROMIND_BASE_URL=https://core.aimicromind.com/api/v1
MICROMIND_PROVISIONER_EMAIL=<ops account>
MICROMIND_PROVISIONER_PASSWORD=<ops password>
```

Login yields a ~24h JWT, cached and auto-refreshed (single-flight) on expiry
or any 401. Static `MICROMIND_API_KEY` is honored as fallback.

## Tools

| Tier | Tools |
|---|---|
| read | `micromind_health`, `micromind_list_folders`, `micromind_list_flows`, `micromind_get_flow`, `micromind_list_keys`, `micromind_get_variable`, `micromind_list_assistants`, `micromind_analytics` |
| write (ask required) | `micromind_create_folder`, `micromind_clone_flow`, `micromind_activate_flow`, `micromind_mint_key`, `micromind_link_key`, `micromind_predict`, `micromind_set_variable`, `micromind_upsert_document` |
| destructive (explicit approval) | `micromind_delete_flow`, `micromind_revoke_key`, `micromind_delete_folder` |

## Proving ground

Live runs touch `PROBE_DELETE_ME` assets only. Full lifecycle proof:
folder → clone → link → capped prediction → revoke → delete → ledger empty.
