import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vite';
import { commentsPlugin } from './comments-plugin.ts';
import { currentPlugin } from './current-plugin.ts';
import { designPlugin } from './design-plugin.ts';
import { filesPlugin } from './files-plugin.ts';
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
    root: APP_ROOT,
    configFile: false,
    envDir: userCwd,
    plugins: [
      locTagsPlugin({ userCwd, slidesDir }),
      react(),
      tailwindcss(),
      openSlidePlugin({ userCwd, config }),
      themesPlugin({ userCwd, config }),
      designPlugin({ userCwd }),
      commentsPlugin({ userCwd, slidesDir }),
      notesPlugin({ userCwd, slidesDir }),
      filesPlugin({ userCwd, slidesDir, assetsDir }),
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
        'radix-ui',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'emoji-picker-react',
      ],
      // The app source ships inside node_modules/@open-slide/core/src/app, so
      // Vite's dep scanner traverses it as if it were a third-party dep and
      // tries to bundle our virtual imports with esbuild. Mark them external.
      esbuildOptions: {
        plugins: [
          {
            name: 'open-slide:virtual-externals',
            setup(build) {
              build.onResolve({ filter: /^virtual:open-slide\// }, (args) => ({
                path: args.path,
                external: true,
              }));
            },
          },
        ],
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
