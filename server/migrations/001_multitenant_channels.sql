-- 001: ORBIT multi-tenant channel connection foundation (MVP: single default workspace, no auth).
-- Idempotent: safe to run on every boot via server/migrate.js.

-- 0. Migration ledger
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Workspaces (auth skipped for MVP: everything resolves to 'default')
CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'pro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO workspaces (id, name, plan)
VALUES ('default', 'Default Workspace', 'pro')
ON CONFLICT (id) DO NOTHING;

-- Per-workspace business/AI context (feeds flow provisioning + runtime vars)
CREATE TABLE IF NOT EXISTS workspace_settings (
  workspace_id VARCHAR(50) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  business_name VARCHAR(255) DEFAULT 'ORBIT Omnichannel Store',
  timezone VARCHAR(100) DEFAULT 'Africa/Cairo',
  language VARCHAR(50) DEFAULT 'Arabic',
  ai_tone VARCHAR(50) DEFAULT 'Friendly',
  business_type VARCHAR(100) DEFAULT 'Retail',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backfill from legacy singleton row (id=1) when present
INSERT INTO workspace_settings (workspace_id, business_name, ai_tone, language)
SELECT 'default',
       COALESCE(b.business_name, 'ORBIT Omnichannel Store'),
       COALESCE(b.ai_tone, 'Friendly'),
       COALESCE(b.ai_language, 'Arabic')
FROM business_settings b WHERE b.id = 1
ON CONFLICT (workspace_id) DO NOTHING;

-- 2. Credential vault (encrypted secrets live ONLY here; API never returns them)
CREATE TABLE IF NOT EXISTS credentials (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'meta_messenger' | 'meta_instagram' | 'openrouter' | ...
  encrypted_secret TEXT NOT NULL, -- AES-256-GCM envelope, see server/credentials/crypto.js
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_credentials_workspace ON credentials(workspace_id);

-- 3. Channel accounts: one row per workspace x connected channel
CREATE TABLE IF NOT EXISTS channel_accounts (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'messenger' | 'instagram' | 'whatsapp' | ...
  external_account_id VARCHAR(255), -- Page ID / IG Business ID
  display_name VARCHAR(255),
  username VARCHAR(255),
  credential_id VARCHAR(50) REFERENCES credentials(id) ON DELETE SET NULL,
  micromind_flow_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending|connecting|active|expired|error|disconnected
  metadata JSONB DEFAULT '{}', -- { verify_token, webhook_name, ... } (NO raw tokens)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, channel, external_account_id)
);
CREATE INDEX IF NOT EXISTS idx_channel_accounts_workspace ON channel_accounts(workspace_id);

-- 4. MicroMind flow registry: workspace -> channel account -> dedicated flow
CREATE TABLE IF NOT EXISTS micromind_flows (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_account_id VARCHAR(50) REFERENCES channel_accounts(id) ON DELETE SET NULL,
  external_flow_id VARCHAR(255) NOT NULL,
  template VARCHAR(50) NOT NULL, -- 'messenger' | 'instagram'
  template_version VARCHAR(50) DEFAULT 'v1',
  config JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|disabled|error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. OAuth states (Meta connect flow; manual token connect also supported for MVP)
CREATE TABLE IF NOT EXISTS oauth_states (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  state VARCHAR(255) UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Webhook idempotency ledger (Meta retries must not duplicate messages)
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(50) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'messenger' | 'instagram'
  external_event_id VARCHAR(255) UNIQUE NOT NULL, -- mid
  workspace_id VARCHAR(50) REFERENCES workspaces(id) ON DELETE SET NULL,
  channel_account_id VARCHAR(50) REFERENCES channel_accounts(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'received', -- received|processed|failed|duplicate
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider, external_event_id);

-- 7. Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  workspace_id VARCHAR(50) REFERENCES workspaces(id) ON DELETE SET NULL,
  actor VARCHAR(100) DEFAULT 'system',
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tenant-scope existing tables (default workspace backfill; NOT NULL later with auth)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_account_id VARCHAR(50) REFERENCES channel_accounts(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_conversation_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_external_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'dashboard'; -- 'webhook' | 'dashboard' | 'ai'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50) DEFAULT 'default' REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id);
