-- 015: workspace invites (email invitation -> receiver accepts).
-- One active row per (workspace, email); tokens stored hashed, 7-day expiry.
CREATE TABLE IF NOT EXISTS workspace_invites (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agent', -- admin|agent
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  created_by VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invites_workspace ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON workspace_invites(email);
