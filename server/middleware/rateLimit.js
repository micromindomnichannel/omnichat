// Minimal in-memory sliding-window rate limiter (no deps).
// Protects cost-sensitive endpoints (webhooks trigger paid AI calls).
// NOTE: per-process memory — sufficient for single-instance MVP; use Redis
// when running multiple backend instances.
const buckets = new Map();

function keyFor(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `${req.baseUrl || ''}${req.path}|${ip}`;
}

export function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyFor(req);
    let hits = buckets.get(key) || [];
    hits = hits.filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ error: 'rate_limited', retryAfterSec: Math.ceil(windowMs / 1000) });
    }
    hits.push(now);
    // Opportunistic cleanup to bound memory.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
    }
    buckets.set(key, hits);
    next();
  };
}

export const webhookLimit = rateLimit({ windowMs: 60_000, max: 300 });
export const replyLimit = rateLimit({ windowMs: 60_000, max: 60 });
