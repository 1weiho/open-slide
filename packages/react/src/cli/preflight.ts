import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATION_URL = 'https://open-slide.dev/docs/migrate-to-v2';

// Plugins the React runtime passes to Vite that import from `vite` themselves.
// Each one resolves `vite` from its own install location, which is not
// necessarily the copy the runtime resolves.
const VITE_CONSUMERS = ['@vitejs/plugin-react', '@tailwindcss/vite'];

type ResolvedPackage = { dir: string; version: string };

export type ViteMismatch = {
  consumer: string;
  coreVite: ResolvedPackage;
  consumerVite: ResolvedPackage;
};

function locatePackage(name: string, fromDir: string): ResolvedPackage | null {
  let dir = fromDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', name);
    const pkgPath = path.join(candidate, 'package.json');
    if (existsSync(pkgPath)) {
      let version = 'unknown';
      try {
        version =
          (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }).version ?? version;
      } catch {}
      return { dir: realpathSync(candidate), version };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function findViteMismatch(coreDir: string): ViteMismatch | null {
  const coreVite = locatePackage('vite', coreDir);
  if (!coreVite) return null;
  for (const consumer of VITE_CONSUMERS) {
    const consumerPkg = locatePackage(consumer, coreDir);
    if (!consumerPkg) continue;
    const consumerVite = locatePackage('vite', consumerPkg.dir);
    if (!consumerVite || consumerVite.version === coreVite.version) continue;
    return { consumer, coreVite, consumerVite };
  }
  return null;
}

export function formatViteMismatch(mismatch: ViteMismatch, cwd = process.cwd()): string {
  const rel = (dir: string) => path.relative(cwd, dir) || dir;
  return [
    `${mismatch.consumer} resolves vite@${mismatch.consumerVite.version} (${rel(mismatch.consumerVite.dir)}), but @open-slide/react ships vite@${mismatch.coreVite.version} (${rel(mismatch.coreVite.dir)}).`,
    'A `vite` entry in your package.json (v1 workspaces had one) shadows the copy the React runtime depends on. Remove it and reinstall.',
    `Migration guide: ${MIGRATION_URL}`,
  ].join('\n');
}

export function assertViteResolvesToCore(): void {
  const coreDir = realpathSync(path.dirname(fileURLToPath(import.meta.url)));
  const mismatch = findViteMismatch(coreDir);
  if (mismatch) throw new Error(formatViteMismatch(mismatch));
}
