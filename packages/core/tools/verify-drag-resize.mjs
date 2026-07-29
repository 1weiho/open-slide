#!/usr/bin/env node
// End to end check for drag and resize.
//
// Launches its own Chrome (temporary profile, never touches a browser you have
// open), manipulates an element in Inspect mode, saves, and confirms the result
// was written back into the .tsx with the right value. Exits 1 on any failure.
//
// Run from packages/core (where @playwright/test lives), with a dev server up:
//   pnpm dev:demo                        # in another terminal, from the repo root
//   node tools/verify-drag-resize.mjs [url] [path-to-tsx]
//
// With no arguments it targets the `verify-drag-resize` fixture in apps/demo.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DEFAULT_SLIDE = join(REPO_ROOT, 'apps', 'demo', 'slides', 'verify-drag-resize', 'index.tsx');

const URL = process.argv[2] ?? 'http://localhost:5173/s/verify-drag-resize';
const SLIDE_FILE = process.argv[3] ?? DEFAULT_SLIDE;
/** Text of the element the script picks up; matches the fixture's heading. */
const TARGET_TEXT = process.argv[4] ?? 'Original headline of the cover';
const ORIGINAL = readFileSync(SLIDE_FILE, 'utf8');

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? '  [ok]' : '  [FAIL]'} ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message}`));

/** Fresh page, Inspect on, heading selected. Returns the locator and the scale. */
async function selectHeading() {
  writeFileSync(SLIDE_FILE, ORIGINAL);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: /Inspect/i })
    .first()
    .click();
  await page.waitForTimeout(400);
  // Scoped on purpose: the same text renders in the thumbnail rail, and
  // clicking that navigates instead of selecting.
  const el = page.locator('[data-inspector-root]').getByText(TARGET_TEXT).first();
  await el.click();
  await page.waitForTimeout(500);
  const scale = await el.evaluate((node) => {
    const canvas = node.closest('[data-osd-canvas]');
    return canvas ? canvas.getBoundingClientRect().width / 1920 : 0;
  });
  return { el, scale };
}

async function save() {
  const btn = page.getByRole('button', { name: /^Save/i }).first();
  if ((await btn.count()) === 0) return false;
  await btn.click();
  await page.waitForTimeout(1800);
  return true;
}

console.log('\n1. dragging an element moves it and persists to source');
{
  const { el, scale } = await selectHeading();
  check(scale > 0.1, `main canvas detected (scale ${scale.toFixed(3)})`);

  const box = await el.boundingBox();
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const DX = 120;
  const DY = 60;
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // Intermediate steps: a single move can be coalesced by the browser and never
  // cross the drag threshold.
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(from.x + (DX / 10) * i, from.y + (DY / 10) * i);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);

  const handles = await page.locator('[data-drag-resize-handle]').count();
  check(handles === 4, `4 corner handles rendered (found ${handles})`);

  const saved = await save();
  check(saved, 'Save button appeared after the drag');

  const after = readFileSync(SLIDE_FILE, 'utf8');
  const m = after.match(/translate:\s*'([^']+)'/);
  check(!!m, 'translate written into the .tsx');
  if (m) {
    // A drag adds to whatever translate the element already had, so the check is
    // on the delta: running against a fixture left dirty by an earlier run must
    // not fail correct behaviour.
    const before = ORIGINAL.match(/translate:\s*'([^']+)'/);
    const [bx, by] = before ? before[1].split(' ').map(Number.parseFloat) : [0, 0];
    const [ax, ay] = m[1].split(' ').map(Number.parseFloat);
    const x = ax - bx;
    const y = ay - by;
    // Screen displacement becomes canvas pixels: divide by the scale.
    const expX = DX / scale;
    const expY = DY / scale;
    const okX = Math.abs(x - expX) / expX < 0.15;
    const okY = Math.abs(y - expY) / expY < 0.15;
    check(
      okX && okY,
      `displacement is proportional: wrote ${m[1]}, expected ~${Math.round(expX)}px ${Math.round(expY)}px`,
    );
  }
}

console.log('\n2. corner handle resizes and persists to source');
{
  const { scale } = await selectHeading();
  const handle = page.locator('[data-drag-resize-handle="se"]');
  const hb = await handle.boundingBox();
  check(!!hb, 'bottom right handle is visible');
  if (hb) {
    const from = { x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(from.x - 10 * i, from.y + 5 * i);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);

    const saved = await save();
    check(saved, 'Save button appeared after the resize');

    const after = readFileSync(SLIDE_FILE, 'utf8');
    check(/width:\s*'\d+px'/.test(after), 'width written into the .tsx');
    check(/height:\s*'\d+px'/.test(after), 'height written into the .tsx');
    const h = after.match(/height:\s*'(\d+)px'/);
    if (h) {
      const expected = 50 / scale;
      const grew = Number.parseInt(h[1], 10);
      check(grew > expected * 0.5, `height grew with the drag (${grew}px)`);
    }
  }
}

await browser.close();
writeFileSync(SLIDE_FILE, ORIGINAL);
console.log('\n[ok] fixture restored');

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('all checks passed.');
