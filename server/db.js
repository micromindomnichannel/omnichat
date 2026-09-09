import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

// Railway / managed Postgres provide a single DATABASE_URL (preferred when set).
// SSL: enabled when PGSSLMODE=require or the URL demands it (managed providers
// terminate TLS with certs Node can't verify -> rejectUnauthorized:false).
function poolConfig() {
  const url = process.env.DATABASE_URL;
  const sslWanted = process.env.PGSSLMODE === 'require' || (url || '').includes('sslmode=require');
  const ssl = sslWanted ? { rejectUnauthorized: false } : undefined;
  if (url) {
    return {
      connectionString: url, ssl, max: 20,
      idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000,
    };
  }
  return {
    host: process.env.DB_HOST || '148.251.171.147',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'omnichannel',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export const pool = new Pool(poolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function checkDbConnection() {
  try {
    const res = await pool.query('SELECT current_database(), current_user, version()');
    return {
      connected: true,
      database: res.rows[0].current_database,
      user: res.rows[0].current_user,
      version: res.rows[0].version
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}
