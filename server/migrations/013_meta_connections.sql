-- 013: Persist the Meta user authorization behind connected Page/Instagram assets.
-- Tokens remain encrypted in credentials; this table stores only linkage metadata.
CREATE TABLE IF NOT EXISTS meta_connections (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  meta_user_id VARCHAR(255) NOT NULL,
  meta_user_name VARCHAR(255),
  credential_id VARCHAR(50) REFERENCES credentials(id) ON DELETE SET NULL,
  scopes TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, meta_user_id)
);
CREATE INDEX IF NOT EXISTS idx_meta_connections_workspace ON meta_connections(workspace_id);

ALTER TABLE channel_accounts ADD COLUMN IF NOT EXISTS meta_connection_id VARCHAR(50)
  REFERENCES meta_connections(id) ON DELETE SET NULL;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS refreshed_at TIMESTAMP WITH TIME ZONE;
