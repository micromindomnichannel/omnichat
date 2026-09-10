-- 006: repair legacy databases missing base tables (partial historical init).
-- All statements are IF NOT EXISTS: safe on complete databases (no-op there).

CREATE TABLE IF NOT EXISTS automations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  steps TEXT[],
  vertical VARCHAR(50) DEFAULT 'commerce'
);

CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(50) PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Agent',
  status VARCHAR(50) DEFAULT 'Active'
);
