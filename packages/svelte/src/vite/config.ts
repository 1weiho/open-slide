import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OpenSlideConfig } from '@open-slide/shared';
import {
  currentPlugin,
  designPlugin,
  loadUserConfig,
  notesPlugin,
  openSlidePlugin,
  sharedApiPlugin,
  themesPlugin,
} from '@open-slide/shared/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import type { InlineConfig } from 'vite';

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
const DEPENDENCY_ROOT = path.resolve(PKG_ROOT, '..', '..');

function readRuntimeVersion(): string {
  try {
    const raw = readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

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
      svelte(),
      tailwindcss(),
      openSlidePlugin({
        userCwd,
        config,
        coreVersion: readRuntimeVersion(),
        entryExtensions: ['ts', 'js'],
      }),
      themesPlugin({ userCwd, config, demoExtensions: ['ts', 'js', 'svelte'] }),
      currentPlugin({ userCwd, slidesDir, entryFile: 'index.ts' }),
      notesPlugin({ userCwd, slidesDir, entryFile: 'index.ts' }),
      designPlugin({
        userCwd,
        slidesDir,
        entryFile: 'index.ts',
        runtimePackage: '@open-slide/svelte',
      }),
      sharedApiPlugin({
        userCwd,
        slidesDir,
        assetsDir,
        coreVersion: readRuntimeVersion(),
        entryFile: 'index.ts',
      }),
    ],
    resolve: {
      alias: {
        '@assets': assetsAbs,
      },
    },
    optimizeDeps: {
      entries: [path.join(APP_ROOT, 'main.ts')],
      exclude: ['@open-slide/shared', '@open-slide/svelte'],
    },
    server: {
      port: config.port ?? 5173,
      fs: { allow: [APP_ROOT, DEPENDENCY_ROOT, userCwd, slidesAbs, themesAbs, assetsAbs] },
    },
    build: {
      outDir: path.resolve(userCwd, 'dist'),
      emptyOutDir: true,
    },
  };
}
