import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vite';
import { commentsPlugin } from './comments-plugin.ts';
import {
  loadUserConfig,
  type OpenSlideConfig,
  openSlidePlugin,
} from './open-slide-plugin.ts';

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

export async function createViteConfig(
  opts: CreateViteConfigOptions,
): Promise<InlineConfig> {
  const userCwd = path.resolve(opts.userCwd);
  const config = opts.config ?? (await loadUserConfig(userCwd));
  const slidesDir = config.slidesDir ?? 'slides';
  const slidesAbs = path.resolve(userCwd, slidesDir);

  return {
    root: APP_ROOT,
    configFile: false,
    plugins: [
      react(),
      tailwindcss(),
      openSlidePlugin({ userCwd, config }),
      commentsPlugin({ userCwd, slidesDir }),
    ],
    resolve: {
      alias: {
        '@': APP_ROOT,
      },
    },
    optimizeDeps: {
      entries: [path.join(APP_ROOT, 'main.tsx')],
      include: [
        'react-router-dom',
        'radix-ui',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
      ],
    },
    server: {
      port: config.port ?? 5173,
      fs: { allow: [APP_ROOT, userCwd, slidesAbs] },
    },
    build: {
      outDir: path.resolve(userCwd, 'dist'),
      emptyOutDir: true,
    },
  };
}

export { APP_ROOT };
