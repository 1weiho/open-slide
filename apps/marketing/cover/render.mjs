import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { prepareScratchProject } from '../../../packages/core/e2e/scratch.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const web = path.join(repo, 'apps/web');
const out = path.join(here, 'out');
const fonts = path.join(web, 'node_modules/geist/dist/fonts');

const TARGETS = [
  { file: path.join(web, 'app/opengraph-image.png'), width: 1200, height: 630 },
  { file: path.join(out, 'readme-cover.png'), width: 1280, height: 640 },
];

const project = prepareScratchProject('cover');
cpSync(
  path.join(repo, 'packages/cli/template/slides/getting-started'),
  path.join(project, 'slides/getting-started'),
  { recursive: true },
);
execFileSync('node', [path.join(repo, 'packages/core/bin.js'), 'build'], {
  cwd: project,
  env: { ...process.env, OPEN_SLIDE_SKIP_SKILLS_CHECK: '1' },
  stdio: 'pipe',
});
const dist = path.join(project, 'dist');

const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const fulfill = (route, file) =>
  route.fulfill({
    body: readFileSync(file),
    contentType: types[path.extname(file)] ?? 'application/octet-stream',
  });

const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: 'reduce' });

await ctx.route('http://deck.test/**', (route) => {
  const file = path.join(dist, decodeURIComponent(new URL(route.request().url()).pathname));
  try {
    return fulfill(route, file);
  } catch {
    return fulfill(route, path.join(dist, 'index.html'));
  }
});

const deck = await ctx.newPage();
await deck.setViewportSize({ width: 1920, height: 1080 });
const shots = new Map();
let queue = Promise.resolve();
const shoot = (n) => {
  if (!shots.has(n)) {
    queue = queue.then(async () => {
      await deck.goto(`http://deck.test/s/getting-started?p=${n}`);
      await deck.waitForTimeout(800);
      await deck.keyboard.press('Enter');
      await deck.waitForTimeout(1200);
      return deck.screenshot();
    });
    shots.set(n, queue);
  }
  return shots.get(n);
};

await ctx.route('http://cover.test/**', async (route) => {
  const { pathname } = new URL(route.request().url());
  const shot = /^\/shots\/(\d+)\.png$/.exec(pathname);
  if (shot) return route.fulfill({ body: await shoot(Number(shot[1])), contentType: 'image/png' });
  if (pathname === '/fonts/geist.woff2')
    return fulfill(route, path.join(fonts, 'geist-sans/Geist-Variable.woff2'));
  if (pathname === '/fonts/geist-mono.woff2')
    return fulfill(route, path.join(fonts, 'geist-mono/GeistMono-Variable.woff2'));
  return fulfill(route, path.join(here, 'cover.html'));
});

mkdirSync(out, { recursive: true });
for (const { file, width, height } of TARGETS) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  await page.goto('http://cover.test/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => [...document.images].every((img) => img.complete && img.naturalWidth > 0),
    null,
    { timeout: 120_000 },
  );
  await page.screenshot({ path: file });
  await page.close();
  console.log(`${width}×${height} → ${path.relative(repo, file)}`);
}

await browser.close();
