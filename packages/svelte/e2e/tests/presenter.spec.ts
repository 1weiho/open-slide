import { expect, test } from '@playwright/test';

test.describe('Svelte presenter', () => {
  test('standalone view shows notes and its unlinked state', async ({ page }) => {
    await page.goto('/s/alpha/presenter');
    await expect(page.getByText('Presenter')).toBeVisible();
    await expect(page.getByText('Not linked')).toBeVisible();
    await expect(page.getByText('Alpha speaker note')).toBeVisible();
  });

  test('links to the player and drives pages, jumps, and blackout', async ({ page, context }) => {
    await page.goto('/s/alpha');
    await page.keyboard.press('Enter');

    const popupPromise = context.waitForEvent('page');
    await page.keyboard.press('p');
    const popup = await popupPromise;
    await expect(popup.getByText('Linked')).toBeVisible();
    await expect(popup.getByText('01 / 03')).toBeVisible();

    await popup.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(popup.getByText('02 / 03')).toBeVisible();
    await expect(popup.getByText('No speaker notes for this slide.')).toBeVisible();

    const jump = popup.locator('input[type="number"]');
    await jump.fill('3');
    await jump.press('Enter');
    await expect(page).toHaveURL(/[?&]p=3/);
    await expect(popup.getByText('Last slide')).toBeVisible();

    const black = popup.getByRole('button', { name: 'Black', exact: true });
    await black.click();
    await expect(black).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.bg-black')).toBeVisible();
    await black.click();
    await expect(page.locator('.bg-black')).toBeHidden();
  });
});
