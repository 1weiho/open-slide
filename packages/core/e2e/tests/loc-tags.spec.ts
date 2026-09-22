import { expect, test } from '@playwright/test';
import { editorCanvas, openSlide } from './helpers.ts';

test.describe('inspector location tags', () => {
  test('JSX authored outside the deck entry is not targetable', async ({ page }) => {
    await openSlide(page, 'edit-target');
    const canvas = editorCanvas(page);
    // Rendered only while an element is selected, whether or not the panel itself stays open.
    const selectedText = page.locator('aside[data-inspector-ui]').getByPlaceholder('Element text');

    const entryHeadline = canvas.getByText('Editable headline');
    await expect(entryHeadline).toHaveAttribute('data-slide-loc', /^\d+:\d+$/);

    await entryHeadline.click();
    await expect(selectedText)
      .toHaveValue('Editable headline', { timeout: 2_000 })
      .catch(async () => {
        await page.getByTitle('Inspect').click();
        await entryHeadline.click();
      });
    await expect(selectedText).toHaveValue('Editable headline');

    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(selectedText).toHaveCount(0);

    const siblingHeading = canvas.getByText('Sibling-file target');
    await expect(siblingHeading).toBeVisible();
    await expect(siblingHeading).not.toHaveAttribute('data-slide-loc');
    await expect(canvas.locator('[data-slide-loc]')).toHaveCount(0);

    await siblingHeading.click();
    // Fails as soon as a selection appears, instead of sampling once right after the click.
    await expect(expect(selectedText).toHaveCount(1, { timeout: 1_000 })).rejects.toThrow();

    await page.getByRole('button', { name: 'Go to page 1' }).click();
    await entryHeadline.click();
    await expect(selectedText).toHaveValue('Editable headline');
  });
});
