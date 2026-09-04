import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const svelteRoot = path.resolve(here, '..');
const fixtureDir = path.join(here, 'fixture');
const bin = path.join(svelteRoot, 'bin.js');

const child = spawn(
  process.execPath,
  [bin, 'dev', '--host', '127.0.0.1', ...process.argv.slice(2)],
  { cwd: fixtureDir, stdio: 'inherit' },
);
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
