// Meta webhook signature verification (X-Hub-Signature-256, HMAC-SHA256 over the
// raw body with the Meta App Secret). Enforced ONLY when META_APP_SECRET is set —
// set it as soon as the Meta app exists; until then the route logs a warning and
// relies on verify_token + idempotency. Forged inbound messages would otherwise
// create fake conversations AND trigger paid AI calls.
import crypto from 'crypto';

let warned = false;

export function verifyMetaSignature(req) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    if (!warned) {
      warned = true;
      console.warn('⚠️ META_APP_SECRET not set: Meta webhook signatures NOT verified. Set it before production.');
    }
    return true;
  }
  const sig = req.get('X-Hub-Signature-256') || '';
  const m = sig.match(/^sha256=([0-9a-f]{64})$/);
  if (!m || !req.rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest();
  const got = Buffer.from(m[1], 'hex');
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}
