-- 005: self-service password reset tokens.
-- Token delivery is pluggable: SMTP_* env sends email; otherwise the token is
-- server-logged (dev only — see POST /api/auth/forgot). Only the SHA-256 of
-- the token is stored. Idempotent via schema_migrations ledger.

CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
