import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const here = dirname(fileURLToPath(import.meta.url));
const corePkg = JSON.parse(readFileSync(resolve(here, '..', 'core', 'package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: 'esm',
  target: 'node22',
  platform: 'node',
  clean: true,
  dts: false,
  shims: false,
  fixedExtension: false,
  define: {
    __CORE_VERSION_AT_BUILD__: JSON.stringify(corePkg.version),
  },
});
