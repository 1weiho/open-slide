import { expect, test } from '@playwright/test';

test.describe('Svelte home browser', () => {
  test('lists, searches, clears, and sorts decks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3')).toHaveCount(3);
    await expect(page.locator('li h3').first()).toHaveText('Alpha Deck');

    const search = page.getByPlaceholder('Search slides');
    await search.fill('beta');
    await expect(page.locator('li h3')).toHaveCount(1);
    await expect(page.getByText('Beta Deck')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();

    await page.getByLabel('Sort').selectOption('created-asc');
    await expect(page.locator('li h3').first()).toHaveText('Beta Deck');
    await page.reload();
    await expect(page.locator('li h3').first()).toHaveText('Beta Deck');
  });

  test('persists appearance and locale preferences', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Toggle theme').selectOption('dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByLabel('Change language').selectOption('zh-TW');
    await expect(page.getByText('投影片').first()).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByText('投影片').first()).toBeVisible();
  });

  test('opens the command menu and navigates to a deck', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByPlaceholder('Search decks or run a command');
    await expect(input).toBeFocused();
    await input.fill('beta');
    await page.getByRole('option', { name: 'Beta Deck' }).click();
    await expect(page).toHaveURL(/\/s\/beta$/);
    await expect(page.locator('.viewport').getByText('Beta page')).toBeVisible();
  });

  test('creates, assigns, filters, and deletes a folder', async ({ page, request }) => {
    try {
      await page.goto('/');
      await page.getByRole('button', { name: /New folder/ }).click();
      const input = page.getByPlaceholder('Folder name');
      await input.fill('Svelte Folder');
      await input.press('Enter');

      const folderButton = page.getByRole('button', { name: /Svelte Folder/ }).first();
      await expect(folderButton).toBeVisible();
      await page.getByRole('button', { name: /Slides 3/ }).click();
      const assigned = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__folders/assign') && response.request().method() === 'PUT',
      );
      await page.getByLabel('Move Alpha Deck to folder').selectOption({ label: 'Svelte Folder' });
      expect((await assigned).status()).toBe(200);
      await folderButton.click();
      await expect(page.locator('li h3')).toHaveCount(1);
      await expect(page.getByText('Alpha Deck')).toBeVisible();

      const deleted = page.waitForResponse(
        (response) =>
          response.url().includes('/__folders/') && response.request().method() === 'DELETE',
      );
      await page.getByRole('button', { name: 'Delete Svelte Folder' }).click();
      expect((await deleted).status()).toBe(200);
      await expect(folderButton).toHaveCount(0);
    } finally {
      const state = (await (await request.get('/__folders/')).json()) as {
        folders: { id: string }[];
      };
      for (const folder of state.folders) await request.delete(`/__folders/${folder.id}`);
    }
  });
});
