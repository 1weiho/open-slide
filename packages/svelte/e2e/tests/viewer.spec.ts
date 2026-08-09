import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('Svelte slide viewer', () => {
  test('loads, navigates, opens overview, and handles wheel input', async ({ page }) => {
    await page.goto('/s/alpha');
    const viewport = page.locator('.viewport');
    await expect(viewport.getByText('Alpha page one')).toBeVisible();
    await expect(page.getByText('Alpha Deck')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(viewport.getByText('Alpha page two')).toBeVisible();
    await expect
      .poll(() => viewport.locator('.os-page-host').evaluate((node) => node.getAnimations().length))
      .toBe(1);

    await page.keyboard.press('o');
    const overview = page.getByRole('dialog', { name: 'Slide overview' });
    await expect(overview).toBeVisible();
    await overview.getByRole('button', { name: 'Go to slide 3' }).click();
    await expect(page).toHaveURL(/[?&]p=3/);

    await viewport.hover();
    await page.mouse.wheel(0, -120);
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('supports presentation controls and keyboard overlays', async ({ page }) => {
    await page.goto('/s/alpha');
    await page.keyboard.press('Enter');
    await expect(page.locator('.play-shell')).toBeVisible();

    await page.keyboard.press('End');
    await expect(page).toHaveURL(/[?&]p=3/);
    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/[?&]p=1/);

    await page.keyboard.press('3');
    await expect(page.locator('[aria-live="polite"]')).toHaveText('3');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/[?&]p=3/);

    await page.keyboard.press('b');
    await expect(page.locator('.bg-black')).toBeVisible();
    await page.keyboard.press('b');
    await expect(page.locator('.bg-black')).toBeHidden();

    await page.keyboard.press('?');
    await expect(page.getByText('Keyboard shortcuts')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard shortcuts')).toBeHidden();

    await page.keyboard.press('l');
    await page.mouse.move(400, 300);
    await expect(page.locator('.laser-pointer')).toBeVisible();

    await page.getByRole('button', { name: 'Previous slide (←)' }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('reveals Svelte steps before advancing and restores them when retreating', async ({
    page,
  }) => {
    await page.goto('/s/steps');
    await page.keyboard.press('Enter');
    await expect(page.locator('.play-shell')).toHaveAttribute('data-step-count', '0');
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.locator('[data-osd-step="pending"]')).toHaveCount(2);
    await expect(page.locator('.play-shell')).toHaveAttribute('data-step-count', '2');

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.play-shell')).toHaveAttribute('data-step-revealed', '1');
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(2);
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=3/);

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(2);
  });

  test('supports touch swipe navigation', async ({ page }) => {
    await page.goto('/s/alpha');
    const viewport = page.locator('.viewport');
    await viewport.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: 320 }] });
    await viewport.dispatchEvent('touchend', {
      changedTouches: [{ identifier: 1, clientX: 120 }],
    });
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('duplicates, reorders, and deletes pages through shared slide operations', async ({
    page,
  }) => {
    const entryUrl = new URL('../fixture/slides/alpha/index.ts', import.meta.url);
    const originalSource = await fs.readFile(entryUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Duplicate page' }).click();
      await expect(page).toHaveURL(/[?&]p=2/);
      await expect(page.getByText('2 / 4').first()).toBeVisible();

      const reordered = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__slides/alpha/reorder') &&
          response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Move page later' }).click();
      expect((await reordered).status()).toBe(200);
      await expect(page).toHaveURL(/[?&]p=3/);

      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Delete page' }).click();
      await expect(page.getByText('3 / 3').first()).toBeVisible();
    } finally {
      await fs.writeFile(entryUrl, originalSource);
    }
  });

  test('serves shared dev APIs', async ({ request }) => {
    expect((await request.get('/__server-status')).ok()).toBe(true);
    expect((await request.get('/__folders/')).ok()).toBe(true);
    expect((await request.get('/__assets/alpha/')).ok()).toBe(true);
  });
});
