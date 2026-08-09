import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('Svelte export', () => {
  test('downloads a standalone HTML deck containing every page', async ({ page }) => {
    await page.goto('/s/alpha');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export HTML' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('alpha.html');
    const output = await download.path();
    if (!output) throw new Error('download has no local path');
    const html = await fs.readFile(output, 'utf8');
    expect(html).toContain('Alpha page one');
    expect(html).toContain('Alpha page two');
    expect(html).toContain('Alpha page three');
  });

  test('mounts every page in the print root before opening PDF print', async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(window, { __printFrameCount: -1 });
      window.print = () => {
        Object.assign(window, {
          __printFrameCount: document.querySelectorAll('#os-print-root .os-print-frame').length,
        });
        window.dispatchEvent(new Event('afterprint'));
      };
    });
    await page.goto('/s/alpha');
    await page.getByRole('button', { name: 'Export PDF' }).click();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__printFrameCount'))).toBe(3);
    await expect(page.locator('#os-print-root')).toHaveCount(0);
  });
});
