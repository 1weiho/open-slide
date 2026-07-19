import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vite';
import { apiPlugin } from './api-plugin.ts';
import { currentPlugin } from './current-plugin.ts';
import { designPlugin } from './design-plugin.ts';
import { locTagsPlugin } from './loc-tags-plugin.ts';
import { notesPlugin } from './notes-plugin.ts';
import { loadUserConfig, type OpenSlideConfig, openSlidePlugin } from './open-slide-plugin.ts';
import { themesPlugin } from './themes-plugin.ts';

function findPackageRoot(fromFile: string): string {
  let dir = path.dirname(fromFile);
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`Could not find package.json walking up from ${fromFile}`);
}

const PKG_ROOT = findPackageRoot(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(PKG_ROOT, 'src', 'app');

function readCoreVersion(): string {
  try {
    const raw = readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const CORE_VERSION = readCoreVersion();

export type CreateViteConfigOptions = {
  userCwd: string;
  config?: OpenSlideConfig;
  mode?: 'serve' | 'build';
};

export async function createViteConfig(opts: CreateViteConfigOptions): Promise<InlineConfig> {
  const userCwd = path.resolve(opts.userCwd);
  const config = opts.config ?? (await loadUserConfig(userCwd));
  const slidesDir = config.slidesDir ?? 'slides';
  const themesDir = config.themesDir ?? 'themes';
  const assetsDir = config.assetsDir ?? 'assets';
  const slidesAbs = path.resolve(userCwd, slidesDir);
  const themesAbs = path.resolve(userCwd, themesDir);
  const assetsAbs = path.resolve(userCwd, assetsDir);

  return {
    base: config.base ?? '/',
    root: APP_ROOT,
    configFile: false,
    envDir: userCwd,
    plugins: [
      locTagsPlugin({ userCwd, slidesDir }),
      react(),
      tailwindcss(),
      openSlidePlugin({ userCwd, config, coreVersion: CORE_VERSION }),
      themesPlugin({ userCwd, config }),
      designPlugin({ userCwd }),
      apiPlugin({ userCwd, slidesDir, assetsDir, coreVersion: CORE_VERSION }),
      notesPlugin({ userCwd, slidesDir }),
      currentPlugin({ userCwd, slidesDir }),
    ],
    resolve: {
      alias: {
        '@': APP_ROOT,
        '@assets': assetsAbs,
      },
    },
    optimizeDeps: {
      entries: [path.join(APP_ROOT, 'main.tsx')],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'next-themes',
        'react-router-dom',
        '@base-ui/react',
        // @base-ui/utils reaches for the CommonJS use-sync-external-store shim
        // (React 17 fallback). Left un-optimized, its named `useSyncExternalStore`
        // export fails ESM interop in the browser — pre-bundle it to fix that.
        // (@base-ui/utils itself has no "." export, so we can't list it here.)
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'emoji-picker-react',
      ],
      // The app source ships inside node_modules/@open-slide/core/src/app, so
      // Vite's dep scanner traverses it as if it were a third-party dep and
      // tries to pre-bundle our virtual imports. Mark them external.
      rolldownOptions: {
        external: [/^virtual:open-slide\//],
      },
    },
    server: {
      port: config.port ?? 5173,
      fs: { allow: [APP_ROOT, userCwd, slidesAbs, themesAbs, assetsAbs] },
    },
    build: {
      outDir: path.resolve(userCwd, 'dist'),
      emptyOutDir: true,
    },
  };
}

export { APP_ROOT };
