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

type Geometry = { x: number; y: number; width: number; height: number; scale: number };

async function geometry(element: Locator): Promise<Geometry> {
  return element.evaluate((node) => {
    const canvas = node.closest<HTMLElement>('[data-osd-canvas]');
    if (!canvas) throw new Error('Element is outside the slide canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    const scale = canvasRect.width / canvas.offsetWidth;
    return {
      x: (rect.x - canvasRect.x) / scale,
      y: (rect.y - canvasRect.y) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
      scale,
    };
  });
}

async function expectGeometry(element: Locator, expected: Partial<Geometry>, tolerance = 1.5) {
  await expect
    .poll(
      async () => {
        const current = await geometry(element).catch((error: unknown) => {
          if (
            error instanceof Error &&
            error.message.includes('Element is outside the slide canvas')
          )
            return null;
          throw error;
        });
        if (!current) return Infinity;
        return Math.max(
          0,
          ...Object.entries(expected).map(([key, value]) =>
            Math.abs(current[key as keyof Geometry] - value),
          ),
        );
      },
      { message: `Expected slide geometry ${JSON.stringify(expected)}` },
    )
    .toBeLessThan(tolerance);
}

async function startDrag(page: Page, element: Locator, dx: number, dy: number) {
  await element.click({ trial: true });
  const box = await element.boundingBox();
  if (!box) throw new Error('Drag target has no bounding box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
}

test.describe('visual editor', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openEditable(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    await headline.click();
    await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
    await headline.click({ trial: true });
    return headline;
  }

  async function openBlocks(
    page: Page,
    request: APIRequestContext,
    slideId: string,
    overlap = false,
  ) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import type { Page, SlideMeta } from '@open-slide/core';
export const meta: SlideMeta = { title: 'Visual arrangement', createdAt: '2026-01-01T00:00:00.000Z' };
const Only: Page = () => (
  <div style={{ width: '100%', height: '100%', position: 'relative', background: '#14213d', color: 'white', fontFamily: 'system-ui', fontSize: 32 }}>
    <div style={{
      position: 'absolute',
      left: 120,
      top: 160,
      width: 240,
      height: 160,
      background: '#2a9d8f',
      padding: 20,
    }}>First block</div>
    <div style={{ position: 'absolute', left: ${overlap ? 220 : 520}, top: ${overlap ? 200 : 360}, width: 240, height: 160, background: '#e76f51', padding: 20 }}>Second block</div>
    <div style={{ position: 'absolute', left: 1120, top: 660, width: 240, height: 160, background: '#805ad5', padding: 20 }}>Third block</div>
  </div>
);
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    await expect(editorCanvas(page).getByText('First block', { exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    return {
      first: editorCanvas(page).getByText('First block', { exact: true }),
      second: editorCanvas(page).getByText('Second block', { exact: true }),
      third: editorCanvas(page).getByText('Third block', { exact: true }),
    };
  }

  test('drag follows the pointer at a fractional canvas scale and persists after save', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1200, height: 850 });
    const headline = await openEditable(page, request, 'visual-drag-save');
    const source = await readSlideSource('visual-drag-save');
    const before = await geometry(headline);
    expect(before.scale).toBeLessThan(1);

    await page.keyboard.down('Alt');
    await startDrag(page, headline, 37, 29);
    await page.mouse.up();
    await page.keyboard.up('Alt');
    const expected = {
      x: before.x + 37 / before.scale,
      y: before.y + 29 / before.scale,
      width: before.width,
      height: before.height,
    };
    await expectGeometry(headline, expected);
    await expect(page.getByText('1 unsaved change')).toBeVisible();

    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readSlideSource('visual-drag-save')).not.toBe(source);

    await page.reload();
    await expect(headline).toBeVisible();
    await expectGeometry(headline, expected);
  });

  test('a sustained drag keeps its selection frame current without resubscribing', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-sustained-drag');
    const before = await geometry(headline);
    const box = await headline.boundingBox();
    if (!box) throw new Error('Drag target has no bounding box');
    const subscriptions = await headline.evaluateHandle((node) => {
      const counts = { observed: 0, disconnected: 0 };
      const Observer = window.ResizeObserver;
      window.ResizeObserver = class extends Observer {
        tracksTarget = false;
        observe(target: Element, options?: ResizeObserverOptions) {
          if (target === node) {
            this.tracksTarget = true;
            counts.observed++;
          }
          super.observe(target, options);
        }
        disconnect() {
          if (this.tracksTarget) counts.disconnected++;
          super.disconnect();
        }
      };
      return counts;
    });
    const expectFrame = async () => {
      await expect
        .poll(async () => {
          const [frame, target] = await Promise.all([
            page.locator('[data-selection-frame]').boundingBox(),
            headline.boundingBox(),
          ]);
          if (!frame || !target) return Infinity;
          return Math.max(
            ...(['x', 'y', 'width', 'height'] as const).map((key) =>
              Math.abs(frame[key] - target[key]),
            ),
          );
        })
        .toBeLessThan(1.5);
    };

    await page.keyboard.down('Alt');
    await startDrag(page, headline, 10, 10);
    await expectFrame();
    // Continue after the initial 420 ms animation-tracking window has ended.
    await page.waitForTimeout(500);
    const baseline = await subscriptions.jsonValue();
    expect(baseline.observed).toBeGreaterThan(0);
    for (const delta of [30, 60, 90]) {
      await page.mouse.move(box.x + box.width / 2 + delta, box.y + box.height / 2 + delta);
      await expectGeometry(headline, {
        x: before.x + delta / before.scale,
        y: before.y + delta / before.scale,
      });
      await expectFrame();
      expect(await subscriptions.jsonValue()).toEqual(baseline);
    }
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await expectGeometry(headline, before);
    await expectFrame();
    await subscriptions.dispose();
  });

  test('Escape cancels the current drag while preserving the previous nudge', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-cancel-drag');
    const before = await geometry(headline);
    await page.keyboard.press('Shift+ArrowRight');
    await expectGeometry(headline, { x: before.x + 10, y: before.y });

    await startDrag(page, headline, 35, 24);
    await expect
      .poll(async () => Math.abs((await geometry(headline)).y - before.y))
      .toBeGreaterThan(10);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expectGeometry(headline, { x: before.x + 10, y: before.y });
    await expect(page.getByText('1 unsaved change')).toBeVisible();

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, { x: before.x, y: before.y });
  });

  test('Shift selection aligns both elements and undo restores the entire arrangement', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-align');
    const body = editorCanvas(page).getByText('Editable body copy', { exact: true });
    await body.click();
    for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowRight');
    const beforeHeadline = await geometry(headline);
    const beforeBody = await geometry(body);
    expect(beforeBody.x - beforeHeadline.x).toBeGreaterThan(100);

    await headline.click({ modifiers: ['Shift'] });
    await page.getByRole('button', { name: 'Align horizontal centers', exact: true }).click();
    await expect
      .poll(async () => {
        const first = await geometry(headline);
        const second = await geometry(body);
        return Math.abs(first.x + first.width / 2 - (second.x + second.width / 2));
      })
      .toBeLessThan(1.5);
    expect((await geometry(headline)).x).toBeGreaterThan(beforeHeadline.x + 40);
    expect((await geometry(body)).x).toBeLessThan(beforeBody.x - 40);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, { x: beforeHeadline.x, y: beforeHeadline.y });
    await expectGeometry(body, { x: beforeBody.x, y: beforeBody.y });
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expectGeometry(headline, { x: beforeHeadline.x + 60 });
    await expectGeometry(body, { x: beforeBody.x - 60 });
  });

  test('resize handles change slide dimensions and undo restores the original box', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-resize');
    const before = await geometry(headline);
    const handle = page.locator('[data-resize-handle="se"]');
    await expect(handle).toBeVisible();
    await page.keyboard.down('Alt');
    await startDrag(page, handle, -80 * before.scale, 50 * before.scale);
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await expectGeometry(headline, {
      x: before.x,
      y: before.y,
      width: before.width - 80,
      height: before.height + 50,
    });

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, {
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height,
    });
  });

  test('dragging near a sibling shows a guide and snaps their edges together', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-snap');
    const body = editorCanvas(page).getByText('Editable body copy', { exact: true });
    await body.click();
    for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowRight');
    const before = await geometry(body);
    const target = await geometry(headline);
    await startDrag(page, body, (target.x - before.x) * before.scale + 2, 0);
    await expect(page.locator('[data-alignment-guide]').first()).toBeVisible();
    await page.mouse.up();
    await expectGeometry(body, { x: target.x, y: before.y });
    await expect(page.locator('[data-alignment-guide]')).toHaveCount(0);
  });

  test('arrow keys nudge in slide pixels and Shift increases the step', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-nudge');
    const before = await geometry(headline);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expectGeometry(headline, { x: before.x + 1, y: before.y + 1 }, 0.25);
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowUp');
    await expectGeometry(headline, { x: before.x + 11, y: before.y - 9 }, 0.25);
    await expect(page).toHaveURL(/\/s\/visual-nudge$/);
  });

  test('position fields place the element at exact slide coordinates', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-position');
    const before = await geometry(headline);
    const panel = page.locator('aside[data-inspector-ui]');
    await panel.getByRole('tab', { name: 'Arrange', exact: true }).click();
    const horizontal = panel.getByLabel('Horizontal position', { exact: true });
    const vertical = panel.getByLabel('Vertical position', { exact: true });
    await horizontal.fill('230');
    await horizontal.press('Enter');
    await vertical.fill('170');
    await vertical.press('Enter');
    await expectGeometry(headline, {
      x: 230,
      y: 170,
      width: before.width,
      height: before.height,
    });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, { x: 230, y: before.y });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, { x: before.x, y: before.y });
  });

  test('a marquee selects enclosed elements and dragging moves the group together', async ({
    page,
    request,
  }) => {
    const { first, second, third } = await openBlocks(page, request, 'visual-marquee');
    const canvas = editorCanvas(page).locator('[data-osd-canvas]');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Slide canvas has no bounding box');
    const scale = box.width / 1920;
    await page.mouse.move(box.x + 90 * scale, box.y + 130 * scale);
    await page.mouse.down();
    await page.mouse.move(box.x + 800 * scale, box.y + 550 * scale, { steps: 8 });
    await page.mouse.up();
    await expect(
      page
        .getByRole('tabpanel', { name: 'Arrange', exact: true })
        .getByText('2 elements selected', { exact: true }),
    ).toBeVisible();
    await first.click({ trial: true });
    const beforeFirst = await geometry(first);
    const beforeSecond = await geometry(second);
    const beforeThird = await geometry(third);
    await page.keyboard.down('Alt');
    await startDrag(page, first, 31, 23);
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await expectGeometry(first, {
      x: beforeFirst.x + 31 / beforeFirst.scale,
      y: beforeFirst.y + 23 / beforeFirst.scale,
    });
    await expectGeometry(second, {
      x: beforeSecond.x + 31 / beforeFirst.scale,
      y: beforeSecond.y + 23 / beforeFirst.scale,
    });
    await expectGeometry(third, { x: beforeThird.x, y: beforeThird.y });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(first, { x: beforeFirst.x, y: beforeFirst.y });
    await expectGeometry(second, { x: beforeSecond.x, y: beforeSecond.y });
    await page.keyboard.press('Escape');
    await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
    await expect(page.getByText('Select an object', { exact: true })).toBeVisible();
    const fullCanvas = await canvas.boundingBox();
    if (!fullCanvas) throw new Error('Slide canvas has no bounding box');
    await page.mouse.move(fullCanvas.x - 5, fullCanvas.y - 5);
    await page.mouse.down();
    await page.mouse.move(
      fullCanvas.x + fullCanvas.width + 5,
      fullCanvas.y + fullCanvas.height + 5,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect(
      page
        .getByRole('tabpanel', { name: 'Arrange', exact: true })
        .getByText('3 elements selected', { exact: true }),
    ).toBeVisible();
  });

  test('aligning a selection to the slide moves every selected element to the slide edge', async ({
    page,
    request,
  }) => {
    const { first, second } = await openBlocks(page, request, 'visual-align-slide');
    await first.click();
    await second.click({ modifiers: ['Shift'] });
    const beforeFirst = await geometry(first);
    const beforeSecond = await geometry(second);
    const panel = page.locator('aside[data-inspector-ui]');
    await panel.getByRole('button', { name: 'Slide', exact: true }).click();
    await panel.getByRole('button', { name: 'Align left', exact: true }).click();
    await expectGeometry(first, { x: 0, y: beforeFirst.y });
    await expectGeometry(second, { x: 0, y: beforeSecond.y });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(first, { x: beforeFirst.x, y: beforeFirst.y });
    await expectGeometry(second, { x: beforeSecond.x, y: beforeSecond.y });
  });

  test('distribution gives three elements equal gaps and each axis can be undone', async ({
    page,
    request,
  }) => {
    const { first, second, third } = await openBlocks(page, request, 'visual-distribute');
    await first.click();
    const panel = page.locator('aside[data-inspector-ui]');
    await panel.getByRole('tab', { name: 'Arrange', exact: true }).click();
    await panel.getByRole('button', { name: 'Select all', exact: true }).click();
    await expect(
      page
        .getByRole('tabpanel', { name: 'Arrange', exact: true })
        .getByText('3 elements selected', { exact: true }),
    ).toBeVisible();
    await panel.getByRole('button', { name: 'Distribute horizontally', exact: true }).click();
    await expectGeometry(second, { x: 620, y: 360 });
    await panel.getByRole('button', { name: 'Distribute vertically', exact: true }).click();
    await expectGeometry(second, { x: 620, y: 410 });
    await expectGeometry(first, { x: 120, y: 160 });
    await expectGeometry(third, { x: 1120, y: 660 });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(second, { x: 620, y: 360 });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(second, { x: 520, y: 360 });
  });

  test('layer controls change the visible order of overlapping elements and undo restores it', async ({
    page,
    request,
  }) => {
    const { first } = await openBlocks(page, request, 'visual-layers', true);
    await first.click({ position: { x: 10, y: 10 } });
    const panel = page.locator('aside[data-inspector-ui]');
    await panel.getByRole('tab', { name: 'Arrange', exact: true }).click();
    const topmost = async () => {
      const box = await first.boundingBox();
      if (!box) throw new Error('Layer target has no bounding box');
      return page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.textContent, {
        x: box.x + box.width * 0.8,
        y: box.y + box.height * 0.8,
      });
    };
    await expect.poll(topmost).toBe('Second block');
    await panel.getByRole('button', { name: 'Bring to front', exact: true }).click();
    await expect.poll(topmost).toBe('First block');
    await panel.getByRole('button', { name: 'Send to back', exact: true }).click();
    await expect.poll(topmost).toBe('Second block');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(topmost).toBe('First block');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(topmost).toBe('Second block');
  });

  test('the rotation handle turns an element around its center and supports undo', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-rotate');
    const before = await geometry(headline);
    const handle = page.locator('[data-rotate-handle]');
    await expect(handle).toBeVisible();
    await handle.click({ trial: true });
    const elementBox = await headline.boundingBox();
    const handleBox = await handle.boundingBox();
    if (!elementBox || !handleBox) throw new Error('Rotation target has no bounding box');
    const center = {
      x: elementBox.x + elementBox.width / 2,
      y: elementBox.y + elementBox.height / 2,
    };
    const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
    const radius = Math.hypot(start.x - center.x, start.y - center.y);
    const angle = Math.atan2(start.y - center.y, start.x - center.x) + Math.PI / 4;
    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(
      center.x + radius * Math.cos(angle),
      center.y + radius * Math.sin(angle),
      {
        steps: 8,
      },
    );
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page
      .locator('aside[data-inspector-ui]')
      .getByRole('tab', { name: 'Arrange', exact: true })
      .click();
    await expect(
      page.locator('aside[data-inspector-ui]').getByLabel('Rotation', { exact: true }),
    ).toHaveValue('45');
    const rotatedSize = (before.width + before.height) / Math.sqrt(2);
    await expectGeometry(headline, {
      x: before.x + (before.width - rotatedSize) / 2,
      y: before.y + (before.height - rotatedSize) / 2,
      width: rotatedSize,
      height: rotatedSize,
    });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, {
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height,
    });
  });

  test('double-click text editing retains caret navigation without moving the element', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-inline');
    const before = await geometry(headline);
    await headline.dblclick();
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await headline.fill('Text edited on the canvas');
    const edited = editorCanvas(page).getByText('Text edited on the canvas', { exact: true });
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Shift+ArrowRight');
    await expectGeometry(edited, { x: before.x, y: before.y });
    await page.keyboard.press('Escape');
    await expect(edited).not.toHaveAttribute('contenteditable', 'true');
    await expect(page.getByText('1 unsaved change')).toBeVisible();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(headline).toBeVisible();
    await headline.dblclick();
    await headline.fill('Inline text saved in place');
    const savedInline = editorCanvas(page).getByText('Inline text saved in place', { exact: true });
    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.keyboard.press('ControlOrMeta+s');
    expect((await saved).status()).toBe(200);
    await expect
      .poll(() => readSlideSource('visual-inline'))
      .toContain('Inline text saved in place');
    await expect(savedInline).toHaveAttribute('contenteditable', 'true');
    await expect(savedInline).toBeFocused();
  });

  test('keyboard shortcuts undo, redo, and save an element move', async ({ page, request }) => {
    const headline = await openEditable(page, request, 'visual-shortcuts');
    const before = await geometry(headline);
    const source = await readSlideSource('visual-shortcuts');
    await page.keyboard.press('Shift+ArrowRight');
    await expectGeometry(headline, { x: before.x + 10, y: before.y });
    await page.keyboard.press('ControlOrMeta+z');
    await expectGeometry(headline, { x: before.x, y: before.y });
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expectGeometry(headline, { x: before.x + 10, y: before.y });
    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.keyboard.press('ControlOrMeta+s');
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readSlideSource('visual-shortcuts')).not.toBe(source);
    await page.reload();
    await expect(headline).toBeVisible();
    await expectGeometry(headline, { x: before.x + 10, y: before.y });
  });

  test('pointer cancellation restores the preview and allows a new keyboard move', async ({
    page,
    request,
  }) => {
    const headline = await openEditable(page, request, 'visual-pointer-cancel');
    const before = await geometry(headline);
    await startDrag(page, headline, 35, 24);
    await expect
      .poll(async () => Math.abs((await geometry(headline)).x - before.x))
      .toBeGreaterThan(10);
    await headline.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true });
    await page.mouse.up();
    await expectGeometry(headline, { x: before.x, y: before.y });
    await expect(page.getByText('1 unsaved change')).toHaveCount(0);
    await page.keyboard.press('Shift+ArrowRight');
    await expectGeometry(headline, { x: before.x + 10, y: before.y });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(headline, { x: before.x, y: before.y });
  });

  test('dragging inside a transformed parent preserves existing transforms and percentage offsets', async ({
    page,
    request,
  }) => {
    const slideId = 'visual-nested-transform';
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import type { Page, SlideMeta } from '@open-slide/core';
export const meta: SlideMeta = { title: 'Nested transforms', createdAt: '2026-01-01T00:00:00.000Z' };
const Only: Page = () => (
  <div style={{ width: '100%', height: '100%', position: 'relative', background: '#14213d' }}>
    <div data-testid="transformed-parent" style={{ position: 'absolute', left: 500, top: 250, width: 600, height: 400, transform: 'rotate(20deg) scale(0.8)', background: '#264653' }}>
      <div style={{ position: 'absolute', left: 70, top: 90, width: 260, height: 160, translate: '20% 15%', transform: 'rotate(-12deg)', background: '#e9c46a', padding: 20, fontSize: 32 }}>Nested block</div>
    </div>
  </div>
);
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    await expect(editorCanvas(page).getByText('Nested block', { exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const child = editorCanvas(page).getByText('Nested block', { exact: true });
    const parent = editorCanvas(page).getByTestId('transformed-parent');
    await child.click();
    await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
    await child.click({ trial: true });
    const before = await geometry(child);
    const originalTransform = await child.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    const parentTransform = await parent.evaluate((element) => getComputedStyle(element).transform);
    await expect(child).toHaveCSS('translate', '20% 15%');
    await page.keyboard.down('Alt');
    await startDrag(page, child, 37, 23);
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await expectGeometry(child, {
      x: before.x + 37 / before.scale,
      y: before.y + 23 / before.scale,
      width: before.width,
      height: before.height,
    });
    await expect(child).toHaveCSS('transform', originalTransform);
    await expect(parent).toHaveCSS('transform', parentTransform);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectGeometry(child, {
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height,
    });
    await expect(child).toHaveCSS('translate', '20% 15%');
    await expect(child).toHaveCSS('transform', originalTransform);
  });

  test('selection survives a save that changes source lines and a second move saves correctly', async ({
    page,
    request,
  }) => {
    const { first, second } = await openBlocks(page, request, 'visual-save-selection');
    await first.click();
    await page.keyboard.press('Shift+ArrowRight');
    await second.click();
    await page.keyboard.press('Shift+ArrowDown');
    const originalLocation = await second.getAttribute('data-slide-loc');
    if (!originalLocation) throw new Error('Selected block has no source location');
    await expectGeometry(first, { x: 130, y: 160 });
    await expectGeometry(second, { x: 520, y: 370 });

    const saved = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { results: { ok: boolean; error?: string }[] };
    expect(body.results.filter((result) => !result.ok)).toEqual([]);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    await expect
      .poll(async () => {
        const location = await second.getAttribute('data-slide-loc');
        return !!location && location !== originalLocation;
      })
      .toBe(true);
    await page.keyboard.press('Shift+ArrowRight');
    await expectGeometry(second, { x: 530, y: 370 });

    const savedAgain = page.waitForResponse(
      (response) => response.url().includes('/__edit') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const secondResponse = await savedAgain;
    expect(secondResponse.status()).toBe(200);
    const secondBody = (await secondResponse.json()) as {
      results: { ok: boolean; error?: string }[];
    };
    expect(secondBody.results.filter((result) => !result.ok)).toEqual([]);
    await page.reload();
    await expect(first).toBeVisible();
    await expectGeometry(first, { x: 130, y: 160 });
    await expectGeometry(second, { x: 530, y: 370 });
  });
});
