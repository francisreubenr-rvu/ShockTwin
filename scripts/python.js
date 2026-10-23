const { spawn } = require('node:child_process');
const { pythonRuntime, root } = require('./python-runtime');
const child = spawn(pythonRuntime(), process.argv.slice(2), { cwd: root, stdio: 'inherit' });
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : code || 0;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
