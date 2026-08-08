import { expect, test } from '@playwright/test';
import { openSlide } from './helpers.ts';

test.describe('command menu', () => {
  test('opens on the home page and jumps to a deck', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open command menu' })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');

    const input = page.getByPlaceholder('Search slides or run a command');
    await expect(input).toBeVisible();

    await input.fill('steps');
    await page.getByRole('option', { name: 'Steps Deck' }).click();
    await expect(page).toHaveURL(/\/s\/steps$/);
  });

  test('trigger button opens the menu and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open command menu' }).click();

    const input = page.getByPlaceholder('Search slides or run a command');
    await expect(input).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();
  });

  test('switches theme from the shared appearance group', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open command menu' })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByPlaceholder('Search slides or run a command').fill('theme dark');
    await page.getByRole('option', { name: 'Theme: Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('jumps to a deck page from the slide viewer', async ({ page }) => {
    await openSlide(page, 'steps');
    await page.keyboard.press('ControlOrMeta+k');

    const input = page.getByPlaceholder('Search this deck or run a command');
    await expect(input).toBeVisible();

    // Page entries stay hidden until the user types.
    await expect(page.getByRole('option', { name: 'Page 2' })).toBeHidden();
    await input.fill('page 2');
    await page.getByRole('option', { name: 'Page 2' }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('mobile opens the menu from the slide more-actions dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await openSlide(page, 'alpha');
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Commands' }).click();
    await expect(page.getByPlaceholder('Search this deck or run a command')).toBeFocused();
  });

  test('runs a slide command — overview opens from the menu', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByPlaceholder('Search this deck or run a command').fill('overview');
    await page.getByRole('option', { name: 'Slide overview' }).click();
    await expect(page.getByRole('dialog', { name: 'Slide overview' })).toBeVisible();
  });
});
