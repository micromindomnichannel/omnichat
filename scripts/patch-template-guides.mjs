// One-time: stamp the ORBIT-owned setup guide into shipped templates.
// Uses orbitSetupGuide() from provisionChannel.js so file + provision-time
// rewrites can never drift. Regex-bounded replacement inside the enclosing
// "value" string preserves file formatting byte-for-byte.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { orbitSetupGuide } from '../server/micromind/provisionChannel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'server', 'micromind', 'templates');
const MARK = 'core.aimicromind.com/webhook';
const re = new RegExp('"value": "((?:[^"\\\\]|\\\\.)*' + MARK.replace(/\./g, '\\.') + '(?:[^"\\\\]|\\\\.)*)"', 'g');

for (const [file, channel] of [['messenger.json', 'messenger'], ['instagram.json', 'instagram']]) {
  const fp = path.join(dir, file);
  const raw = fs.readFileSync(fp, 'utf8');
  const matches = [...raw.matchAll(re)];
  if (!matches.length) {
    console.log(file + ': no MicroMind-pointing guide found (already patched?)');
    continue;
  }
  if (matches.length > 1) throw new Error(file + ': ' + matches.length + ' matches — refusing ambiguous patch');
  const nextEsc = JSON.stringify(orbitSetupGuide(channel)).slice(1, -1);
  const patched = raw.slice(0, matches[0].index) + '"value": "' + nextEsc + '"' + raw.slice(matches[0].index + matches[0][0].length);
  JSON.parse(patched); // prove still valid JSON before writing
  fs.writeFileSync(fp, patched);
  console.log(file + ': guide rewritten, JSON valid');
}
