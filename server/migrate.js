// Idempotent SQL migration runner. Runs *.sql from server/migrations in order,
// tracked in schema_migrations. Safe to call on every boot (skips applied).
// Usage: `node server/migrate.js` or `npm run db:migrate`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  // Fresh database? Bootstrap the base schema first (legacy db:init path does
  // this too — this makes `migrate` sufficient on Railway/Supabase/Neon).
  const base = await pool.query(
    "SELECT to_regclass('public.products') AS t, to_regclass('public.business_settings') AS s");
  if (!base.rows[0]?.t) {
    console.log('📦 base tables missing — applying schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ base schema applied');
  }
  if (!base.rows[0]?.s) {
    await pool.query(
      `INSERT INTO business_settings (id, business_name, industry, description, ai_enabled, ai_tone, ai_language, confidence_threshold)
       VALUES (1, 'ORBIT Store & Clinic', 'Retail & Healthcare', 'ORBIT Powered Omnichannel Business Platform', true, 'Friendly', 'Both', 70)
       ON CONFLICT (id) DO NOTHING`);
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);
  const { rows } = await pool.query('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.version));

  const dir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const ran = [];
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (applied.has(version)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version]);
      await client.query('COMMIT');
      ran.push(version);
      console.log(`✅ migration applied: ${version}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ migration failed: ${version}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }
  return ran;
}

// Allow direct invocation: node server/migrate.js
if (process.argv[1] && path.basename(process.argv[1]) === 'migrate.js') {
  migrate()
    .then((ran) => {
      console.log(ran.length ? `Done (${ran.join(', ')})` : 'Already up to date.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ migrate failed:', err?.message || err);
      process.exit(1);
    });
}
