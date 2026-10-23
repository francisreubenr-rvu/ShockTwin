const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./python-runtime');
const target = path.join(root, 'gen', 'srv');
fs.mkdirSync(target, { recursive: true });
for (const entry of ['app', 'integrations', 'workflow', 'server.js']) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) throw new Error(`Production staging requires ${entry}`);
  fs.cpSync(source, path.join(target, entry), { recursive: true });
}
fs.cpSync(path.join(root, '.runtime', 'ui5', 'resources'), path.join(target, 'publicresources'), {
  recursive: true,
});
// CAP compiles CDS to srv/csn.json; business handlers and helpers remain executable source.
fs.cpSync(path.join(root, 'srv'), path.join(target, 'srv'), {
  recursive: true,
  filter: (source) => !source.endsWith('.cds'),
});
// Mock fixtures are packaged for compatibility but never started by the production process.
fs.mkdirSync(path.join(target, 'db'), { recursive: true });
fs.copyFileSync(path.join(root, 'db', 'demo-data.json'), path.join(target, 'db', 'demo-data.json'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
delete pkg.devDependencies;
pkg.scripts = { start: 'node server.js' };
pkg.cds = { requires: { db: { kind: 'hana' }, auth: { kind: 'xsuaa' } } };
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2));
if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  delete lock.packages[''].devDependencies;
  lock.packages[''].dependencies = pkg.dependencies;
  fs.writeFileSync(path.join(target, 'package-lock.json'), JSON.stringify(lock, null, 2));
}
for (const name of ['package.json', 'package-lock.json'])
  fs.copyFileSync(path.join(root, 'scripts', 'hdi', name), path.join(root, 'gen', 'db', name));
console.log('Staged CAP runtime, local SAPUI5 assets and adapters for MTA packaging.');
