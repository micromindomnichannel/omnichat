-- 012: publish outcome tracking for scheduled posts (merges ORBIT Posts duties
-- into the main app). The Scheduler was compose-only; the publish-now endpoint
-- records per-platform provider ids here. Idempotent via schema_migrations ledger.

ALTER TABLE content_schedules ADD COLUMN IF NOT EXISTS result JSONB DEFAULT '{}';
ALTER TABLE content_schedules ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_schedules ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedules_workspace ON content_schedules(workspace_id);
