// Boots `open-slide dev` for the e2e suite against a throwaway copy of the
// fixture project, so tests that write to disk (inspector saves, notes, dev
// API mutations) never touch the committed fixture sources.
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(here, '..');
const fixtureDir = path.join(here, 'fixture');
const scratchDir = path.join(here, '.scratch', 'dev');

if (!existsSync(path.join(coreRoot, 'dist', 'cli', 'bin.js'))) {
  console.error('packages/core/dist is missing. Run `pnpm --filter @open-slide/core build` first.');
  process.exit(1);
}
if (!existsSync(path.join(fixtureDir, 'node_modules'))) {
  console.error('e2e fixture has no node_modules. Run `pnpm install` first.');
  process.exit(1);
}

rmSync(scratchDir, { recursive: true, force: true });
mkdirSync(scratchDir, { recursive: true });
cpSync(fixtureDir, scratchDir, {
  recursive: true,
  filter: (src) => path.basename(src) !== 'node_modules',
});
symlinkSync(
  path.join(fixtureDir, 'node_modules'),
  path.join(scratchDir, 'node_modules'),
  'junction',
);

// Bind to 127.0.0.1 explicitly. Vite's default host resolves to `localhost`,
// which on CI runners can bind to IPv6 `::1` only, leaving Playwright's IPv4
// `http://127.0.0.1` readiness probe hanging until the webServer timeout.
const child = spawn(
  process.execPath,
  [
    path.join(coreRoot, 'bin.js'),
    'dev',
    '--no-skills-check',
    '--host',
    '127.0.0.1',
    ...process.argv.slice(2),
  ],
  {
    cwd: scratchDir,
    stdio: 'inherit',
    // OPEN_SLIDE_DEV_SUPERVISED=1 skips the CLI's supervisor fork so Playwright
    // manages a single server process.
    env: { ...process.env, OPEN_SLIDE_DEV_SUPERVISED: '1', OPEN_SLIDE_SKIP_SKILLS_CHECK: '1' },
  },
);
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
