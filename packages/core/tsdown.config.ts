import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'vite/index': 'src/vite/index.ts',
    'locale/index': 'src/locale/index.ts',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: true,
  shims: false,
  external: ['vite', 'react', 'react-dom', 'react-router-dom'],
});
