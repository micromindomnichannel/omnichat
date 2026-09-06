// Credential vault: AES-256-GCM envelope encryption for provider secrets.
// Key lives ONLY in backend env (CRED_KEY = 64 hex chars). Ciphertext is the only
// thing persisted (credentials.encrypted_secret). Plaintext is NEVER logged or
// returned through any API — it is decrypted transiently for Meta/MicroMind calls.
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const PREFIX = 'v1';

function getKey() {
  const hex = process.env.CRED_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, 'hex');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRED_KEY (64 hex chars) is required in production.');
  }
  // MVP dev fallback — stable per repo so local restarts keep working, NOT for prod.
  console.warn('⚠️ CRED_KEY missing: using dev-only fallback key. Set CRED_KEY for any real data.');
  return crypto.createHash('sha256').update('orbit-dev-cred-key-do-not-use-in-prod').digest();
}

export function encryptSecret(plaintext) {
  if (!plaintext) throw new Error('encryptSecret: empty plaintext');
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.');
}

export function decryptSecret(envelope) {
  const [prefix, ivB64, tagB64, ctB64] = String(envelope || '').split('.');
  if (prefix !== PREFIX || !ivB64 || !tagB64 || !ctB64) throw new Error('decryptSecret: bad envelope');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

export function generateCredKey() {
  return crypto.randomBytes(32).toString('hex');
}
