import { expect, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
} from './helpers.ts';

test.describe('inspector editing', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdSlides.splice(0)) {
      await deleteSlide(request, id);
    }
  });

  async function openEditable(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext,
    slideId: string,
  ) {
    await duplicateSlide(request, 'edit-target', slideId);
    createdSlides.push(slideId);
    await openSlide(page, slideId);
  }

  test('selecting an element opens the panel with its tag and text', async ({ page, request }) => {
    await openEditable(page, request, 'insp-select');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    const panel = page.locator('aside[data-inspector-ui]');
    await expect(panel).toBeVisible();
    await expect(panel.getByText('<h1>')).toBeVisible();
    await expect(panel.getByPlaceholder('Element text')).toHaveValue('Editable headline');
  });

  test('saving a text edit rewrites the slide source on disk', async ({ page, request }) => {
    await openEditable(page, request, 'insp-save');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Edited via inspector');
    await expect(editorCanvas(page).getByText('Edited via inspector')).toBeVisible();
    await expect(page.getByText('1 unsaved change')).toBeVisible();

    const saved = page.waitForResponse(
      (res) => res.url().includes('/__edit') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save' }).click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readSlideSource('insp-save')).toContain('Edited via inspector');
  });

  test('discard reverts the edit without touching the file', async ({ page, request }) => {
    await openEditable(page, request, 'insp-discard');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Discarded text');
    await expect(editorCanvas(page).getByText('Discarded text')).toBeVisible();

    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(editorCanvas(page).getByText('Editable headline')).toBeVisible();
    expect(await readSlideSource('insp-discard')).not.toContain('Discarded text');
  });

  test('toggling the inspector off commits pending edits', async ({ page, request }) => {
    await openEditable(page, request, 'insp-commit');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable body copy').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Committed body copy');

    const saved = page.waitForResponse(
      (res) => res.url().includes('/__edit') && res.request().method() === 'POST',
    );
    await page.getByTitle('Inspect').click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readSlideSource('insp-commit')).toContain('Committed body copy');
  });

  test('the i shortcut toggles inspect mode', async ({ page, request }) => {
    await openEditable(page, request, 'insp-key');
    await page.keyboard.press('i');
    await editorCanvas(page).getByText('Editable headline').click();
    await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
  });
});
