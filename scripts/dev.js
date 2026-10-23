const { spawn, execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { root, pythonRuntime } = require('./python-runtime');
require('dotenv').config({ path: path.join(root, '.env') });
if (process.env.NODE_ENV === 'production' || process.env.CDS_ENV === 'production')
  throw new Error('Use npm start for production; the dev launcher starts local mocks.');
if (!fs.existsSync(path.join(root, 'db.sqlite')))
  throw new Error('Run npm run seed before npm run dev.');
const children = [];
let stopping = false;
function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: 'inherit',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[${name}] ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`[${name}] stopped (${code})`);
      stop(code || 1);
    }
  });
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
  setTimeout(() => {
    for (const child of children) if (!child.killed) child.kill('SIGKILL');
    process.exit(code);
  }, 700).unref();
  process.exitCode = code;
}
start('S/4HANA mock', process.execPath, ['integrations/s4hana-mock/server.js']);
start('Signals', process.execPath, ['integrations/signals/server.js']);
start('ML', pythonRuntime(), ['ml/serve.py']);
start('CAP', process.execPath, ['server.js']);
const url = `http://localhost:${process.env.PORT || 4004}`;
console.log(
  `\nShockTwin launchpad: ${url}\nAll demo business data is Illustrative. Ctrl+C stops all services.\n`,
);
async function openWhenReady() {
  for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
    try {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) {
        if (
          process.env.NO_OPEN !== '1' &&
          !process.env.CI &&
          (process.platform !== 'linux' || process.env.DISPLAY || process.env.WAYLAND_DISPLAY)
        ) {
          const command =
            process.platform === 'win32'
              ? 'cmd'
              : process.platform === 'darwin'
                ? 'open'
                : 'xdg-open';
          const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
          execFile(command, args, (error) => {
            if (error) console.log(`Open ${url} in your browser.`);
          });
        }
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!stopping) console.error('CAP readiness timed out. Inspect service output above.');
}
openWhenReady();
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
