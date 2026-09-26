import { expect, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
} from './helpers.ts';

test.describe('slide viewer', () => {
  test('opens on page one with the deck title in the toolbar', async ({ page }) => {
    await openSlide(page, 'alpha');
    await expect(editorCanvas(page).getByText('Alpha page one')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alpha Deck' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('arrow keys navigate pages and update the url', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(editorCanvas(page).getByText('Alpha page two')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/[?&]p=1/);
    await expect(editorCanvas(page).getByText('Alpha page one')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/[?&]p=1/);
  });

  test('deep links clamp the page query param', async ({ page }) => {
    await openSlide(page, 'alpha', '?p=999');
    await expect(editorCanvas(page).getByText('Alpha page three')).toBeVisible();

    await openSlide(page, 'alpha', '?p=0');
    await expect(editorCanvas(page).getByText('Alpha page one')).toBeVisible();
  });

  test('clicking a thumbnail jumps to that page', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(page.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('overview grid opens, navigates with the keyboard, and closes', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.keyboard.press('o');
    const overview = page.getByRole('dialog', { name: 'Slide overview' });
    await expect(overview).toBeVisible();
    await expect(overview.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(overview).toBeHidden();
    await expect(page).toHaveURL(/[?&]p=2/);

    await page.keyboard.press('o');
    await expect(overview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(overview).toBeHidden();
  });

  test('wheel scrolling navigates pages in Preview', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.getByTitle('Preview', { exact: true }).click();
    await expect(page.locator('aside[data-inspector-ui]')).toHaveCount(0);
    await editorCanvas(page).hover();
    await page.mouse.wheel(0, 120);
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('unknown slide ids show the load-failed state', async ({ page }) => {
    await page.goto('/s/does-not-exist');
    await expect(page.getByText('Failed to load slide')).toBeVisible();
  });

  test('back button returns to the home browser', async ({ page }) => {
    await openSlide(page, 'alpha');
    await page.getByRole('button', { name: 'Back to home' }).click();
    await expect(page.locator('li h3')).toHaveCount(4);
  });

  test('back returns to the previous browser location with its query intact', async ({ page }) => {
    await page.goto('/?f=draft');
    await page.waitForFunction(
      () => sessionStorage.getItem('open-slide:last-home-location') === '/?f=draft',
    );
    await page.locator('a[href="/s/alpha"]').first().click();
    await expect(page).toHaveURL(/\/s\/alpha/);
    await page.getByRole('button', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/[?&]f=draft/);
  });

  test('back falls back to the last home location, query included', async ({ page }) => {
    await page.goto('/?f=draft');
    await page.waitForFunction(
      () => sessionStorage.getItem('open-slide:last-home-location') === '/?f=draft',
    );
    await openSlide(page, 'alpha');
    await page.getByRole('button', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/[?&]f=draft/);
  });

  test('steps render fully revealed in the editor', async ({ page }) => {
    await openSlide(page, 'steps', '?p=2');
    await expect(editorCanvas(page).locator('[data-osd-step="revealed"]')).toHaveCount(2);
    await expect(editorCanvas(page).locator('[data-osd-step="pending"]')).toHaveCount(0);
  });

  test('thumbnail context menu duplicates and deletes a page', async ({ page, request }) => {
    try {
      await duplicateSlide(request, 'alpha', 'thumb-ops');
      await openSlide(page, 'thumb-ops');
      await expect(page.getByRole('button', { name: 'Go to page 3' })).toBeVisible();

      await page.getByRole('button', { name: 'Go to page 1' }).click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Duplicate' }).click();
      await expect(page.getByRole('button', { name: 'Go to page 4' })).toBeVisible();

      await page.getByRole('button', { name: 'Go to page 4' }).click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByRole('button', { name: 'Go to page 4' })).toHaveCount(0);
    } finally {
      await deleteSlide(request, 'thumb-ops');
    }
  });

  test('thumbnail rail adds blank pages that persist after reload', async ({ page, request }) => {
    try {
      await duplicateSlide(request, 'alpha', 'add-page-ui');
      await openSlide(page, 'add-page-ui');
      const thumbs = page.getByRole('button', { name: /^Go to page \d+$/ });
      await expect(thumbs).toHaveCount(3);

      await page.getByRole('button', { name: 'Go to page 1' }).click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Add page after' }).click();
      await expect(thumbs).toHaveCount(4);
      await expect(page).toHaveURL(/[?&]p=2\b/);
      await expect
        .poll(() => readSlideSource('add-page-ui'))
        .toContain('export default [One, Page2, Two, Three] satisfies Page[];');
      const source = await readSlideSource('add-page-ui');
      expect(source).toContain(
        "const Page2: Page = () => <div style={{ width: '100%', height: '100%' }} />;",
      );
      expect(source).toContain("['Alpha speaker note', undefined, undefined, 'Alpha final note']");

      await page.getByRole('button', { name: 'Add page', exact: true }).click();
      await expect(thumbs).toHaveCount(5);
      await expect(page).toHaveURL(/[?&]p=5\b/);
      await expect
        .poll(() => readSlideSource('add-page-ui'))
        .toContain('export default [One, Page2, Two, Three, Page5] satisfies Page[];');

      await page.reload();
      await expect(thumbs).toHaveCount(5);
      await expect(page).toHaveURL(/[?&]p=5\b/);
    } finally {
      await deleteSlide(request, 'add-page-ui');
    }
  });

  test('toolbar title editor renames the deck and saves to disk', async ({ page, request }) => {
    try {
      await duplicateSlide(request, 'edit-target', 'rename-ui');
      await openSlide(page, 'rename-ui');

      const titleButton = page.getByRole('button', { name: 'Rename slide' });
      await titleButton.click();
      await page.keyboard.type('Renamed Deck');
      await page.keyboard.press('Enter');

      await expect(titleButton).toContainText('Renamed Deck');
      await expect.poll(() => readSlideSource('rename-ui')).toContain('Renamed Deck');
    } finally {
      await deleteSlide(request, 'rename-ui');
    }
  });

  test('notes drawer autosaves speaker notes to the slide source', async ({ page, request }) => {
    try {
      await duplicateSlide(request, 'edit-target', 'notes-ui');
      await openSlide(page, 'notes-ui');
      const toggle = page.getByRole('button', { name: /Notes/ });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const saved = page.waitForResponse(
        (res) => res.url().includes('/__notes') && res.request().method() === 'PUT',
      );
      await page
        .getByPlaceholder('Write speaker notes for this slide (Markdown supported)…')
        .fill('Drawer note text');
      expect((await saved).status()).toBe(200);
      await expect.poll(() => readSlideSource('notes-ui')).toContain('Drawer note text');
    } finally {
      await deleteSlide(request, 'notes-ui');
    }
  });
});
