import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkDbConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🚀 Connecting to PostgreSQL server 148.251.171.147:5432 (omnichannel DB)...');
  
  const status = await checkDbConnection();
  if (!status.connected) {
    console.error('❌ Connection Failed:', status.error);
    process.exit(1);
  }

  console.log(`✅ Connected! Database: "${status.database}" | User: "${status.user}"`);
  console.log(`PostgreSQL Version: ${status.version}`);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('\n📦 Executing DDL Schema script...');
  await pool.query(sql);
  console.log('✅ All PostgreSQL tables initialized successfully!');

  // Check tables count
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('\n📋 Created Tables in "omnichannel" Database:');
  res.rows.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.table_name}`));

  // Seed default business setting if not exists
  await pool.query(`
    INSERT INTO business_settings (id, business_name, industry, description, ai_enabled, ai_tone, ai_language, confidence_threshold)
    VALUES (1, 'ORBIT Store & Clinic', 'Retail & Healthcare', 'ORBIT Powered Omnichannel Business Platform', true, 'Friendly', 'Both', 70)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('\n🎉 Omnichannel Database Setup & Confirmation Complete!');
  process.exit(0);
}

initializeDatabase().catch(err => {
  console.error('❌ Error during DB initialization:', err);
  process.exit(1);
});
