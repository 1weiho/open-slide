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
  external: [
    'vite',
    'react',
    'react-dom',
    'react-router-dom',
    // PPTX export engine deps. Keep external so esbuild's native binary works
    // and Playwright's optional dynamic import stays a bare specifier that can
    // fail with ERR_MODULE_NOT_FOUND (caught to prompt the user to install it).
    'esbuild',
    'playwright',
    'pptxgenjs',
    'jszip',
    'fast-xml-parser',
  ],
});
