import { expect, test } from '@playwright/test';

test.describe('Svelte assets', () => {
  test('uploads, searches, renames, and deletes a scoped asset', async ({ page, request }) => {
    const original = 'svelte-asset.svg';
    const renamed = 'svelte-asset-renamed.svg';
    try {
      await page.goto('/assets');
      await page.getByLabel('Asset scope').selectOption('alpha');
      await page.locator('input[type="file"]').setInputFiles({
        name: original,
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20"/></svg>',
        ),
      });
      await expect(page.getByLabel(`Rename ${original}`)).toBeVisible();

      await page.getByPlaceholder('Search assets').fill('svelte-asset');
      const name = page.getByLabel(`Rename ${original}`);
      await name.fill(renamed);
      await name.press('Enter');
      await expect(page.getByLabel(`Rename ${renamed}`)).toBeVisible();

      await page.getByRole('button', { name: `Delete ${renamed}` }).click();
      await expect(page.getByLabel(`Rename ${renamed}`)).toHaveCount(0);
    } finally {
      await request.delete(`/__assets/alpha/${original}`);
      await request.delete(`/__assets/alpha/${renamed}`);
    }
  });
});
