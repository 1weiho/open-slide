import { expect, test } from '@playwright/test';

test.describe('Svelte themes', () => {
  test('links from a deck to the gallery and detail demo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'plain' }).click();
    await expect(page).toHaveURL(/\/themes\/plain$/);
    await expect(page.getByText('Theme demo one')).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Theme demo two')).toBeVisible();
    await page.getByRole('button', { name: 'Expand prompt' }).click();
    await expect(page.getByText('Keep every slide calm and literal.')).toBeVisible();

    await page.goto('/themes');
    await expect(page.getByText('Plain').first()).toBeVisible();
    await expect(page.getByText('Minimal fixture theme for Svelte e2e tests.')).toBeVisible();
  });
});
