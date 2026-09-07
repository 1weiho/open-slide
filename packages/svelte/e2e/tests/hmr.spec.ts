import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('hot-reloads an authored Svelte page without losing the deck route', async ({ page }) => {
  const pageUrl = new URL('../fixture/slides/alpha/01-one.svelte', import.meta.url);
  const original = await fs.readFile(pageUrl, 'utf8');
  try {
    await page.goto('/s/alpha');
    const viewport = page.locator('.viewport');
    await expect(viewport.getByText('Alpha page one')).toBeVisible();
    await fs.writeFile(pageUrl, original.replace('Alpha page one', 'Alpha page one updated'));
    await expect(viewport.getByText('Alpha page one updated')).toBeVisible();
    await expect(page).toHaveURL(/\/s\/alpha$/);
  } finally {
    await fs.writeFile(pageUrl, original);
  }
});
