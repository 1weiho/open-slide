import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const here = dirname(fileURLToPath(import.meta.url));
const reactPkg = JSON.parse(readFileSync(resolve(here, '..', 'react', 'package.json'), 'utf8')) as {
  version: string;
};
const sveltePkg = JSON.parse(
  readFileSync(resolve(here, '..', 'svelte', 'package.json'), 'utf8'),
) as {
  version: string;
};

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: 'esm',
  fixedExtension: false,
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: false,
  shims: false,
  define: {
    __REACT_VERSION_AT_BUILD__: JSON.stringify(reactPkg.version),
    __SVELTE_VERSION_AT_BUILD__: JSON.stringify(sveltePkg.version),
  },
});
