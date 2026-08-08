import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'vite/index': 'src/vite/index.ts',
    'locale/index': 'src/locale/index.ts',
  },
  format: 'esm',
  fixedExtension: false,
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: { resolve: false },
  shims: false,
  deps: {
    neverBundle: [/^@open-slide\/shared(?:\/|$)/, 'vite', 'react', 'react-dom', 'react-router-dom'],
  },
});
