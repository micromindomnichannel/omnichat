-- 002: plans bookkeeping + per-workspace knowledge base (feeds AI prompts/vars).
-- Idempotent via schema_migrations ledger.

-- Usage counters (plan enforcement reads these; billing provider plugs in later)
CREATE TABLE IF NOT EXISTS workspace_usage (
  workspace_id VARCHAR(50) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  messages_month INT DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge items: FAQs, policies, products notes, services notes per workspace.
-- Surfaced to flows via runtime vars / prompt injection (Phase 8 of the plan).
CREATE TABLE IF NOT EXISTS knowledge_items (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL DEFAULT 'faq', -- faq | policy | product | service | note
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON knowledge_items(workspace_id);
