const fs = require('node:fs');
const path = require('node:path');
const lessOpenUI5 = require('less-openui5');
const root = path.resolve(__dirname, '..');
const packages = [
  'sap.ui.core',
  'sap.m',
  'sap.f',
  'sap.ui.layout',
  'sap.ui.unified',
  'sap.ui.table',
  'sap.tnt',
  'themelib_sap_horizon',
];
const rootPaths = packages.map((name) => path.join(root, 'node_modules', '@openui5', name, 'src'));
const destination = path.join(root, '.runtime', 'ui5', 'resources');
async function main() {
  const builder = new lessOpenUI5.Builder();
  for (const library of packages.filter((name) => name !== 'themelib_sap_horizon')) {
    const namespace = library.replaceAll('.', '/');
    const relativePath = `${namespace}/themes/sap_horizon/library.source.less`;
    const output = path.join(destination, namespace, 'themes', 'sap_horizon');
    const existing = path.join(output, 'library.css');
    // Pinning all UI5 libraries to one version makes this cache key deterministic.
    const cachePath = path.join(output, 'version.txt');
    const version = JSON.parse(
      fs.readFileSync(path.join(root, 'node_modules', '@openui5', library, 'package.json'), 'utf8'),
    ).version;
    if (
      fs.existsSync(existing) &&
      fs.existsSync(cachePath) &&
      fs.readFileSync(cachePath, 'utf8') === version
    )
      continue;
    const result = await builder.build({
      lessInputPath: relativePath,
      rootPaths,
      compiler: { compress: true },
      rtl: true,
    });
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(existing, result.css);
    fs.writeFileSync(path.join(output, 'library-RTL.css'), result.cssRtl);
    fs.writeFileSync(
      path.join(output, 'library-parameters.json'),
      JSON.stringify(result.variables),
    );
    fs.writeFileSync(cachePath, version);
    console.log(`Built official OpenUI5 Horizon theme: ${library}`);
  }
  builder.clearCache();
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
