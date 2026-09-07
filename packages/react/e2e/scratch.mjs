// Copies the fixture project into e2e/.scratch/<name> so tests that write to
// disk (inspector saves, notes, dev API mutations) never touch the committed
// fixture sources. node_modules is symlinked back to the fixture's install.
import { cpSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const fixtureDir = path.join(here, 'fixture');

export function prepareScratchProject(name) {
  const dir = path.join(here, '.scratch', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(fixtureDir, dir, {
    recursive: true,
    filter: (src) => path.basename(src) !== 'node_modules',
  });
  symlinkSync(path.join(fixtureDir, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}
