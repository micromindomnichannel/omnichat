-- 016: one live flow per channel account (duplicate backstop).
-- Reuse-before-provision (OAuth reconnect, manual connect) keeps a single
-- ACTIVE row per account; this partial unique index makes a second ACTIVE
-- row fail loudly instead of silently minting another MicroMind flow.
-- Disabled/error history rows are unaffected (audit preserved).
CREATE UNIQUE INDEX IF NOT EXISTS uq_micromind_flows_active_account
  ON micromind_flows (channel_account_id)
  WHERE status = 'active';
