import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  devScratchDir,
  editorCanvas,
  openSlide,
  refreshSlidesModule,
  slideSourcePath,
} from './helpers.ts';

const FRESH_DECK = `import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Fresh Deck',
  createdAt: '2026-01-05T00:00:00.000Z',
};

const Only: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#123', color: '#fff', padding: 120 }}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Fresh page</h1>
  </div>
);

export default [Only] satisfies Page[];
`;

test.describe('dev server file watching', () => {
  test('editing a slide source hot-swaps the open slide', async ({ page }) => {
    const file = slideSourcePath('hot-swap');
    const source = await fs.readFile(file, 'utf8');
    try {
      await openSlide(page, 'hot-swap');
      await expect(editorCanvas(page).getByText('Hot swap headline')).toBeVisible();

      await fs.writeFile(file, source.replace('Hot swap headline', 'Hot swapped headline'));

      await expect(editorCanvas(page).getByText('Hot swapped headline')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await fs.writeFile(file, source);
    }
  });

  test('a deck created on disk appears after a refresh and hot-disappears when removed', async ({
    page,
  }) => {
    const dir = path.join(devScratchDir, 'slides', 'hmr-doomed');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), FRESH_DECK);
      await refreshSlidesModule('hmr-doomed');

      await page.goto('/');
      const card = page.getByText('Fresh Deck');
      try {
        await expect(card).toBeVisible({ timeout: 10_000 });
      } catch {
        await page.reload();
        await expect(card).toBeVisible({ timeout: 15_000 });
      }

      // Removal is watched live: the server broadcasts a full reload and the
      // open page drops the card without manual navigation.
      await fs.rm(dir, { recursive: true, force: true });
      await expect(card).toBeHidden({ timeout: 15_000 });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('a deck with no pages shows the empty state', async ({ page }) => {
    const dir = path.join(devScratchDir, 'slides', 'hmr-empty');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), 'export default [];\n');
      await refreshSlidesModule('hmr-empty');

      await page.goto('/s/hmr-empty');
      const emptyState = page.getByText('Nothing to show.');
      try {
        await expect(emptyState).toBeVisible({ timeout: 10_000 });
      } catch {
        await page.reload();
        await expect(emptyState).toBeVisible({ timeout: 15_000 });
      }
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
