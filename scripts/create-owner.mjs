// Create the first owner account (registration closes after bootstrap).
// Usage: node scripts/create-owner.mjs --email=you@biz.com --password='<10+ chars>' [--name=Name]
// Requires DB up (runs migrations first).
import bcrypt from 'bcryptjs';
import { pool } from '../server/db.js';
import { migrate } from '../server/migrate.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);

const email = String(args.email || '').toLowerCase();
const password = String(args.password || '');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/create-owner.mjs --email=you@biz.com --password=\'<10+ chars>\' [--name=Name]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Password min 10 chars.');
  process.exit(1);
}

await migrate();
const id = `u_${Date.now()}`;
await pool.query('INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
  [id, email, await bcrypt.hash(password, 12), args.name || email.split('@')[0]]);
const user = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
await pool.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('default',$1,'owner') ON CONFLICT DO NOTHING",
  [user.id]);
console.log(`✅ Owner ready: ${email} (workspace default). Log in at /login.`);
process.exit(0);
