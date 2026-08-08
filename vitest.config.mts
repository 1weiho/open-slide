import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@open-slide/core/files',
        replacement: fileURLToPath(new URL('./packages/core/src/files/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/http',
        replacement: fileURLToPath(new URL('./packages/core/src/http/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/locale',
        replacement: fileURLToPath(new URL('./packages/core/src/locale/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/vite',
        replacement: fileURLToPath(new URL('./packages/core/src/vite/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core',
        replacement: fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
    environment: 'node',
  },
});
