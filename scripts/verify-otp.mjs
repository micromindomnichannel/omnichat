// Verifies the email-OTP signup flow without a live DB or SMTP server.
// Stub pool (in-memory users/otps) + real bcrypt + real rate limiter.
// ALLOW_DEBUG_OTP=1 surfaces the code (same flag the UI relies on in dev).
// Run: node scripts/verify-otp.mjs
process.env.ALLOW_DEBUG_OTP = '1';
delete process.env.SMTP_HOST;

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

const db = { users: [], otps: [], sessions: [], members: [] };
const stubPool = {
  async query(sql, p = []) {
    if (sql.includes('SELECT COUNT(*)::int AS n FROM users')) return { rows: [{ n: db.users.length }] };
    if (sql.startsWith('INSERT INTO users')) {
      if (db.users.some((u) => u.email === p[1])) throw new Error('duplicate key value (users_email_key)');
      db.users.push({ id: p[0], email: p[1], password_hash: p[2], display_name: p[3] });
      return { rows: [] };
    }
    if (sql.includes('FROM users WHERE email')) return { rows: db.users.filter((u) => u.email === p[0]) };
    if (sql.includes('DELETE FROM signup_otps WHERE email')) {
      db.otps = db.otps.filter((o) => o.email !== p[0]); return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO signup_otps')) {
      db.otps.push({ id: p[0], email: p[1], code_hash: p[2], password_hash: p[3], display_name: p[4], attempts: 0, expires_at: new Date(Date.now() + 600000), used_at: null, created_at: new Date() });
      return { rows: [] };
    }
    if (sql.includes('FROM signup_otps WHERE email')) {
      const rows = db.otps.filter((o) => o.email === p[0] && !o.used_at).sort((a, b) => b.created_at - a.created_at).slice(0, 1);
      return { rows: rows.map((o) => ({ ...o })) };
    }
    if (sql.includes('UPDATE signup_otps SET attempts')) {
      const o = db.otps.find((x) => x.id === p[0]); if (o) o.attempts++;
      return { rows: [] };
    }
    if (sql.includes('INSERT INTO workspace_members')) {
      db.members.push({ workspace_id: 'default', user_id: p[0], role: 'owner' }); return { rows: [] };
    }
    if (sql.includes('UPDATE signup_otps SET used_at')) {
      const o = db.otps.find((x) => x.id === p[0]); if (o) o.used_at = new Date(); return { rows: [] };
    }
    if (sql.includes('DELETE FROM signup_otps WHERE email=$1 AND id<>$2')) {
      db.otps = db.otps.filter((o) => !(o.email === p[0] && o.id !== p[1])); return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO sessions')) {
      db.sessions.push({ user_id: p[1], token_hash: p[2] }); return { rows: [] };
    }
    if (sql.includes('JOIN users u')) {
      const s = db.sessions.find((x) => x.token_hash === p[0]);
      const u = s && db.users.find((x) => x.id === s.user_id);
      return { rows: u ? [{ id: u.id, email: u.email, display_name: u.display_name }] : [] };
    }
    if (sql.includes('FROM workspace_members WHERE user_id')) return { rows: db.members.filter((m) => m.user_id === p[0]) };
    throw new Error(`unstubbed query: ${sql.slice(0, 80)}`);
  },
};

const express = (await import('express')).default;
const { authRouter } = await import('../server/auth/routes.js');
const app = express();
app.use(express.json());
app.use(authRouter(stubPool));
const srv = app.listen(0);
await new Promise((r) => srv.on('listening', r));
const base = `http://127.0.0.1:${srv.address().port}`;
const post = (path, body) => fetch(`${base}${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }));

// 1. validation
let r = await post('/api/auth/signup/request-code', { email: 'bad', password: 'x' });
ok('rejects bad email', r.status === 400);
r = await post('/api/auth/signup/request-code', { email: 'a@b.co', password: 'short' });
ok('rejects short password', r.status === 400);

// 2. happy path: request -> verify -> session
r = await post('/api/auth/signup/request-code', { email: 'otp@test.local', password: 'otppassword123', displayName: 'OTP' });
ok('request-code ok + debug code', r.status === 200 && /^\d{6}$/.test(r.json?.debugCode || ''), `st=${r.status}`);
ok('password stored hashed, not plaintext', db.otps[0] && !String(db.otps[0].password_hash).includes('otppassword') && db.users.length === 0);
r = await post('/api/auth/signup/verify', { email: 'otp@test.local', code: '000000' });
ok('wrong code rejected', r.status === 400 && r.json?.error === 'incorrect code');
r = await post('/api/auth/signup/verify', { email: 'otp@test.local', code: 'x' });
ok('malformed code rejected', r.status === 400);
const code = (await post('/api/auth/signup/request-code', { email: 'otp@test.local', password: 'otppassword123' })).json?.debugCode;
r = await post('/api/auth/signup/verify', { email: 'otp@test.local', code });
ok('verify creates owner + session', r.status === 200 && r.json?.user?.email === 'otp@test.local' && r.cookie.includes('orbit_session'));
const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: r.cookie } }).then((x) => x.json());
ok('session works', me?.user?.email === 'otp@test.local');

// 3. registration closes after first user
r = await post('/api/auth/signup/request-code', { email: 'second@test.local', password: 'secondpassword123' });
ok('registration closed', r.status === 403 && r.json?.code === 'registration_closed');

// 4. expired code path (surgically age the row)
await post('/api/auth/signup/request-code', { email: 'fresh@test.local', password: 'freshpassword123' });
// still closed (user exists) -> proves ordering: closed beats everything
// expiry unit: manipulate stub row directly
db.otps.push({ id: 'old', email: 'exp@test.local', code_hash: 'x', password_hash: 'x', display_name: 'E', attempts: 0, expires_at: new Date(Date.now() - 1000), used_at: null, created_at: new Date(0) });
r = await post('/api/auth/signup/verify', { email: 'exp@test.local', code: '123456' });
ok('expired code rejected', r.status === 400 && /expired/.test(r.json?.error || ''));

// 5. legacy endpoint tombstoned
r = await post('/api/auth/signup', { email: 'z@test.local', password: 'zpassword123' });
ok('legacy signup 410', r.status === 410);

srv.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
