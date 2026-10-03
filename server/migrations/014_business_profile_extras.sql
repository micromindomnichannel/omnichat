-- 014: business profile extras (single merged signup form).
-- logo_url + country had no column anywhere (logo never reached the DB).
-- Idempotent via schema_migrations ledger.

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Egypt';
