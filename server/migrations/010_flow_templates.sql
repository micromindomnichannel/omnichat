-- 010: DB-backed flow templates (survives ephemeral filesystems).
-- Uploaded operator exports live here; files under server/micromind/templates/
-- remain the seed fallback. No seed rows: an absent row means "use the file".
-- Idempotent via schema_migrations ledger.

CREATE TABLE IF NOT EXISTS flow_templates (
  channel VARCHAR(50) PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  flow_data JSONB NOT NULL,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
