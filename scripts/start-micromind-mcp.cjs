// Codex MCP launcher: load MicroMind credentials from the project .env
// without duplicating them into ~/.codex/config.toml or chat output.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const server = path.join(root, 'mcp-micromind', 'src', 'server.js');
const child = spawn(process.execPath, [server], { stdio: 'inherit', cwd: root, env: process.env });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
