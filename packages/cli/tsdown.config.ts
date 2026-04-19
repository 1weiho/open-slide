import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    'sync-template': 'scripts/sync-template.ts',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: false,
  shims: false,
});
