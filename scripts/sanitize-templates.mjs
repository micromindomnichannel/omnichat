// One-shot sanitizer: Downloads/*.json -> server/micromind/templates/*.json
// Replaces live secrets with <PLACEHOLDERS> (messenger.json precedent).
//
// Secrets are NEVER hardcoded here (push protection + hygiene). Pass them via:
//   SANITIZE_MAP_JSON='{"<live-value>":"<PLACEHOLDER>", ...}' node scripts/sanitize-templates.mjs
// Run: SANITIZE_MAP_JSON='{...}' node scripts/sanitize-templates.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DL = 'C:/Users/alisa/Downloads';
const OUT = path.join(__dirname, '../server/micromind/templates');

const files = {
  'Whatsapp flow (on hold) Chatflow.json': 'whatsapp.json',
  'Telegram flow Chatflow.json': 'telegram.json',
  'Gmail Flow (error) Chatflow.json': 'gmail.json',
};
const mapRaw = process.env.SANITIZE_MAP_JSON || '';
if (!mapRaw) {
  console.error('SANITIZE_MAP_JSON env required: JSON object mapping live values to placeholders.');
  process.exit(1);
}
const secrets = JSON.parse(mapRaw);

for (const [src, dst] of Object.entries(files)) {
  let s = fs.readFileSync(path.join(DL, src), 'utf8');
  const before = s.length;
  for (const [live, placeholder] of Object.entries(secrets)) {
    s = s.replaceAll(live, placeholder);
  }
  const d = JSON.parse(s);
  const found = new Set();
  const walk = (o) => {
    if (typeof o === 'string') {
      const m = o.match(/[A-Za-z0-9_:\-.]{40,}/g);
      if (m) {
        m.forEach((x) => {
          if (!x.startsWith('{{') && !x.includes('data.instance')) found.add(x.slice(0, 80));
        });
      }
    } else if (Array.isArray(o)) {
      o.forEach(walk);
    } else if (o && typeof o === 'object') {
      Object.values(o).forEach(walk);
    }
  };
  walk(d);
  console.log(`${dst} | nodes: ${d.nodes.length} | edges: ${(d.edges || []).length} | bytes: ${before} -> ${s.length}`);
  console.log(`  long-strings: ${[...found].join(' | ') || '(none)'}`);
  fs.writeFileSync(path.join(OUT, dst), JSON.stringify(d, null, 2));
}
console.log('done');
