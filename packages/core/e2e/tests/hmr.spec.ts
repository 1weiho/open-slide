import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  deleteSlide,
  devScratchDir,
  duplicateSlide,
  editorCanvas,
  openSlide,
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
  test('editing a slide source hot-swaps the open slide', async ({ page, request }) => {
    await duplicateSlide(request, 'edit-target', 'hmr-live');
    try {
      await openSlide(page, 'hmr-live');
      await expect(editorCanvas(page).getByText('Editable headline')).toBeVisible();

      const file = slideSourcePath('hmr-live');
      const source = await fs.readFile(file, 'utf8');
      await fs.writeFile(file, source.replace('Editable headline', 'Hot swapped headline'));

      await expect(editorCanvas(page).getByText('Hot swapped headline')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteSlide(request, 'hmr-live');
    }
  });

  test('creating and removing a deck updates the home browser', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3')).toHaveCount(3);

    const dir = path.join(devScratchDir, 'slides', 'hmr-new');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), FRESH_DECK);
      await expect(page.getByText('Fresh Deck')).toBeVisible({ timeout: 15_000 });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
    await expect(page.getByText('Fresh Deck')).toBeHidden({ timeout: 15_000 });
  });

  test('a deck with no pages shows the empty state', async ({ page }) => {
    const dir = path.join(devScratchDir, 'slides', 'hmr-empty');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), 'export default [];\n');
      await page.waitForTimeout(1_000);

      await page.goto('/s/hmr-empty');
      await expect(page.getByText('Nothing to show.')).toBeVisible({ timeout: 15_000 });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
