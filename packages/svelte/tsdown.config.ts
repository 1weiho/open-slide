import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'locale/index': 'src/locale/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'vite/index': 'src/vite/index.ts',
  },
  format: 'esm',
  fixedExtension: false,
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: true,
  shims: false,
  deps: { neverBundle: [/^@open-slide\/shared(?:\/|$)/, 'svelte', 'vite'] },
});
