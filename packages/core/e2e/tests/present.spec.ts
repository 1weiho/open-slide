import { expect, test } from '@playwright/test';
import { editorCanvas, enterPlayMode, openSlide } from './helpers.ts';

test.describe('present mode', () => {
  test('windowed play mode navigates and exits back to the editor', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.getByText('Alpha page two')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(editorCanvas(page)).toBeVisible();
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('home and end keys jump to the first and last page', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    await page.keyboard.press('End');
    await expect(page).toHaveURL(/[?&]p=3/);
    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/[?&]p=1/);
  });

  test('steps reveal one by one before the page advances', async ({ page }) => {
    await openSlide(page, 'steps');
    await enterPlayMode(page);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.locator('[data-osd-step="pending"]')).toHaveCount(2);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(2);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=3/);
    await expect(page.getByText('Steps page three')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.locator('[data-osd-step="revealed"]')).toHaveCount(2);
  });

  test('typing digits jumps to a page', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    await page.keyboard.press('3');
    await expect(page.locator('[aria-live="polite"]').getByText('3')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/[?&]p=3/);
  });

  test('blackout overlays toggle with b and w and clear with escape', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    const black = page.locator('div.absolute.inset-0.bg-black');
    const white = page.locator('div.absolute.inset-0.bg-white');

    await page.keyboard.press('b');
    await expect(black).toBeVisible();
    await page.keyboard.press('b');
    await expect(black).toBeHidden();

    await page.keyboard.press('w');
    await expect(white).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(white).toBeHidden();
    await expect(editorCanvas(page)).toBeHidden();
  });

  test('laser pointer toggles on with l and follows the cursor', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport is not set');
    const dot = page.locator('[class*="z-[60]"]');
    await expect(dot).toHaveCount(0);

    await page.keyboard.press('l');
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await expect(dot).toBeVisible();

    await page.keyboard.press('l');
    await expect(dot).toHaveCount(0);
  });

  test('help overlay lists the keyboard shortcuts', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    await page.keyboard.press('?');
    await expect(page.getByText('Keyboard shortcuts')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard shortcuts')).toBeHidden();
    await expect(editorCanvas(page)).toBeHidden();
  });

  test('overview grid works while presenting', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    await page.keyboard.press('o');
    const overview = page.getByRole('dialog', { name: 'Slide overview' });
    await expect(overview).toBeVisible();
    await overview.getByRole('button', { name: 'Go to slide 2' }).click();
    await expect(overview).toBeHidden();
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('control bar appears near the bottom edge and navigates', async ({ page }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport is not set');
    await page.mouse.move(viewport.width / 2, viewport.height - 10);

    const next = page.getByRole('button', { name: 'Next slide (→)' });
    await expect(next).toBeVisible();
    await next.click();
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.getByText('02 / 03')).toBeVisible();
  });
});
