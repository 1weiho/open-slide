import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { FILM_ID, root } from './films.mjs';

const { values: opts, positionals } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  allowPositionals: true,
  options: {
    feature: { type: 'string' },
    tagline: { type: 'string' },
  },
});

const [id] = positionals;
if (!id || !FILM_ID.test(id)) {
  console.error('usage: pnpm --filter launch-video new <film-id> --feature "Name" [--tagline "…"]');
  console.error('film-id: lowercase letters, digits, and dashes, e.g. comments-launch');
  process.exit(1);
}
const dest = path.join(root, 'films', id);
if (fs.existsSync(dest)) {
  console.error(`films/${id} already exists`);
  process.exit(1);
}

const feature =
  opts.feature ??
  id
    .replace(/-launch$/, '')
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
const tagline = opts.tagline ?? `${feature}, right in your deck.`;
const quote = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

fs.cpSync(path.join(root, 'templates/film'), dest, { recursive: true });
const copyFile = path.join(dest, 'copy.js');
fs.writeFileSync(
  copyFile,
  fs
    .readFileSync(copyFile, 'utf8')
    .replace('__FEATURE__', quote(feature))
    .replace('__TAGLINE__', quote(tagline)),
);

console.log(`created films/${id} — "${feature} launch"

  preview   pnpm dev:video → http://127.0.0.1:5180/#/${id}/composition
  stills    pnpm --filter launch-video stills ${id} 2,8,16
  render    pnpm --filter launch-video render ${id}`);
