import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { deleteSlide, duplicateSlide, editorCanvas, openSlide } from './helpers.ts';

type SidebarFrame = { width: number; canvasWidth: number; panels: number };
type MotionWindow = Window & {
  sidebarMotionFrames?: SidebarFrame[];
  sidebarMotionFrameId?: number;
};

async function captureSidebarFrames(page: Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const motionWindow = window as MotionWindow;
    motionWindow.sidebarMotionFrames = [];
    const sample = () => {
      motionWindow.sidebarMotionFrames?.push({
        width: document.querySelector('[data-editor-sidebar]')?.getBoundingClientRect().width ?? 0,
        canvasWidth:
          document.querySelector('main[data-inspector-root]')?.getBoundingClientRect().width ?? 0,
        panels: document.querySelectorAll('aside[data-inspector-ui], aside[data-design-ui]').length,
      });
      motionWindow.sidebarMotionFrameId = requestAnimationFrame(sample);
    };
    sample();
  });
  await action();
  return page.evaluate(async () => {
    const sidebar = document.querySelector('[data-editor-sidebar]');
    await Promise.all(sidebar?.getAnimations().map((animation) => animation.finished) ?? []);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const motionWindow = window as MotionWindow;
    if (motionWindow.sidebarMotionFrameId != null) {
      cancelAnimationFrame(motionWindow.sidebarMotionFrameId);
    }
    const frames = motionWindow.sidebarMotionFrames ?? [];
    delete motionWindow.sidebarMotionFrames;
    delete motionWindow.sidebarMotionFrameId;
    return frames;
  });
}

test.describe('editor sidebar motion', () => {
  let slideId: string;

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test.afterEach(async ({ page, request }) => {
    await page.close();
    if (slideId) await deleteSlide(request, slideId);
  });

  async function openEditor(page: Page, request: APIRequestContext, id: string) {
    slideId = id;
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    await expect(page.locator('[data-editor-sidebar]')).toHaveCSS('width', '320px');
  }

  test('Format slides open and closed through intermediate widths', async ({ page, request }) => {
    await openEditor(page, request, 'motion-format');
    const sidebar = page.locator('[data-editor-sidebar]');
    const closing = await captureSidebarFrames(page, async () => {
      await page.getByRole('button', { name: 'Close Format panel', exact: true }).click();
      await expect(sidebar).toHaveCount(0);
    });
    expect(closing.some(({ width }) => width > 1 && width < 319)).toBe(true);
    expect(closing.at(-1)?.width).toBe(0);

    const opening = await captureSidebarFrames(page, async () => {
      await page.getByTitle('Format', { exact: true }).click();
      await expect(sidebar).toHaveCSS('width', '320px');
    });
    expect(opening.some(({ width }) => width > 1 && width < 319)).toBe(true);
    expect(opening.at(-1)?.width).toBe(320);
  });

  test('reopening Format during its closing transition keeps the sidebar mounted', async ({
    page,
    request,
  }) => {
    await openEditor(page, request, 'motion-reverse');
    const frames = await captureSidebarFrames(page, async () => {
      const reversed = page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const deadline = performance.now() + 5_000;
            const reopenDuringClose = () => {
              const sidebar = document.querySelector('[data-editor-sidebar]');
              const width = sidebar?.getBoundingClientRect().width ?? 0;
              if (width > 1 && width < 319) {
                const format = document.querySelector<HTMLButtonElement>('button[title="Format"]');
                if (!format) return reject(new Error('Format toggle is missing'));
                format.click();
                resolve(width);
                return;
              }
              if (performance.now() > deadline) {
                reject(new Error('The sidebar never entered its closing transition'));
                return;
              }
              requestAnimationFrame(reopenDuringClose);
            };
            reopenDuringClose();
          }),
      );
      await page.getByRole('button', { name: 'Close Format panel', exact: true }).click();
      expect(await reversed).toBeGreaterThan(0);
      await expect(page.locator('[data-editor-sidebar]')).toHaveCSS('width', '320px');
      await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
    });
    expect(frames.some(({ width }) => width > 1 && width < 319)).toBe(true);
    expect(frames.every(({ width, panels }) => width > 0 && panels === 1)).toBe(true);
  });

  test('Format and Design switch within one stationary sidebar', async ({ page, request }) => {
    await openEditor(page, request, 'motion-sidebar-switch');
    const design = page.locator('aside[data-design-ui]');
    const format = page.locator('aside[data-inspector-ui]');
    const arrange = format.getByRole('tab', { name: 'Arrange', exact: true });
    await editorCanvas(page).getByText('Editable headline', { exact: true }).click();
    await arrange.click();
    await expect(arrange).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Close Format panel', exact: true }).click();
    await expect(page.locator('[data-editor-sidebar]')).toHaveCount(0);
    await page.getByTitle('Format', { exact: true }).click();
    await expect(arrange).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-editor-sidebar]')).toHaveCSS('width', '320px');
    await page.getByTitle('Design tokens', { exact: true }).click();
    await expect(design).toBeVisible();
    await page.getByTitle('Format', { exact: true }).click();
    await expect(format).toBeVisible();
    await expect(arrange).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-editor-sidebar]')).toHaveCSS('width', '320px');
    const canvasWidth = await editorCanvas(page).evaluate(
      (element) => element.getBoundingClientRect().width,
    );

    for (const mode of ['Design tokens', 'Format']) {
      const frames = await captureSidebarFrames(page, async () => {
        await page.getByTitle(mode, { exact: true }).click();
        await expect(mode === 'Format' ? format : design).toBeVisible();
        await expect(mode === 'Format' ? design : format).toHaveCount(0);
      });
      expect(frames.every(({ panels }) => panels === 1)).toBe(true);
      expect(frames.every(({ width }) => Math.abs(width - 320) < 0.5)).toBe(true);
      expect(
        frames.every(({ canvasWidth: currentWidth }) => Math.abs(currentWidth - canvasWidth) < 0.5),
      ).toBe(true);
    }
    await expect(arrange).toHaveAttribute('aria-selected', 'true');
  });

  test('reduced motion changes sidebar width without sliding', async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openEditor(page, request, 'motion-reduced');
    const sidebar = page.locator('[data-editor-sidebar]');
    const frames = await captureSidebarFrames(page, async () => {
      await page.getByRole('button', { name: 'Close Format panel', exact: true }).click();
      await expect(sidebar).toHaveCount(0);
      await page.getByTitle('Format', { exact: true }).click();
      await expect(sidebar).toHaveCSS('width', '320px');
    });
    expect(frames.some(({ width }) => width === 0)).toBe(true);
    expect(frames.some(({ width }) => width === 320)).toBe(true);
    expect(frames.every(({ width }) => width < 0.5 || Math.abs(width - 320) < 0.5)).toBe(true);
  });
});
