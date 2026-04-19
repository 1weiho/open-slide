#!/usr/bin/env node
import { cp, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(CLI_ROOT, '..', '..');
const PLAYGROUND = resolve(REPO_ROOT, 'apps', 'playground');
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

function shouldSkip(name) {
  if (EXCLUDE.has(name)) return true;
  return EXCLUDE_SUFFIX.some((s) => name.endsWith(s));
}

const filter = (source) => !shouldSkip(source.split('/').pop());

// dereference: true → follow symlinks so the published template contains
// real directories, not machine-local absolute symlinks.
const CP_OPTS = { recursive: true, dereference: true, filter };

async function main() {
  if (!existsSync(PLAYGROUND)) {
    throw new Error(`Playground not found at ${PLAYGROUND}`);
  }
  if (existsSync(TEMPLATE)) {
    await rm(TEMPLATE, { recursive: true, force: true });
  }

  await cp(PLAYGROUND, TEMPLATE, CP_OPTS);

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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
