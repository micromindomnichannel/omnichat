-- ORBIT Omnichannel PostgreSQL Database Schema
-- Database: omnichannel

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar TEXT,
  channel VARCHAR(50) DEFAULT 'instagram',
  governorate VARCHAR(100),
  total_spent NUMERIC(12,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  vip_status BOOLEAN DEFAULT false,
  tags TEXT[],
  reliability_score INT DEFAULT 95,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  unread_count INT DEFAULT 0,
  ai_enabled BOOLEAN DEFAULT true,
  confidence_score INT DEFAULT 90,
  status VARCHAR(50) DEFAULT 'active',
  last_message_text TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'user', 'agent', 'bot'
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  channel VARCHAR(50),
  confidence_score INT,
  intent VARCHAR(100),
  status VARCHAR(50) DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  customer_name VARCHAR(255),
  product_name VARCHAR(255),
  total NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'COD',
  shipping_city VARCHAR(100),
  tracking_number VARCHAR(100),
  confirmed_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  customer_name VARCHAR(255),
  service_name VARCHAR(255),
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
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
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  duration VARCHAR(50),
  category VARCHAR(100),
  available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS business_settings (
  id INT PRIMARY KEY DEFAULT 1,
  business_name VARCHAR(255) DEFAULT 'ORBIT Omnichannel Store',
  industry VARCHAR(100) DEFAULT 'Retail',
  description TEXT,
  ai_enabled BOOLEAN DEFAULT true,
  ai_tone VARCHAR(50) DEFAULT 'Professional',
  ai_language VARCHAR(50) DEFAULT 'Both',
  confidence_threshold INT DEFAULT 75,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Content Scheduling Across Platforms
CREATE TABLE IF NOT EXISTS content_schedules (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_text TEXT NOT NULL,
  media_url TEXT,
  platforms TEXT[] NOT NULL, -- e.g. ARRAY['instagram', 'facebook', 'whatsapp', 'tiktok']
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Admin Executive Summary Reports (On-demand or Scheduled)
CREATE TABLE IF NOT EXISTS summary_reports (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  period VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'custom'
  report_type VARCHAR(50) DEFAULT 'on_demand', -- 'on_demand', 'scheduled'
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  ai_resolution_rate NUMERIC(5,2) DEFAULT 0,
  top_channel VARCHAR(50) DEFAULT 'instagram',
  metrics_summary JSONB,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
