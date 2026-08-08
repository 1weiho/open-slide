import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'files/index': 'src/files/index.ts',
    'http/index': 'src/http/index.ts',
    'locale/index': 'src/locale/index.ts',
    'vite/index': 'src/vite/index.ts',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: { resolve: false },
  shims: false,
  external: ['vite'],
});
