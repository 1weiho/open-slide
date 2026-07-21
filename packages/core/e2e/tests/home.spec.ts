import { expect, test } from '@playwright/test';

test.describe('home slide browser', () => {
  test('lists every fixture deck with its display title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3')).toHaveCount(4);
    await expect(page.getByText('Alpha Deck')).toBeVisible();
    await expect(page.getByText('Steps Deck')).toBeVisible();
    await expect(page.getByText('Edit Target')).toBeVisible();
    await expect(page.getByText('Hot Deck')).toBeVisible();
  });

  test('slide card links to the viewer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Alpha Deck' }).click();
    await expect(page).toHaveURL(/\/s\/alpha$/);
    await expect(page.locator('main[data-inspector-root]').getByText('Alpha page one')).toBeVisible(
      { timeout: 30_000 },
    );
  });

  test('search filters decks and can be cleared', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Search slides');
    await search.fill('steps');
    await expect(page.locator('li h3')).toHaveCount(1);
    await expect(page.getByText('Steps Deck')).toBeVisible();

    await search.fill('zzz-no-match');
    await expect(page.getByText('No matches')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).first().click();
    await expect(page.locator('li h3')).toHaveCount(4);
  });

  test('sort control reorders decks by created date', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3').first()).toHaveText('Alpha Deck');
    await page.getByRole('button', { name: /^Sort:/ }).click();
    await page.getByRole('menuitem', { name: 'Oldest' }).click();
    await expect(page.locator('li h3').first()).toHaveText('Hot Deck');
  });

  test('deck theme badge links to the theme page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'plain' }).click();
    await expect(page).toHaveURL(/\/themes\/plain$/);
    await expect(page.getByText('Plain').first()).toBeVisible();
  });

  test('themes gallery lists fixture themes', async ({ page }) => {
    await page.goto('/themes');
    await expect(page.getByText('Plain').first()).toBeVisible();
    await expect(page.getByText('Minimal fixture theme for e2e tests.')).toBeVisible();
  });

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('language toggle switches locale and persists across reloads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: '繁體中文' }).click();
    await expect(page.getByText('投影片').first()).toBeVisible();

    await page.reload();
    await expect(page.getByText('投影片').first()).toBeVisible();
  });

  test('unknown routes render the not-found page', async ({ page }) => {
    await page.goto('/definitely-not-a-route');
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('folders can be created and deleted from the sidebar', async ({ page, request }) => {
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'New folder' }).click();
      const input = page.getByPlaceholder('Folder name');
      await input.fill('Sidebar Folder');
      await expect(input).toHaveValue('Sidebar Folder');
      const created = page.waitForResponse(
        (res) => res.url().includes('/__folders') && res.request().method() === 'POST',
      );
      await input.press('Enter');
      expect((await created).status()).toBe(200);

      // "Folder actions" only exists on real folder rows, so its presence proves
      // the new folder rendered in the sidebar (the name alone also matches the
      // success toast).
      const actions = page.getByRole('button', { name: 'Folder actions' });
      await expect(actions).toBeVisible();
      await actions.click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(actions).toHaveCount(0);
    } finally {
      const { folders } = (await (await request.get('/__folders')).json()) as {
        folders: { id: string }[];
      };
      for (const folder of folders) await request.delete(`/__folders/${folder.id}`);
    }
  });
});
