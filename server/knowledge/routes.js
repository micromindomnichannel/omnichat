// Workspace knowledge base: FAQs, policies, product/service notes.
// Feeds AI prompts at provision time and runtime vars (Phase 8 of the plan).
import express from 'express';

const WORKSPACE = 'default'; // MVP stub — same single-workspace rule as channels
const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const KINDS = ['faq', 'policy', 'product', 'service', 'note'];

export function knowledgeRouter(pool) {
  const r = express.Router();

  r.get('/api/v1/workspaces/:workspaceId/knowledge', async (req, res) => {
    try {
      const { kind } = req.query;
      const params = [WORKSPACE];
      let sql = 'SELECT * FROM knowledge_items WHERE workspace_id=$1';
      if (kind) {
        sql += ' AND kind=$2';
        params.push(String(kind));
      }
      const { rows } = await pool.query(sql + ' ORDER BY updated_at DESC', params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/api/v1/workspaces/:workspaceId/knowledge', async (req, res) => {
    const { kind = 'faq', title, content, metadata } = req.body || {};
    if (!KINDS.includes(kind)) return res.status(400).json({ error: `kind must be one of ${KINDS.join(',')}` });
    if (!title || !content) return res.status(400).json({ error: 'title + content required' });
    try {
      const { rows } = await pool.query(
        'INSERT INTO knowledge_items (id, workspace_id, kind, title, content, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [rid('kn'), WORKSPACE, kind, title, content, JSON.stringify(metadata || {})]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.delete('/api/v1/knowledge/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM knowledge_items WHERE id=$1 AND workspace_id=$2', [req.params.id, WORKSPACE]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}
