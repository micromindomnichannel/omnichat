import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkDbConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      host: process.env.DB_HOST || '148.251.171.147',
      port: process.env.DB_PORT || '5432',
      name: process.env.DB_NAME || 'omnichannel',
      connected: dbStatus.connected,
      user: dbStatus.user,
      version: dbStatus.version,
      error: dbStatus.error
    }
  });
});

// 2. Customers Endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { id, name, phone, email, avatar, channel, governorate, total_spent, orders_count, vip_status, tags, reliability_score } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (id, name, phone, email, avatar, channel, governorate, total_spent, orders_count, vip_status, tags, reliability_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
       total_spent = EXCLUDED.total_spent, orders_count = EXCLUDED.orders_count
       RETURNING *`,
      [id, name, phone, email, avatar, channel || 'instagram', governorate, total_spent || 0, orders_count || 0, vip_status || false, tags || [], reliability_score || 95]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Conversations Endpoints
app.get('/api/conversations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cust.name as customer_name, cust.avatar as customer_avatar
      FROM conversations c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      ORDER BY c.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Orders Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, customer_id, customer_name, product_name, total, status, shipping_city, tracking_number } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO orders (id, customer_id, customer_name, product_name, total, status, shipping_city, tracking_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, customer_id, customer_name, product_name, total, status || 'pending', shipping_city, tracking_number]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Appointments Endpoints
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY date DESC, time ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Business Settings Endpoint
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM business_settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`📡 ORBIT API Server running on port ${PORT}`);
  console.log(`🗄️ PostgreSQL Host: ${process.env.DB_HOST || '148.251.171.147'}:${process.env.DB_PORT || '5432'} (Database: ${process.env.DB_NAME || 'omnichannel'})`);
});
