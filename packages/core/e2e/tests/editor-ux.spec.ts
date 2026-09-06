import { writeFile } from 'node:fs/promises';
import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
  slideSourcePath,
} from './helpers.ts';

async function expectSameBox(
  element: Locator,
  expected: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>,
) {
  await expect
    .poll(async () => {
      const actual = await element.boundingBox();
      if (!actual) return Infinity;
      return Math.max(
        ...(['x', 'y', 'width', 'height'] as const).map((key) =>
          Math.abs(actual[key] - expected[key]),
        ),
      );
    })
    .toBeLessThan(0.5);
}

async function textStyle(element: Locator, text: string, property: 'fontWeight' | 'fontStyle') {
  return element.evaluate(
    (node, { text, property }) => {
      const start = (node.textContent ?? '').indexOf(text);
      if (start < 0) return [];
      const end = start + text.length;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const styles = new Set<string>();
      let offset = 0;
      for (let part = walker.nextNode(); part; part = walker.nextNode()) {
        const next = offset + (part.textContent?.length ?? 0);
        if (offset < end && next > start && part.parentElement) {
          styles.add(getComputedStyle(part.parentElement)[property]);
        }
        offset = next;
      }
      return [...styles];
    },
    { text, property },
  );
}

test.describe('editor interaction flow', () => {
  const createdSlides: string[] = [];
  let browserErrors: string[] = [];

  test.beforeEach(() => {
    browserErrors = [];
  });

  test.afterEach(async ({ page, request }) => {
    expect.soft(browserErrors, 'Editor interactions should not log browser errors').toEqual([]);
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  function captureBrowserErrors(page: Page) {
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
  }

  async function openEditor(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const panel = page.locator('aside[data-inspector-ui]');
    await expect(panel).toHaveCSS('width', '320px');
    captureBrowserErrors(page);
    return {
      panel,
      headline: editorCanvas(page).getByText('Editable headline', { exact: true }),
      body: editorCanvas(page).getByText('Editable body copy', { exact: true }),
    };
  }

  test('selection changes keep the slide stationary and the Format sidebar open', async ({
    page,
    request,
  }) => {
    const { panel, headline, body } = await openEditor(page, request, 'ux-stable-canvas');
    await expect(panel.getByText('Select an object', { exact: true })).toBeVisible();
    const canvas = editorCanvas(page).locator('[data-osd-canvas]');
    const original = await canvas.boundingBox();
    if (!original) throw new Error('Slide canvas has no bounding box');

    await headline.click();
    await expect(headline).not.toHaveAttribute('contenteditable', 'true');
    await expect(panel.getByRole('tab', { name: 'Text', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectSameBox(canvas, original);
    await body.click();
    await expectSameBox(canvas, original);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-selection-frame]')).toHaveCount(0);
    await expect(panel.getByText('Select an object', { exact: true })).toBeVisible();
    await expectSameBox(canvas, original);
    await headline.click();
    await expectSameBox(canvas, original);
  });

  test('Enter edits selected text and Escape steps back through selection', async ({
    page,
    request,
  }) => {
    const { panel, headline } = await openEditor(page, request, 'ux-enter-escape');
    await headline.click();
    await page.keyboard.press('Enter');
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await expect(headline).toBeFocused();
    await expect(editorCanvas(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(headline).not.toHaveAttribute('contenteditable', 'true');
    await expect(page.locator('[data-selection-frame]')).toHaveCount(1);
    await expect(panel.getByRole('tab', { name: 'Text', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-selection-frame]')).toHaveCount(0);
    await expect(panel.getByText('Select an object', { exact: true })).toBeVisible();
  });

  test('sidebar formatting applies to the highlighted word and shares inline shortcuts', async ({
    page,
    request,
  }) => {
    const { panel, body } = await openEditor(page, request, 'ux-range-format');
    await body.dblclick();
    await expect(body).toHaveAttribute('contenteditable', 'true');
    await body.press('Home');
    for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe('Editable');
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCount(1);
    await panel.getByRole('button', { name: 'Bold', exact: true }).click();
    const word = body.getByText('Editable', { exact: true });
    await expect(word).toHaveCSS('font-weight', '700');
    await expect(body).toHaveCSS('font-weight', '400');
    await expect(body).toHaveText('Editable body copy');
    await expect(body).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe('Editable');

    await page.keyboard.press('ControlOrMeta+i');
    await expect(word).toHaveCSS('font-style', 'italic');
    await expect(body).toHaveCSS('font-style', 'normal');
    await expect(panel).toBeVisible();
  });

  test('Bold and Italic can override inherited formatting and Regular restores normal weight', async ({
    page,
    request,
  }) => {
    const slideId = 'ux-inherited-format';
    const { panel, headline } = await openEditor(page, request, slideId);
    const source = await readSlideSource(slideId);
    await writeFile(
      slideSourcePath(slideId),
      source.replace('padding: 120,', "padding: 120, fontWeight: 700, fontStyle: 'italic',"),
    );
    await expect(headline).toHaveCSS('font-weight', '700');
    await expect(headline).toHaveCSS('font-style', 'italic');
    await headline.click();
    const bold = panel.getByRole('button', { name: 'Bold', exact: true });
    const italic = panel.getByRole('button', { name: 'Italic', exact: true });
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await bold.click();
    await italic.click();
    await expect(headline).toHaveCSS('font-weight', '400');
    await expect(headline).toHaveCSS('font-style', 'normal');
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
    await expect(italic).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(headline).toHaveCSS('font-weight', '700');
    await panel.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Regular · 400', exact: true }).click();
    await expect(headline).toHaveCSS('font-weight', '400');
  });

  test('keyboard undo and redo restore sidebar formatting during active text editing', async ({
    page,
    request,
  }) => {
    const { panel, body } = await openEditor(page, request, 'ux-format-keyboard-history');
    await body.dblclick();
    await body.press('Home');
    for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await panel.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect.poll(() => textStyle(body, 'Editable', 'fontWeight')).toEqual(['700']);
    await expect(body).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => textStyle(body, 'Editable', 'fontWeight')).toEqual(['400']);
    await expect(body).toBeFocused();
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => textStyle(body, 'Editable', 'fontWeight')).toEqual(['700']);
    await expect(body).toHaveText('Editable body copy');
    await expect(body).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' again');
    const paragraph = editorCanvas(page).locator('p');
    await expect(paragraph).toHaveText('Editable body copy again');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(paragraph).toHaveText('Editable body copy');
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(paragraph).toHaveText('Editable body copy again');
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);
    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.keyboard.press('ControlOrMeta+s');
    const response = await saved;
    expect(response.status()).toBe(200);
    const result = (await response.json()) as { results: { ok: boolean; error?: string }[] };
    expect(result.results.filter((entry) => !entry.ok)).toEqual([]);
  });

  test('typing around a word-formatting edit saves the final text and styling together', async ({
    page,
    request,
  }) => {
    const { panel, body } = await openEditor(page, request, 'ux-text-style-save');
    const paragraph = editorCanvas(page).locator('p');
    await body.dblclick();
    await body.press('End');
    await page.keyboard.insertText(' updated');
    await expect(paragraph).toHaveText('Editable body copy updated');
    await paragraph.press('Home');
    for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe('Editable');
    await panel.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(paragraph.getByText('Editable', { exact: true })).toHaveCSS('font-weight', '700');
    await expect(paragraph).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' again');
    await expect(paragraph).toHaveText('Editable body copy updated again');

    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.keyboard.press('ControlOrMeta+s');
    const response = await saved;
    expect(response.status()).toBe(200);
    const result = (await response.json()) as { results: { ok: boolean; error?: string }[] };
    expect(result.results.filter((entry) => !entry.ok)).toEqual([]);
    await expect
      .poll(() => readSlideSource('ux-text-style-save'))
      .toContain('body copy updated again');
    expect(await readSlideSource('ux-text-style-save')).toContain('fontWeight');
    await page.reload();
    await expect(paragraph).toHaveText('Editable body copy updated again');
    await expect(paragraph.getByText('Editable', { exact: true })).toHaveCSS('font-weight', '700');
    await expect(paragraph).toHaveCSS('font-weight', '400');
  });

  test('formatting after inserted text uses current word positions through undo and save', async ({
    page,
    request,
  }) => {
    const { panel, body } = await openEditor(page, request, 'ux-range-offsets');
    const paragraph = editorCanvas(page).locator('p');
    await body.dblclick();
    await body.press('Home');
    for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await panel.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(paragraph).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.insertText('New ');
    await expect(paragraph).toHaveText('New Editable body copy');
    await page.keyboard.press('Home');
    for (let i = 0; i < 'New Editable '.length; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 'body'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('body');
    await panel.getByRole('button', { name: 'Italic', exact: true }).click();
    await expect.poll(() => textStyle(paragraph, 'body', 'fontStyle')).toEqual(['italic']);
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(paragraph).toHaveText('New Editable body copy');
    await expect.poll(() => textStyle(paragraph, 'body', 'fontStyle')).toEqual(['normal']);
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect.poll(() => textStyle(paragraph, 'body', 'fontStyle')).toEqual(['italic']);
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);

    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(200);
    const result = (await response.json()) as { results: { ok: boolean; error?: string }[] };
    expect(result.results.filter((entry) => !entry.ok)).toEqual([]);
    await page.reload();
    await expect(paragraph).toHaveText('New Editable body copy');
    await expect.poll(() => textStyle(paragraph, 'body', 'fontStyle')).toEqual(['italic']);
    await expect.poll(() => textStyle(paragraph, 'body', 'fontWeight')).toEqual(['400']);
    await expect.poll(() => textStyle(paragraph, 'Editable', 'fontWeight')).toEqual(['700']);
  });

  test('closing Format preserves text editing and reveals the compact text toolbar', async ({
    page,
    request,
  }) => {
    const { panel, body } = await openEditor(page, request, 'ux-compact-toolbar');
    await body.dblclick();
    await expect(body).toHaveAttribute('contenteditable', 'true');
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCount(1);
    await panel.getByRole('button', { name: 'Close Format panel', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(body).toHaveAttribute('contenteditable', 'true');
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toBeVisible();
    await page.getByTitle('Format', { exact: true }).click();
    await expect(panel).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCount(1);
  });

  test('Preview disables selection and text interception and Edit restores them', async ({
    page,
    request,
  }) => {
    const { panel, headline, body } = await openEditor(page, request, 'ux-preview');
    const preview = page.getByTitle('Preview', { exact: true });
    const edit = page.getByTitle('Edit', { exact: true });
    await expect(preview).toBeVisible();
    await expect(edit).toBeVisible();
    await expect(preview).toHaveAttribute('aria-pressed', 'false');
    await expect(edit).toHaveAttribute('aria-pressed', 'true');
    await headline.click();
    await edit.click();
    await expect(edit).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-selection-frame]')).toHaveCount(1);
    await preview.click();
    await expect(preview).toHaveAttribute('aria-pressed', 'true');
    await expect(edit).toHaveAttribute('aria-pressed', 'false');
    await preview.click();
    await expect(preview).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-selection-frame]')).toHaveCount(0);
    await body.click();
    await body.dblclick();
    await expect(body).not.toHaveAttribute('contenteditable', 'true');
    await expect(page.locator('[data-selection-frame]')).toHaveCount(0);

    await edit.click();
    await expect(edit).toHaveAttribute('aria-pressed', 'true');
    await expect(preview).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toBeVisible();
    await body.click();
    await expect(page.locator('[data-selection-frame]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(body).toHaveAttribute('contenteditable', 'true');
  });

  test('Format and Design share one sidebar without losing the selected object', async ({
    page,
    request,
  }) => {
    const { panel, headline } = await openEditor(page, request, 'ux-sidebar-switch');
    await headline.click();
    await page.keyboard.press('d');
    const design = page.locator('aside[data-design-ui]');
    await expect(design).toBeVisible();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-selection-frame]')).toHaveCount(1);
    await page.getByTitle('Format', { exact: true }).click();
    await expect(panel).toBeVisible();
    await expect(design).toHaveCount(0);
    await expect(panel.getByRole('tab', { name: 'Text', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('keyboard activation of sidebar controls does not present or navigate the slide', async ({
    page,
    request,
  }) => {
    const slideId = 'ux-panel-keys';
    createdSlides.push(slideId);
    await duplicateSlide(request, 'alpha', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const panel = page.locator('aside[data-inspector-ui]');
    captureBrowserErrors(page);
    const headline = editorCanvas(page).getByText('Alpha page one', { exact: true });
    await headline.click();
    await panel.getByRole('button', { name: 'Edit text on slide', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await expect(editorCanvas(page)).toBeVisible();
    await page.keyboard.press('Escape');

    const bold = panel.getByRole('button', { name: 'Bold', exact: true });
    await bold.focus();
    await page.keyboard.press('Space');
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(headline).toHaveCSS('font-weight', '700');
    await expect(page).toHaveURL(/\/s\/ux-panel-keys$/);
    await expect(editorCanvas(page)).toBeVisible();
  });

  test('Preview returns keyboard navigation to the slide after clicking its toolbar button', async ({
    page,
  }) => {
    await openSlide(page, 'alpha');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    captureBrowserErrors(page);
    await page.getByTitle('Preview', { exact: true }).click();
    await expect(page.locator('aside[data-inspector-ui]')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(editorCanvas(page).getByText('Alpha page two', { exact: true })).toBeVisible();
  });

  test('composition and a local popup own Enter and Escape before the canvas', async ({
    page,
    request,
  }) => {
    const { panel, headline } = await openEditor(page, request, 'ux-local-keys');
    await headline.click();
    await headline.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    await expect(headline).not.toHaveAttribute('contenteditable', 'true');
    await headline.dispatchEvent('keydown', { key: 'Escape', isComposing: true });
    await expect(page.locator('[data-selection-frame]')).toHaveCount(1);

    await page.keyboard.press('Enter');
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await headline.dispatchEvent('keydown', { key: 'Escape', isComposing: true });
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await panel.getByRole('combobox').first().click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await expect(panel).toBeVisible();
  });
});
