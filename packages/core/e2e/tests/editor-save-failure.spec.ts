import { expect, test } from '@playwright/test';
import type { Edit } from '../../src/app/lib/inspector/use-editor';
import { deleteSlide, duplicateSlide, editorCanvas, openSlide, readSlideSource } from './helpers';

test.describe('partially saved text edits', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const slideId of createdSlides.splice(0)) await deleteSlide(request, slideId);
  });

  for (const recovery of ['retry', 'discard'] as const) {
    test(`retains the failed text sequence for ${recovery} while saving unrelated edits`, async ({
      page,
      request,
    }) => {
      const slideId = `text-save-failure-${recovery}`;
      createdSlides.push(slideId);
      await duplicateSlide(request, 'edit-target', slideId);
      await openSlide(page, slideId);
      await expect(page.locator('[data-inspector-ready]')).toBeVisible();
      const canvas = editorCanvas(page);
      const body = canvas.locator('p');
      const headline = canvas.getByText('Editable headline', { exact: true });
      const panel = page.locator('aside[data-inspector-ui]');
      await body.dblclick();
      await body.press('End');
      await page.keyboard.insertText(' first');
      await body.press('Home');
      for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
      await panel.getByRole('button', { name: 'Bold', exact: true }).click();
      await body.press('End');
      await page.keyboard.insertText(' final');
      await body.press('Escape');
      await panel.getByRole('button', { name: 'center', exact: true }).click();
      await expect(body).toHaveCSS('text-align', 'center');
      await headline.click();
      await panel.getByRole('button', { name: 'Italic', exact: true }).click();
      await expect(headline).toHaveCSS('font-style', 'italic');
      if (recovery === 'retry') {
        for (let i = 0; i < 5; i++)
          await page.getByRole('button', { name: 'Undo', exact: true }).click();
        await expect(body).toHaveText('Editable body copy');
        for (let i = 0; i < 5; i++)
          await page.getByRole('button', { name: 'Redo', exact: true }).click();
        await expect(body).toHaveText('Editable body copy first final');
      }

      await page.route(
        '**/__edit/batch',
        async (route) => {
          const data = route.request().postDataJSON() as { slideId: string; edits: Edit[] };
          const rangeEdit = data.edits.find((edit) => edit.ops[0].kind === 'set-text-range-style');
          if (rangeEdit?.ops[0].kind !== 'set-text-range-style') {
            throw new Error('Expected a buffered range-style edit');
          }
          rangeEdit.ops[0].start = -1;
          const response = await route.fetch({ postData: data });
          await route.fulfill({ response });
        },
        { times: 1 },
      );
      const failedSave = page.waitForResponse('**/__edit/batch');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      const firstResult = (await (await failedSave).json()) as { results: { ok: boolean }[] };
      expect(firstResult.results.map((result) => result.ok)).toEqual([
        true,
        false,
        false,
        true,
        true,
      ]);
      await expect(page.getByText('1 unsaved change', { exact: true })).toBeVisible();
      await expect(body).toHaveText('Editable body copy first final');
      await expect(body.getByText('Editable', { exact: true })).toHaveCSS('font-weight', '700');
      const savedPrefix = await readSlideSource(slideId);
      expect(savedPrefix).toContain('Editable body copy first');
      expect(savedPrefix).not.toContain('first final');
      expect(savedPrefix).not.toContain('fontWeight');
      expect(savedPrefix).toContain("fontStyle: 'italic'");
      expect(savedPrefix).toContain("textAlign: 'center'");

      if (recovery === 'retry') {
        const retried = page.waitForResponse('**/__edit/batch');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const result = (await (await retried).json()) as { results: { ok: boolean }[] };
        expect(result.results.map((entry) => entry.ok)).toEqual([true, true]);
        await page.reload();
        await expect(canvas).toBeVisible({ timeout: 20_000 });
        await expect(body).toHaveText('Editable body copy first final');
        await expect(body.getByText('Editable', { exact: true })).toHaveCSS('font-weight', '700');
      } else {
        await page.getByRole('button', { name: 'Discard', exact: true }).click();
        await expect(body).toHaveText('Editable body copy first');
        await expect(body.locator('[style]')).toHaveCount(0);
        expect(await readSlideSource(slideId)).toBe(savedPrefix);
      }
      await expect(headline).toHaveCSS('font-style', 'italic');
      await expect(body).toHaveCSS('text-align', 'center');
      expect(await readSlideSource(slideId)).toContain("textAlign: 'center'");
      await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    });
  }
});
