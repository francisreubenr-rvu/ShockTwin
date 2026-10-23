const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function healthy(base) {
  try {
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureRuntime(base = 'http://127.0.0.1:4004') {
  if (await healthy(base)) return { stop() {}, owned: false };
  let output = '';
  const child = spawn(process.execPath, ['scripts/dev.js'], {
    cwd: root,
    env: { ...process.env, NO_OPEN: '1', CI: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      output = (output + chunk.toString()).slice(-20000);
    });
  }
  function stop() {
    if (child.exitCode !== null) return;
    if (process.platform !== 'win32') {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        /* Already stopped. */
      }
    } else child.kill('SIGTERM');
  }
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await healthy(base)) return { stop, owned: true };
    if (child.exitCode !== null) throw new Error(`Development runtime stopped: ${output}`);
    await delay(500);
  }
  stop();
  throw new Error(`Development runtime did not become ready. Run npm run seed first. ${output}`);
}

async function request(base, route, payload, headers = {}) {
  const response = await fetch(base + route, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });
  const body = await response.json();
  return { response, body };
}
module.exports = { ensureRuntime, request, delay, root };
