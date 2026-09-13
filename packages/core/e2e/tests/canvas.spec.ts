import { expect, test } from '@playwright/test';
import { editorCanvas, openSlide } from './helpers.ts';

test('configured canvas drives native dimensions and export metadata', async ({ page }) => {
  await openSlide(page, 'alpha');

  const canvas = editorCanvas(page).locator('[data-osd-canvas]').first();
  await expect(canvas).toHaveCSS('width', '3840px');
  await expect(canvas).toHaveCSS('height', '2160px');
  const bounds = await canvas.boundingBox();
  expect(bounds?.width).toBeLessThan(3840);
  expect(bounds?.height).toBeLessThan(2160);

  await page.getByRole('button', { name: 'Download' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByText('Canvas')).toBeVisible();
  await expect(menu.getByText('3840 × 2160')).toBeVisible();
});
