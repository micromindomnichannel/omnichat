-- 009: universal flow-link registry (BYOF-everything model).
-- Every linked MicroMind flow — provisioned OR pasted — is one row with a
-- purpose, a human label, its origin, and its last validation-test result.
-- Per-workspace analyst override lives on workspace_settings (env fallback kept).
-- Idempotent via schema_migrations ledger.

ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'channel';
ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS label VARCHAR(255);
ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'provisioned';
ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS last_test_status VARCHAR(50);

-- Backfill existing rows: channel purpose, label from template, origin from key presence.
UPDATE micromind_flows SET purpose = 'channel' WHERE purpose IS NULL;
UPDATE micromind_flows SET label = COALESCE(template, 'flow') WHERE label IS NULL;
UPDATE micromind_flows
SET source = CASE WHEN prediction_key_credential_id IS NULL THEN 'byof' ELSE 'provisioned' END
WHERE source IS NULL OR source = 'provisioned';

-- Per-workspace analyst override (NULL = fall back to MICROMIND_ANALYST_FLOW_ID env).
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS analyst_flow_id VARCHAR(255);
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS analyst_key_credential_id VARCHAR(50) REFERENCES credentials(id) ON DELETE SET NULL;
