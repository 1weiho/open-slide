import { writeFile } from 'node:fs/promises';
import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  slideSourcePath,
} from './helpers.ts';

async function geometry(element: Locator) {
  return element.evaluate((node) => {
    const canvas = node.closest<HTMLElement>('[data-osd-canvas]');
    if (!canvas) throw new Error('Resize target is outside the canvas');
    const origin = canvas.getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    const scale = origin.width / canvas.offsetWidth;
    const style = getComputedStyle(node);
    return {
      x: (bounds.x - origin.x) / scale,
      y: (bounds.y - origin.y) / scale,
      width: bounds.width / scale,
      height: bounds.height / scale,
      localWidth: Number.parseFloat(style.width),
      localHeight: Number.parseFloat(style.height),
      scale,
    };
  });
}

test.describe('rotated resizing regressions', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openResizeTarget(
    page: Page,
    request: APIRequestContext,
    slideId: string,
    rotation: number,
  ) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import type { Page, SlideMeta } from '@open-slide/core';
export const meta: SlideMeta = { title: 'Rotated resizing', createdAt: '2026-01-01T00:00:00.000Z' };
const Only: Page = () => (
  <div style={{ width: '100%', height: '100%', position: 'relative', background: '#14213d' }}>
    <div style={{ position: 'absolute', left: 500, top: 300, width: 200, height: 100, rotate: '${rotation}deg', background: '#2a9d8f', color: 'white', fontSize: 24 }}>Resize block</div>
  </div>
);
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const block = editorCanvas(page).getByText('Resize block', { exact: true });
    await block.click();
    await page
      .locator('aside[data-inspector-ui]')
      .getByRole('tab', { name: 'Arrange', exact: true })
      .click();
    return block;
  }

  test('a west resize near 45 degrees stays bounded and keeps the opposite edge fixed', async ({
    page,
    request,
  }) => {
    const block = await openResizeTarget(page, request, 'resize-near-diagonal', 44);
    const before = await geometry(block);
    const handle = page.locator('[data-resize-handle="w"]');
    await handle.click({ trial: true });
    const bounds = await handle.boundingBox();
    if (!bounds) throw new Error('Resize handle has no bounding box');
    const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 50 * before.scale, start.y, { steps: 8 });
    await page.mouse.up();

    await expect.poll(async () => (await geometry(block)).width).toBeGreaterThan(before.width + 15);
    const after = await geometry(block);
    expect(after.width).toBeLessThan(before.width + 40);
    expect(after.localWidth / after.localHeight).toBeCloseTo(2, 2);
    expect(Math.abs(after.x + after.width - before.x - before.width)).toBeLessThan(1.5);
    expect(Math.abs(after.y + after.height / 2 - before.y - before.height / 2)).toBeLessThan(1.5);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await geometry(block)).width).toBeCloseTo(before.width, 0);
    await expect.poll(async () => (await geometry(block)).localHeight).toBeCloseTo(100, 0);
  });

  for (const rotation of [0, 45]) {
    test(`the width field resizes a ${rotation}-degree element without runaway dimensions`, async ({
      page,
      request,
    }) => {
      const block = await openResizeTarget(page, request, `resize-field-${rotation}`, rotation);
      const before = await geometry(block);
      const width = page.locator('aside[data-inspector-ui]').getByLabel('Width', { exact: true });
      await width.fill(String(before.width + 50));
      await width.press('Enter');

      const expectedWidth = before.width + (rotation === 0 ? 50 : 25);
      await expect.poll(async () => (await geometry(block)).width).toBeCloseTo(expectedWidth, 0);
      const after = await geometry(block);
      expect(Math.abs(after.x - before.x)).toBeLessThan(1.5);
      expect(Math.abs(after.y - before.y)).toBeLessThan(1.5);
      if (rotation === 0) expect(after.height).toBeCloseTo(100, 0);
      else expect(after.localWidth / after.localHeight).toBeCloseTo(2, 2);
    });
  }
});
