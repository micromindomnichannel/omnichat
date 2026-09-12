-- 011: email OTP verification for signup.
-- A pending row holds the (already bcrypt-hashed) password + display name until
-- the 6-digit code is verified. Codes are sha256-hashed at rest, expire after
-- 10 minutes, and die after 5 failed attempts. One active row per email.
-- Idempotent via schema_migrations ledger.

CREATE TABLE IF NOT EXISTS signup_otps (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  attempts INT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON signup_otps(email);
