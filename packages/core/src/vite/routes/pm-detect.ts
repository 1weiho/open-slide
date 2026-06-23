import fs from 'node:fs';
import path from 'node:path';

export type PackageManager = { name: 'pnpm' | 'npm' | 'yarn' | 'bun' };

export function detectPackageManager(cwd: string): PackageManager {
  try {
    const raw = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw);
    const pm = typeof pkg.packageManager === 'string' ? pkg.packageManager : '';
    if (pm.startsWith('pnpm@')) return { name: 'pnpm' };
    if (pm.startsWith('npm@')) return { name: 'npm' };
    if (pm.startsWith('yarn@')) return { name: 'yarn' };
    if (pm.startsWith('bun@')) return { name: 'bun' };
  } catch {}

  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return { name: 'pnpm' };
  if (fs.existsSync(path.join(cwd, 'bun.lockb'))) return { name: 'bun' };
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return { name: 'yarn' };
  if (fs.existsSync(path.join(cwd, 'package-lock.json'))) return { name: 'npm' };

  return { name: 'pnpm' };
}

export function installCommand(pm: PackageManager, pkg: string): string {
  switch (pm.name) {
    case 'pnpm':
      return `pnpm add -D ${pkg}`;
    case 'npm':
      return `npm install --save-dev ${pkg}`;
    case 'yarn':
      return `yarn add --dev ${pkg}`;
    case 'bun':
      return `bun add -d ${pkg}`;
  }
}
