import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
    'client/index': 'src/client/index.ts',
    'editing/index': 'src/editing/index.ts',
    'files/index': 'src/files/index.ts',
    'http/index': 'src/http/index.ts',
    'locale/index': 'src/locale/index.ts',
    'vite/index': 'src/vite/index.ts',
  },
  format: 'esm',
  fixedExtension: false,
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: true,
  shims: false,
  deps: { neverBundle: ['vite'] },
});
