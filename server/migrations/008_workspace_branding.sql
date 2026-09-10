-- 008: workspace branding parity (mirrors the VPS edits).
-- Runs once via the ledger: sets the ORBIT business profile on databases that
-- were initialized with generic seeds (e.g. Railway Postgres). Does NOT touch
-- users, credentials, channels, or any tenant data — settings rows only.

UPDATE business_settings
SET business_name = 'ORBIT',
    industry = 'E-Commerce & Retail',
    description = 'ORBIT — Egypt E-Commerce',
    ai_enabled = true,
    ai_tone = 'Friendly',
    ai_language = 'Both',
    confidence_threshold = 70,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

INSERT INTO workspace_settings (workspace_id, business_name, ai_tone, language, business_type, updated_at)
VALUES ('default', 'ORBIT', 'Friendly', 'Both', 'E-Commerce & Retail', CURRENT_TIMESTAMP)
ON CONFLICT (workspace_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type,
  updated_at = CURRENT_TIMESTAMP;
