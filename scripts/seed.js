const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { root, pythonRuntime } = require('./python-runtime');
require('dotenv').config({ path: path.join(root, '.env') });
if (process.env.NODE_ENV === 'production' || process.env.CDS_ENV === 'production') {
  throw new Error('Illustrative seeding is disabled in production.');
}
function run(executable, args) {
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0)
    throw result.error || new Error(`Seed step failed (${result.status})`);
}
const database = process.env.SHOCKTWIN_DB_URL
  ? path.resolve(root, process.env.SHOCKTWIN_DB_URL)
  : path.join(root, 'db.sqlite');
for (const suffix of ['', '-wal', '-shm'])
  if (fs.existsSync(database + suffix)) fs.unlinkSync(database + suffix);
run(process.execPath, [
  require.resolve('@sap/cds-dk/bin/cds.js'),
  'deploy',
  '--to',
  `sqlite:${database}`,
]);
const modelDir = path.join(root, 'ml', 'model');
if (
  !fs.existsSync(modelDir) ||
  !fs.readdirSync(modelDir).some((name) => /\.(pt|pth)$/.test(name))
) {
  run(pythonRuntime(), ['ml/train.py']);
}
fs.mkdirSync(path.join(root, '.runtime'), { recursive: true });
for (const file of ['s4-mock.json']) {
  const location = path.join(root, '.runtime', file);
  if (fs.existsSync(location)) fs.unlinkSync(location);
}
console.log('Illustrative demo seeded. Start with npm run dev.');
