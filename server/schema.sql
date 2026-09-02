-- ORBIT Omnichannel PostgreSQL Database Schema
-- Database: omnichannel

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar TEXT,
  channels TEXT[],
  governorate VARCHAR(100),
  total_spent NUMERIC(12,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  vip_status BOOLEAN DEFAULT false,
  tags TEXT[],
  reliability_score INT DEFAULT 95,
  reliability JSONB,
  customer_since VARCHAR(50),
  status VARCHAR(50) DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  unread_count INT DEFAULT 0,
  ai_enabled BOOLEAN DEFAULT true,
  confidence_score INT DEFAULT 90,
  status VARCHAR(50) DEFAULT 'ai_handling',
  intent VARCHAR(50) DEFAULT 'purchase',
  last_message TEXT,
  last_message_time VARCHAR(50),
  ai_context JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'customer', 'ai', 'human', 'system'
  content TEXT NOT NULL,
  timestamp VARCHAR(50),
  agent_name VARCHAR(100),
  is_arabic BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  product_id VARCHAR(50),
  product_name VARCHAR(255),
  variant VARCHAR(100),
  quantity INT DEFAULT 1,
  total NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  date VARCHAR(50),
  payment_method VARCHAR(50) DEFAULT 'COD',
  governorate VARCHAR(100),
  address TEXT,
  confirmed_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  service_id VARCHAR(50),
  service_name VARCHAR(255),
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  duration INT DEFAULT 30,
  doctor_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  sku VARCHAR(100),
  image TEXT,
  variants JSONB,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  duration INT DEFAULT 30,
  category VARCHAR(100),
  description TEXT,
  availability JSONB,
  available BOOLEAN DEFAULT true
);

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

CREATE TABLE IF NOT EXISTS business_settings (
  id INT PRIMARY KEY DEFAULT 1,
  business_name VARCHAR(255) DEFAULT 'ORBIT Omnichannel Store',
  industry VARCHAR(100) DEFAULT 'Retail',
  description TEXT,
  ai_enabled BOOLEAN DEFAULT true,
  ai_tone VARCHAR(50) DEFAULT 'Friendly',
  ai_language VARCHAR(50) DEFAULT 'Both',
  ai_handoff_rules TEXT[],
  confidence_threshold INT DEFAULT 70,
  working_hours JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_schedules (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_text TEXT NOT NULL,
  media_url TEXT,
  platforms TEXT[] NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summary_reports (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  period VARCHAR(50) DEFAULT 'weekly',
  report_type VARCHAR(50) DEFAULT 'on_demand',
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  ai_resolution_rate NUMERIC(5,2) DEFAULT 0,
  top_channel VARCHAR(50) DEFAULT 'instagram',
  metrics_summary JSONB,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
