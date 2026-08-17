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
  // `virtual:open-slide/*` is served by our own Vite plugin, so it can only be
  // resolved inside a consumer's Vite graph. Leave the import bare in dist and
  // let their build resolve it, exactly as the shipped `src/app` sources do.
  external: ['vite', 'react', 'react-dom', 'react-router-dom', /^virtual:open-slide\//],
});
