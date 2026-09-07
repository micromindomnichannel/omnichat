-- 004: MicroMind tenant folder + prediction key refs (Option B, zero-touch).
-- Folders group each workspace's flows (verified: POST /api/v1/folders -> 201).
-- Prediction keys are per-tenant, vaulted in credentials like all secrets.
-- Idempotent via schema_migrations ledger.

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS micromind_folder_id VARCHAR(255);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS micromind_folder_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE micromind_flows ADD COLUMN IF NOT EXISTS prediction_key_credential_id VARCHAR(50) REFERENCES credentials(id) ON DELETE SET NULL;
