import { expect, test } from '@playwright/test';
import { editorCanvas, openSlide } from './helpers.ts';

test.describe('CodeBlock', () => {
  test('renders highlighted tokens, line numbers, and a highlighted line', async ({ page }) => {
    await openSlide(page, 'code-block');
    const block = editorCanvas(page).locator('pre[data-waitfor]');
    await expect(block.locator('code[data-osd-code-ready]')).toBeAttached({ timeout: 15_000 });

    const keyword = block.locator('span', { hasText: /^def$/ });
    await expect(keyword).toHaveAttribute('style', /--osd-code-keyword/);

    await expect(block.locator('span[aria-hidden]').first()).toHaveText('1');

    const highlighted = block.locator('code > span').nth(1);
    await expect(highlighted).toContainText('return');
    await expect(highlighted).toHaveCSS('box-shadow', /inset/);
    await expect(block.locator('code > span').first()).toHaveCSS('box-shadow', 'none');
  });

  test('inspector selects the whole block and never edits its text inline', async ({ page }) => {
    await openSlide(page, 'code-block');
    const block = editorCanvas(page).locator('pre[data-waitfor]');
    await expect(block.locator('code[data-osd-code-ready]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();

    const keyword = block.locator('span', { hasText: /^def$/ });
    await keyword.click();
    const frame = page.locator('[data-selection-frame]');
    await expect(frame).toHaveCount(1);
    const [frameBox, blockBox] = await Promise.all([frame.boundingBox(), block.boundingBox()]);
    expect(frameBox?.width).toBeCloseTo(blockBox?.width ?? 0, 0);
    expect(frameBox?.height).toBeCloseTo(blockBox?.height ?? 0, 0);

    const panel = page.locator('aside[data-inspector-ui]');
    await expect(panel).toBeVisible();
    await expect(panel.getByPlaceholder('Element text')).toHaveCount(0);

    await keyword.dblclick();
    await expect(block.locator('[contenteditable="true"]')).toHaveCount(0);
    await expect(block).not.toHaveAttribute('contenteditable', 'true');
  });

  test('swapping language in place shows plain text until the new grammar arrives', async ({
    page,
  }) => {
    await openSlide(page, 'code-block', '?p=2');
    const block = editorCanvas(page).locator('pre[data-waitfor]');
    await expect(block.locator('code[data-osd-code-ready]')).toBeAttached({ timeout: 15_000 });
    await expect(block).toContainText('def greet');

    await page.route(/typescript/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4_000));
      await route.continue();
    });

    await expect(block).toContainText('function greet', { timeout: 10_000 });
    await expect(block.locator('code[data-osd-code-ready]')).toHaveCount(0);

    await expect(block.locator('code[data-osd-code-ready]')).toBeAttached({ timeout: 15_000 });
    await expect(block.locator('span', { hasText: /^function$/ })).toHaveAttribute(
      'style',
      /--osd-code-keyword/,
    );
  });
});
