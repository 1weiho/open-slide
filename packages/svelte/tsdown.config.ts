import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'locale/index': 'src/locale/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'vite/index': 'src/vite/index.ts',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: { resolve: false },
  shims: false,
  external: [/^@open-slide\/shared(?:\/|$)/, 'svelte', 'vite'],
});
