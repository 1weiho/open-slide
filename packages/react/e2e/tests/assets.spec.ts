import { expect, test } from '@playwright/test';
import { TINY_PNG } from './helpers.ts';

test.describe('asset manager', () => {
  const ASSET = 'e2e-asset.png';

  test.afterEach(async ({ request }) => {
    await request.delete(`/__assets/@global/${ASSET}`);
  });

  test('uploads an asset and deletes it from the grid', async ({ page, request }) => {
    await request.delete(`/__assets/@global/${ASSET}`);
    await page.goto('/assets');
    await expect(page.getByText('Upload', { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.locator('input[type="file"]').setInputFiles({
      name: ASSET,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.getByText(ASSET, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Actions for ${ASSET}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(ASSET, { exact: true })).toHaveCount(0);
  });
});
