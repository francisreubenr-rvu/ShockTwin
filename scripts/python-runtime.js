const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const selector = path.join(root, '.runtime', 'python.json');
const imports = 'import torch, torch_geometric, sklearn, fastapi, uvicorn';
function pythonRuntime() {
  if (process.env.SHOCKTWIN_PYTHON) return process.env.SHOCKTWIN_PYTHON;
  try {
    const value = JSON.parse(fs.readFileSync(selector, 'utf8'));
    if (
      value.executable &&
      spawnSync(value.executable, ['-c', imports], { stdio: 'ignore' }).status === 0
    )
      return value.executable;
  } catch {}
  const local = path.join(
    root,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  if (fs.existsSync(local)) return local;
  for (const candidate of ['python3', 'python']) {
    if (spawnSync(candidate, ['-c', imports], { stdio: 'ignore' }).status === 0) return candidate;
  }
  throw new Error('Python ML environment is unavailable. Run npm install to prepare it.');
}
module.exports = { root, selector, imports, pythonRuntime };
