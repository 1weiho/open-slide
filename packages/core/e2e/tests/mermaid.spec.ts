import { expect, test } from '@playwright/test';
import { editorCanvas, enterPlayMode, openSlide } from './helpers.ts';

test.describe('Mermaid primitive', () => {
  test('renders, rerenders, falls back, and captures after async SVG readiness', async ({
    page,
  }) => {
    await openSlide(page, 'steps', '?p=4');
    const canvas = editorCanvas(page);
    const wrappers = canvas.locator('[data-waitfor="svg"]');

    await expect(wrappers).toHaveCount(3);
    await expect(canvas.locator('svg[data-mermaid-svg]')).toHaveCount(2);
    await expect(canvas.getByTestId('custom-mermaid-fallback')).toHaveText('Diagram unavailable');

    const svgDetails = await canvas.locator('svg[data-mermaid-svg]').evaluateAll((elements) =>
      elements.map((element) => ({
        id: element.id,
        width: element.getAttribute('width'),
        height: element.getAttribute('height'),
        viewBox: element.getAttribute('viewBox'),
      })),
    );
    expect(new Set(svgDetails.map(({ id }) => id)).size).toBe(svgDetails.length);
    expect(svgDetails.every(({ width, height }) => width === '100%' && height === '100%')).toBe(
      true,
    );
    expect(svgDetails.every(({ viewBox }) => Boolean(viewBox))).toBe(true);

    await expect(canvas.getByText('Initial source')).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('open-slide-mermaid-update')));
    await expect(canvas.getByText('Updated source')).toBeVisible();
    await expect(canvas.getByText('Initial source')).toHaveCount(0);

    await expect(wrappers.locator('svg')).toHaveCount(3);
    const capture = await canvas.screenshot();
    expect(capture.byteLength).toBeGreaterThan(0);

    await enterPlayMode(page);
    await expect(page.locator('svg[data-mermaid-svg]')).toHaveCount(2);
    await expect(page.getByTestId('custom-mermaid-fallback')).toBeVisible();
  });
});
