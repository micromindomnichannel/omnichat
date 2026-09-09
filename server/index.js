import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool, checkDbConnection } from './db.js';
import { migrate } from './migrate.js';
import { channelsRouter } from './channels/routes.js';
import { webhooksRouter } from './webhooks/routes.js';
import { knowledgeRouter } from './knowledge/routes.js';
import { adminRouter } from './admin/routes.js';
import { billingRouter } from './billing/routes.js';
import { decryptSecret } from './credentials/crypto.js';
import { sendTextMessage } from './meta/graph.js';
import { sendWhatsAppText } from './meta/whatsapp.js';
import { sendTelegramText } from './integrations/telegram.js';
import { replyLimit } from './middleware/rateLimit.js';
import { askAnalyst } from './micromind/analyst.js';
import { authRouter } from './auth/routes.js';
import { requireAuth, workspaceFor } from './auth/middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: lock to explicit origins in production. MVP default allows local dev
// (Vite :3000) + non-browser callers (webhooks, curl have no Origin).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map((s) => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error(`CORS blocked for origin ${origin}`));
  },
}));
// Keep the raw body for Meta webhook signature verification (META_APP_SECRET).
app.use(express.json({
  limit: '25mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.set('pool', pool);

// Session auth for the legacy API. Public: /api/health, /api/auth/*.
// Everything else resolves the workspace from membership (never trusts 'default').
app.use('/api', (req, res, next) => {
  // Public: health, auth, and the Meta OAuth callback (Meta calls it cookieless).
  // Routers under /api/v1 run their own requireAuth — skip here to avoid double lookups.
  if (req.path === '/health' || req.path.startsWith('/auth/') ||
      req.path.startsWith('/v1/') || req.path.includes('/oauth/callback')) return next();
  requireAuth(req, res, () => {
    const wid = workspaceFor(req);
    if (!wid) return res.status(403).json({ error: 'no workspace access' });
    req.workspaceId = wid;
    next();
  });
});
app.use(authRouter(pool));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Image File Upload Endpoint
app.post('/api/upload', (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image file provided' });

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    // Accept only real image bytes (JPEG/PNG/GIF/WEBP magic numbers) — the
    // endpoint writes to disk served under /uploads, so reject anything else.
    const isImage =
      (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) || // JPEG
      (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) || // PNG
      (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) || // GIF
      (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'); // WEBP
    if (!isImage || !buffer.length) return res.status(400).json({ error: 'Only JPEG/PNG/GIF/WEBP images accepted' });
    const safeName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);
    const fileUrl = `http://localhost:5000/uploads/${safeName}`;

    res.json({ success: true, url: fileUrl, base64: imageBase64 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-Memory / File Fallback Store if PostgreSQL is re-connecting
const LOCAL_STORE_FILE = path.join(__dirname, 'local_db_cache.json');

function loadLocalStore() {
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf8'));
    } catch (e) {}
  }
  return null;
}

function saveLocalStore(data) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

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

// 2. Full Application Bootstrap (Loads all DB tables)
app.get('/api/bootstrap', async (req, res) => {
  try {
    const w = req.workspaceId;
    const products = (await pool.query('SELECT * FROM products WHERE workspace_id = $1 ORDER BY created_at DESC', [w])).rows;
    const services = (await pool.query('SELECT * FROM services WHERE workspace_id = $1', [w])).rows;
    const customers = (await pool.query('SELECT * FROM customers WHERE workspace_id = $1 ORDER BY created_at DESC', [w])).rows;
    const conversations = (await pool.query('SELECT * FROM conversations WHERE workspace_id = $1 ORDER BY updated_at DESC', [w])).rows;
    const messages = (await pool.query('SELECT * FROM messages WHERE workspace_id = $1 ORDER BY created_at ASC', [w])).rows;
    const orders = (await pool.query('SELECT * FROM orders WHERE workspace_id = $1 ORDER BY created_at DESC', [w])).rows;
    const appointments = (await pool.query('SELECT * FROM appointments WHERE workspace_id = $1 ORDER BY date DESC, time ASC', [w])).rows;
    const automations = (await pool.query('SELECT * FROM automations')).rows;
    const faqs = (await pool.query('SELECT * FROM faqs')).rows;
    const schedules = (await pool.query('SELECT * FROM content_schedules ORDER BY scheduled_time ASC')).rows;
    const reports = (await pool.query('SELECT * FROM summary_reports ORDER BY created_at DESC')).rows;
    const settings = (await pool.query('SELECT * FROM business_settings WHERE id = 1')).rows[0] || {};

    const payload = {
      products, services, customers, conversations, messages, orders,
      appointments, automations, faqs, schedules, reports, settings
    };

    saveLocalStore(payload);
    res.json(payload);
  } catch (err) {
    console.warn('⚠️ PostgreSQL query failed, using local sync cache:', err.message);
    const cached = loadLocalStore();
    if (cached) return res.json(cached);
    res.status(500).json({ error: err.message });
  }
});

// 3. Products Inventory API
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE workspace_id = $1 ORDER BY created_at DESC', [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { id, name, price, stock, category, sku, image, available } = req.body;
  const prodId = id || `p${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO products (id, workspace_id, name, price, stock, category, sku, image, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock,
       category = EXCLUDED.category, sku = EXCLUDED.sku, available = EXCLUDED.available
       RETURNING *`,
      [prodId, req.workspaceId, name, price, stock || 0, category || 'General', sku || `SKU-${Date.now()}`, image, available !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category, sku, available } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, price = $2, stock = $3, category = $4, sku = $5, available = $6
       WHERE id = $7 AND workspace_id = $8 RETURNING *`,
      [name, price, stock, category, sku, available, id, req.workspaceId]
    );
    res.json(result.rows[0] || req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1 AND workspace_id = $2', [id, req.workspaceId]);
    res.json({ success: true, message: `Product ${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Services API
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE workspace_id = $1', [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { id, name, price, duration, category, description, available } = req.body;
  const srvId = id || `s${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO services (id, workspace_id, name, price, duration, category, description, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, price = EXCLUDED.price, duration = EXCLUDED.duration,
       category = EXCLUDED.category, description = EXCLUDED.description, available = EXCLUDED.available
       RETURNING *`,
      [srvId, req.workspaceId, name, price, duration || 30, category || 'Consultation', description || '', available !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, duration, category, description, available } = req.body;
  try {
    const result = await pool.query(
      `UPDATE services SET name = $1, price = $2, duration = $3, category = $4, description = $5, available = $6
       WHERE id = $7 AND workspace_id = $8 RETURNING *`,
      [name, price, duration, category, description, available, id, req.workspaceId]
    );
    res.json(result.rows[0] || req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM services WHERE id = $1 AND workspace_id = $2', [id, req.workspaceId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Messages & Conversations API
app.get('/api/conversations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cust.name as customer_name, cust.avatar as customer_avatar
      FROM conversations c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      WHERE c.workspace_id = $1
      ORDER BY c.updated_at DESC
    `, [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/conversations/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND workspace_id = $3 RETURNING *',
      [status, id, req.workspaceId]
    );
    res.json(result.rows[0] || { id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { conversationId, message } = req.body;
  const msgId = message.id || `m_${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO messages (id, workspace_id, conversation_id, sender, content, timestamp, agent_name, is_arabic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [msgId, req.workspaceId, conversationId, message.sender, message.content, message.timestamp || new Date().toISOString(), message.agentName, message.isArabic || false]
    );

    // Update conversation last message & updated_at timestamp
    await pool.query(
      `UPDATE conversations SET last_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND workspace_id = $3`,
      [message.content, conversationId, req.workspaceId]
    );

    res.json({ success: true, messageId: msgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE workspace_id = $1 ORDER BY created_at DESC', [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, tags, status, governorate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers SET name = $1, phone = $2, tags = $3, status = $4, governorate = $5 WHERE id = $6 AND workspace_id = $7 RETURNING *`,
      [name, phone, tags, status, governorate, id, req.workspaceId]
    );
    res.json(result.rows[0] || req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE workspace_id = $1 ORDER BY created_at DESC', [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, customerId, productId, productName, total, status, paymentMethod, governorate, address } = req.body;
  const orderId = id || `ord_${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO orders (id, workspace_id, customer_id, product_id, product_name, total, status, date, payment_method, governorate, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10)
       RETURNING *`,
      [orderId, req.workspaceId, customerId, productId, productName, total, status || 'Confirmed', paymentMethod || 'COD', governorate || 'Cairo', address || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 AND workspace_id = $3 RETURNING *', [status, id, req.workspaceId]);
    res.json(result.rows[0] || { id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/ai-confirm', async (req, res) => {
  const { customer_id, customer_name, product_name, total, shipping_city, sku } = req.body;
  try {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(
      `INSERT INTO orders (id, workspace_id, customer_id, product_name, total, status, payment_method, governorate, confirmed_by_ai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderId, req.workspaceId, customer_id, product_name, total, 'Confirmed', 'COD', shipping_city || 'Cairo', true]
    );

    if (sku) {
      await pool.query('UPDATE products SET stock = GREATEST(0, stock - 1) WHERE sku = $1 AND workspace_id = $2', [sku, req.workspaceId]);
    }

    res.json({ success: true, order: result.rows[0], message: 'Order confirmed by AI and saved to database!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Appointments API
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments WHERE workspace_id = $1 ORDER BY date DESC, time ASC', [req.workspaceId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { id, customerId, serviceId, serviceName, date, time, status, doctorName } = req.body;
  const apptId = id || `apt_${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (id, workspace_id, customer_id, service_id, service_name, date, time, status, doctor_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [apptId, req.workspaceId, customerId, serviceId, serviceName, date, time, status || 'Confirmed', doctorName || 'Dr. Ahmed Hassan']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE appointments SET status = $1 WHERE id = $2 AND workspace_id = $3 RETURNING *', [status, id, req.workspaceId]);
    res.json(result.rows[0] || { id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Automations & FAQs API
app.post('/api/automations/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE automations SET active = NOT active WHERE id = $1 RETURNING *', [id]);
    res.json(result.rows[0] || { id, active: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faqs', async (req, res) => {
  const { id, question, answer, category } = req.body;
  const faqId = id || `faq_${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO faqs (id, question, answer, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [faqId, question, answer, category || 'General']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/faqs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM faqs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Content Scheduling API
app.get('/api/schedules', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content_schedules ORDER BY scheduled_time ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedules', async (req, res) => {
  const { title, content_text, media_url, platforms, scheduled_time } = req.body;
  const schedId = `sch_${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO content_schedules (id, title, content_text, media_url, platforms, scheduled_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
      [schedId, title, content_text, media_url, platforms || ['instagram', 'facebook'], scheduled_time]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM content_schedules WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Admin Executive Summary Reports
app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM summary_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports/generate', async (req, res) => {
  const { period = 'weekly', report_type = 'on_demand' } = req.body;
  const reportId = `rep_${Date.now()}`;
  try {
    // Real workspace stats (fall back to seed numbers when tables are empty/down).
    let totalRev = 68400, totalOrd = 98, aiRate = 78.5, topChannel = 'instagram', lowStock = [];
    const w = req.workspaceId;
    try {
      const orderStats = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total_rev FROM orders WHERE workspace_id = $1', [w]);
      totalRev = parseFloat(orderStats.rows[0]?.total_rev || 68400);
      totalOrd = parseInt(orderStats.rows[0]?.count || 98);
      const msgStats = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE sender = 'customer') AS c, COUNT(*) FILTER (WHERE sender = 'ai') AS a
         FROM messages WHERE workspace_id = $1`, [w]);
      const c = parseInt(msgStats.rows[0]?.c || 0), a = parseInt(msgStats.rows[0]?.a || 0);
      if (c > 0) aiRate = Math.round((a / (c + a || 1)) * 1000) / 10;
      const chStats = await pool.query(
        'SELECT channel, COUNT(*) AS n FROM conversations WHERE workspace_id = $1 GROUP BY 1 ORDER BY 2 DESC LIMIT 1', [w]);
      if (chStats.rows[0]?.channel) topChannel = chStats.rows[0].channel;
      lowStock = (await pool.query(
        'SELECT name, stock FROM products WHERE workspace_id = $1 AND stock < 5 ORDER BY stock ASC LIMIT 3', [w])).rows;
    } catch { /* stats fallback above */ }

    // Primary: MicroMind analyst reasons over the stats. Fallback: local template.
    let insights, aiSource = 'micromind';
    const statsBrief = `Period: ${period}. Revenue: ${totalRev} EGP across ${totalOrd} orders. ` +
      `AI-handled share: ${aiRate}%. Top channel: ${topChannel}. ` +
      `Low stock: ${lowStock.length ? lowStock.map((p) => `${p.name} (${p.stock})`).join(', ') : 'none flagged'}.`;
    try {
      const out = await askAnalyst(
        `Write a short executive business report (4-6 bullet lines) from these stats: ${statsBrief}`,
        { vars: { period, business_name: 'ORBIT workspace' }, sessionId: `${w}:analyst:report:${Date.now()}` }
      );
      insights = out.text;
    } catch (err) {
      aiSource = 'template';
      console.warn('[reports] analyst unavailable, template fallback:', err.message);
      insights = `ORBIT Business Performance Executive Report (${period.toUpperCase()}):
• Total Generated Revenue: ${totalRev.toLocaleString()} EGP across ${totalOrd} orders.
• AI Resolution Rate: ${aiRate}% across connected customer communication channels.
• Top Revenue Channel: ${topChannel} Direct.
• Stock Recommendation: ${lowStock.length ? `${lowStock[0].name} inventory is low. Re-stock immediately.` : 'Inventory levels look healthy.'}`;
    }

    try {
      const result = await pool.query(
        `INSERT INTO summary_reports (id, title, period, report_type, total_revenue, total_orders, ai_resolution_rate, top_channel, ai_insights, metrics_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [reportId, `ORBIT Executive Business Summary (${new Date().toLocaleDateString()})`, period, report_type,
         totalRev, totalOrd, aiRate, topChannel, insights, JSON.stringify({ ai_source: aiSource })]
      );
      res.json({ ...result.rows[0], ai_source: aiSource });
    } catch {
      // DB down but analyst answered: return insights unsaved rather than 500.
      res.json({
        id: reportId, title: 'ORBIT Executive Business Summary (unsaved — DB unreachable)',
        period, report_type, total_revenue: totalRev, total_orders: totalOrd,
        ai_resolution_rate: aiRate, top_channel: topChannel, ai_insights: insights,
        ai_source: aiSource, saved: false,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Business Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM business_settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const { business_name, industry, description, ai_enabled, ai_tone, ai_language, confidence_threshold } = req.body;
  try {
    const result = await pool.query(
      `UPDATE business_settings 
       SET business_name = $1, industry = $2, description = $3, ai_enabled = $4, ai_tone = $5, ai_language = $6, confidence_threshold = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1 RETURNING *`,
      [business_name, industry, description, ai_enabled, ai_tone, ai_language, confidence_threshold]
    );
    res.json(result.rows[0] || req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thread messages (realtime polling): workspace-checked, newest last.
app.get('/api/v1/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const conv = (await pool.query('SELECT workspace_id FROM conversations WHERE id=$1', [req.params.id])).rows[0];
    const workspaceId = workspaceFor(req, conv?.workspace_id);
    if (!workspaceId) return res.status(404).json({ error: 'conversation not found' });
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 500);
    const { rows } = await pool.query(
      'SELECT * FROM messages WHERE conversation_id=$1 AND workspace_id=$2 ORDER BY created_at ASC LIMIT $3',
      [req.params.id, workspaceId, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Human reply: dashboard -> ORBIT -> provider (never dashboard -> provider).
// Session-authenticated; workspace + channel account + credential resolved
// server-side, and the conversation must belong to the caller's workspace.
app.post('/api/v1/conversations/:id/reply', replyLimit, requireAuth, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const conv = (await pool.query('SELECT * FROM conversations WHERE id = $1', [id])).rows[0];
    const workspaceId = workspaceFor(req, conv?.workspace_id);
    if (!conv || !workspaceId) return res.status(404).json({ error: 'conversation not found' });
    const msgId = `m_${Date.now()}`;
    await pool.query(
      'INSERT INTO messages (id, workspace_id, conversation_id, sender, content, timestamp, source) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [msgId, workspaceId, id, 'human', String(text).slice(0, 2000), new Date().toISOString(), 'dashboard']
    );
    await pool.query('UPDATE conversations SET last_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [text, id]);

    // Best-effort provider send when the conversation is linked to a channel account.
    let sent = false;
    if (conv.channel_account_id) {
      const acc = (await pool.query('SELECT * FROM channel_accounts WHERE id = $1', [conv.channel_account_id])).rows[0];
      const senderId = conv.external_conversation_id || JSON.parse(conv.ai_context || '{}')?.senderId;
      if (acc?.credential_id && senderId) {
        const cred = (await pool.query('SELECT encrypted_secret, metadata FROM credentials WHERE id = $1', [acc.credential_id])).rows[0];
        if (cred) {
          const secret = decryptSecret(cred.encrypted_secret);
          if (acc.channel === 'messenger' || acc.channel === 'instagram') {
            await sendTextMessage({ pageAccessToken: secret, recipientId: senderId, text });
          } else if (acc.channel === 'whatsapp') {
            const phoneNumberId = cred.metadata?.phone_number_id || acc.metadata?.phone_number_id;
            await sendWhatsAppText({ token: secret, phoneNumberId, to: senderId, text });
          } else if (acc.channel === 'telegram') {
            await sendTelegramText({ botToken: secret, chatId: senderId, text });
          } else {
            throw new Error(`${acc.channel} send not implemented`);
          }
          sent = true;
        }
      }
    }
    res.json({ success: true, messageId: msgId, sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Channel connection + provider webhook + knowledge + admin routers (multi-tenant slice)
app.use(channelsRouter(pool));
app.use(webhooksRouter(pool));
app.use(knowledgeRouter(pool));
app.use(adminRouter(pool));
app.use(billingRouter(pool));

// Run pending migrations on boot (idempotent; warn-and-continue if DB is down)
try {
  await migrate();
} catch (err) {
  console.warn('⚠️ Migration skipped (DB unreachable):', err.message);
}

// Production guards: refuse to serve strangers without vault key + CORS allowlist.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.CRED_KEY || !/^[0-9a-fA-F]{64}$/.test(process.env.CRED_KEY || '')) {
    console.error('❌ CRED_KEY (64 hex chars) is required in production.');
    process.exit(1);
  }
  if (!process.env.CORS_ORIGIN) {
    console.error('❌ CORS_ORIGIN is required in production.');
    process.exit(1);
  }
}

app.listen(PORT, () => {
  console.log(`📡 ORBIT Omnichannel API Server running on port ${PORT}`);
  console.log(`🗄️ PostgreSQL Host: ${process.env.DB_HOST || '148.251.171.147'}:${process.env.DB_PORT || '5432'} (Database: ${process.env.DB_NAME || 'omnichannel'})`);
});
