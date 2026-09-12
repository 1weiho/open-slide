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

    await page.keyboard.press('i');
    const keyword = block.locator('span', { hasText: /^def$/ });
    await keyword.click();
    await expect(page.getByText('<pre>')).toBeVisible();

    await keyword.dblclick();
    await expect(block.locator('[contenteditable="true"]')).toHaveCount(0);
    await expect(block).not.toHaveAttribute('contenteditable', 'true');
  });
});
