const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { root, selector, imports } = require('./python-runtime');
if (process.env.SHOCKTWIN_SKIP_PYTHON_SETUP === '1') {
  console.log('Python setup skipped explicitly; run it before starting ML.');
  process.exit(0);
}
function works(executable, code = imports) {
  return spawnSync(executable, ['-c', code], { stdio: 'ignore' }).status === 0;
}
function run(executable, args) {
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0)
    throw result.error || new Error(`${executable} failed (${result.status})`);
}
let executable = [process.env.SHOCKTWIN_PYTHON, 'python3', 'python']
  .filter(Boolean)
  .find((p) => works(p));
if (!executable) {
  const base = [process.env.SHOCKTWIN_PYTHON, 'python3', 'python']
    .filter(Boolean)
    .find((p) => works(p, 'import sys; assert sys.version_info >= (3, 11)'));
  if (!base) throw new Error('Install Python 3.11+ with pip and venv before npm install.');
  executable = path.join(
    root,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  if (!fs.existsSync(executable)) run(base, ['-m', 'venv', path.join(root, '.venv')]);
  run(executable, [
    '-m',
    'pip',
    'install',
    '--disable-pip-version-check',
    '-r',
    'ml/requirements.txt',
  ]);
  if (!works(executable))
    throw new Error('Python dependencies installed but ML imports failed. Inspect pip output.');
}
fs.mkdirSync(path.dirname(selector), { recursive: true });
fs.writeFileSync(selector, JSON.stringify({ executable }, null, 2));
console.log('ShockTwin Python runtime ready; local ML uses saved synthetic model weights.');
