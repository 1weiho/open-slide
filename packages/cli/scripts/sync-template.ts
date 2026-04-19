#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(CLI_ROOT, '..', '..');
const PLAYGROUND = resolve(REPO_ROOT, 'apps', 'playground');
const CORE_PKG = resolve(REPO_ROOT, 'packages', 'core', 'package.json');
const TEMPLATE = resolve(CLI_ROOT, 'template');

// Files/dirs at the repo root that are workspace-shared but belong in a
// scaffolded deck workspace. Copied in addition to apps/playground/*.
const ROOT_EXTRAS = [
  '.claude',
  '.agents',
  'CLAUDE.md',
  'biome.json',
  'skills-lock.json',
];

const EXCLUDE = new Set([
  'node_modules',
  'dist',
  '.vite',
  '.turbo',
  '.DS_Store',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
]);

const EXCLUDE_SUFFIX = ['.log', '.tsbuildinfo'];

function shouldSkip(name: string): boolean {
  if (EXCLUDE.has(name)) return true;
  return EXCLUDE_SUFFIX.some((s) => name.endsWith(s));
}

const filter = (source: string): boolean => {
  const name = source.split('/').pop() ?? '';
  return !shouldSkip(name);
};

// dereference: true → follow symlinks so the published template contains
// real directories, not machine-local absolute symlinks.
const CP_OPTS = { recursive: true, dereference: true, filter } as const;

async function main(): Promise<void> {
  if (!existsSync(PLAYGROUND)) {
    throw new Error(`Playground not found at ${PLAYGROUND}`);
  }
  if (existsSync(TEMPLATE)) {
    await rm(TEMPLATE, { recursive: true, force: true });
  }

  await cp(PLAYGROUND, TEMPLATE, CP_OPTS);

  // Pin @open-slide/core to a real version (template can't ship workspace:*).
  const corePkg = JSON.parse(await readFile(CORE_PKG, 'utf8')) as { version: string };
  const tplPkgPath = join(TEMPLATE, 'package.json');
  const tplPkg = JSON.parse(await readFile(tplPkgPath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  if (tplPkg.dependencies?.['@open-slide/core']) {
    tplPkg.dependencies['@open-slide/core'] = `^${corePkg.version}`;
  }
  await writeFile(tplPkgPath, `${JSON.stringify(tplPkg, null, 2)}\n`);

  for (const name of ROOT_EXTRAS) {
    const src = join(REPO_ROOT, name);
    if (!existsSync(src)) {
      throw new Error(`Missing root extra: ${src}`);
    }
    await cp(src, join(TEMPLATE, name), CP_OPTS);
  }

  const files = await readdir(TEMPLATE);
  process.stdout.write(
    `Synced template -> ${TEMPLATE}\n` +
      `  playground: ${PLAYGROUND}\n` +
      `  root extras: ${ROOT_EXTRAS.join(', ')}\n` +
      `  ${files.length} top-level entries\n`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
