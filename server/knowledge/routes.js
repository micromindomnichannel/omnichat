// Workspace knowledge base: FAQs, policies, product/service notes.
// Feeds AI prompts at provision time and runtime vars (Phase 8 of the plan).
import express from 'express';
import { askAnalyst } from '../micromind/analyst.js';
import { requireAuth, requireWorkspace, workspaceFor } from '../auth/middleware.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const KINDS = ['faq', 'policy', 'product', 'service', 'note'];

export function knowledgeRouter(pool) {
  const r = express.Router();
  // Path-scoped (see channels router): only /api/v1 routes need the session.
  r.use('/api/v1', requireAuth);

  r.get('/api/v1/workspaces/:workspaceId/knowledge', requireWorkspace, async (req, res) => {
    try {
      const { kind } = req.query;
      const params = [req.workspaceId];
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

  r.post('/api/v1/workspaces/:workspaceId/knowledge', requireWorkspace, async (req, res) => {
    const { kind = 'faq', title, content, metadata } = req.body || {};
    if (!KINDS.includes(kind)) return res.status(400).json({ error: `kind must be one of ${KINDS.join(',')}` });
    if (!title || !content) return res.status(400).json({ error: 'title + content required' });
    try {
      const { rows } = await pool.query(
        'INSERT INTO knowledge_items (id, workspace_id, kind, title, content, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [rid('kn'), req.workspaceId, kind, title, content, JSON.stringify(metadata || {})]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.delete('/api/v1/knowledge/:id', async (req, res) => {
    try {
      const row = (await pool.query('SELECT workspace_id FROM knowledge_items WHERE id=$1', [req.params.id])).rows[0];
      const workspaceId = workspaceFor(req, row?.workspace_id);
      if (!workspaceId) return res.status(404).json({ error: 'not found' });
      await pool.query('DELETE FROM knowledge_items WHERE id=$1 AND workspace_id=$2', [req.params.id, workspaceId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ask the knowledge base. Primary: MicroMind analyst with the workspace's
  // items + FAQs injected as context. Fallback: local keyword match over the
  // same data (works offline / when the model is down). Never 500s.
  r.post('/api/v1/workspaces/:workspaceId/knowledge/ask', requireWorkspace, async (req, res) => {
    const { question } = req.body || {};
    if (!question || !String(question).trim()) return res.status(400).json({ error: 'question required' });
    const q = String(question).slice(0, 1000);
    const workspaceId = req.workspaceId;

    let items = [], faqs = [], business = '';
    try {
      items = (await pool.query(
        'SELECT kind, title, content FROM knowledge_items WHERE workspace_id=$1 ORDER BY updated_at DESC LIMIT 50',
        [workspaceId])).rows;
      faqs = (await pool.query('SELECT question, answer FROM faqs LIMIT 50')).rows;
      business = (await pool.query('SELECT business_name FROM workspace_settings WHERE workspace_id=$1', [workspaceId]))
        .rows[0]?.business_name || '';
    } catch { /* fallbacks below run on empty context */ }

    const context = [
      ...faqs.map((f) => `FAQ — Q: ${f.question} A: ${f.answer}`),
      ...items.map((i) => `${i.kind} — ${i.title}: ${i.content}`),
    ].join('\n').slice(0, 12000);

    try {
      const out = await askAnalyst(
        `Answer this customer question for ${business || 'our business'} using ONLY the knowledge below. ` +
        `If the answer is not in the knowledge, say so briefly. Question: ${q}`,
        {
          vars: { business_name: business || undefined, knowledge: context || '(empty)' },
          sessionId: `${workspaceId}:analyst:kb:${Date.now()}`,
        }
      );
      return res.json({ answer: out.text, source: 'micromind' });
    } catch (err) {
      // Local keyword fallback over FAQs + knowledge items.
      const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const score = (t) => words.reduce((n, w) => n + (String(t).toLowerCase().includes(w) ? 1 : 0), 0);
      const cands = [
        ...faqs.map((f) => ({ s: score(`${f.question} ${f.answer}`), a: f.answer })),
        ...items.map((i) => ({ s: score(`${i.title} ${i.content}`), a: i.content })),
      ].filter((c) => c.s > 0).sort((a, b) => b.s - a.s);
      if (cands.length) return res.json({ answer: cands[0].a, source: 'local-match' });
      return res.json({
        answer: 'I could not find an answer in the knowledge base, and the AI service is unreachable right now.',
        source: 'none', analystError: String(err.message).slice(0, 200),
      });
    }
  });

  return r;
}
