// DB connectivity check. Reads connection from env (DATABASE_URL or DB_*),
// falling back to the local dev defaults. Usage: `node test_db.cjs`
require('dotenv').config();
const { Client } = require('pg');

function clientFor(database) {
  if (process.env.DATABASE_URL) {
    return new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  }
  return new Client({
    host: process.env.DB_HOST || '148.251.171.147',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database,
    connectionTimeoutMillis: 10000
  });
}

async function testConnection() {
  const targetDb = process.env.DB_NAME || 'omnichannel';
  console.log(`Connecting to PostgreSQL database "${targetDb}"...`);

  let client = clientFor(targetDb);
  try {
    await client.connect();
    console.log(`✅ Successfully connected to database "${targetDb}"!`);

    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database Info:', { database: dbInfo.rows[0].current_database, user: dbInfo.rows[0].current_user });

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Public Tables:', tables.rows.map(r => r.table_name));

    try {
      const mig = await client.query('SELECT version FROM schema_migrations ORDER BY version');
      console.log('Applied Migrations:', mig.rows.map(r => r.version));
    } catch {
      console.log('Applied Migrations: none (schema_migrations missing — run npm run db:migrate)');
    }

    await client.end();
  } catch (err) {
    console.error(`❌ Failed to connect to "${targetDb}":`, err.message);

    console.log('\nTesting connection to default "postgres" database...');
    const fallbackClient = clientFor('postgres');
    try {
      await fallbackClient.connect();
      console.log('✅ Connected to "postgres" database!');
      const dbs = await fallbackClient.query('SELECT datname FROM pg_database WHERE datistemplate = false');
      console.log('Available Databases on Server:', dbs.rows.map(r => r.datname));
      await fallbackClient.end();
    } catch (fbErr) {
      console.error('❌ Connection to postgres database also failed:', fbErr.message);
    }
  }
}

testConnection();
