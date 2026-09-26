import path from 'node:path';
import { expect, test } from '@playwright/test';
import { coreRoot, openSlide } from './helpers';

const assetsUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/assets.ts')}`;
const gifData = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test.describe('editable PPTX image assets', () => {
  test.beforeEach(async ({ page }) => {
    await openSlide(page, 'alpha');
  });

  test('preserves supported source images and bakes filters into PNG', async ({ page }) => {
    const result = await page.evaluate(
      async ({ assetsUrl, gifData }) => {
        const { normalizeImageAsset } = await import(assetsUrl);
        const source = document.createElement('canvas');
        source.width = 4;
        source.height = 2;
        const context = source.getContext('2d');
        if (!context) throw new Error('fixture canvas unavailable');
        context.fillStyle = '#f00';
        context.fillRect(0, 0, 2, 2);
        context.fillStyle = '#00f';
        context.fillRect(2, 0, 2, 2);
        context.fillStyle = '#0f0';
        context.fillRect(0, 1, 4, 1);
        const png = source.toDataURL('image/png');
        const jpeg = source.toDataURL('image/jpeg', 0.9);
        const webp = source.toDataURL('image/webp');
        const signal = new AbortController().signal;
        const [pngAsset, jpegAsset, gifAsset, webpAsset, filteredAsset] = await Promise.all([
          normalizeImageAsset(png, signal),
          normalizeImageAsset(jpeg, signal),
          normalizeImageAsset(`data:image/gif;base64,${gifData}`, signal),
          normalizeImageAsset(webp, signal),
          normalizeImageAsset(png, signal, { filter: 'grayscale(1)' }),
        ]);
        return {
          png,
          jpeg,
          webp,
          pngAsset,
          jpegAsset,
          gifAsset,
          webpAsset,
          filteredAsset,
        };
      },
      { assetsUrl, gifData },
    );

    expect(result.pngAsset).toMatchObject({
      data: result.png,
      mime: 'image/png',
      assetId: result.png,
      naturalWidth: 4,
      naturalHeight: 2,
    });
    expect(result.jpegAsset).toMatchObject({
      data: result.jpeg,
      mime: 'image/jpeg',
      assetId: result.jpeg,
      naturalWidth: 4,
      naturalHeight: 2,
    });
    expect(result.gifAsset).toMatchObject({
      data: `data:image/gif;base64,${gifData}`,
      mime: 'image/gif',
      naturalWidth: 1,
      naturalHeight: 1,
    });
    expect(result.webp).toMatch(/^data:image\/webp;base64,/);
    expect(result.webpAsset).toMatchObject({
      mime: 'image/png',
      assetId: result.webp,
      naturalWidth: 4,
      naturalHeight: 2,
    });
    expect(result.webpAsset.data).toMatch(/^data:image\/png;base64,/);
    expect(result.filteredAsset).toMatchObject({
      mime: 'image/png',
      assetId: result.png,
      naturalWidth: 4,
      naturalHeight: 2,
    });
    expect(result.filteredAsset.data).toMatch(/^data:image\/png;base64,/);
    expect(result.filteredAsset.data).not.toBe(result.png);
  });

  test('keeps self-contained SVG vectors and creates a supersampled PNG fallback', async ({
    page,
  }) => {
    const result = await page.evaluate(
      async ({ assetsUrl }) => {
        const { normalizeImageAsset } = await import(assetsUrl);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12"><defs><mask id="mask"><rect width="20" height="12" fill="white"/></mask><filter id="soft"><feGaussianBlur stdDeviation="0"/></filter></defs><rect width="20" height="12" fill="#0af" mask="url(#mask)" filter="url(#soft)"/></svg>`;
        const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        const asset = await normalizeImageAsset(url, new AbortController().signal, {
          width: 30,
          height: 18,
        });
        const filteredAsset = await normalizeImageAsset(url, new AbortController().signal, {
          width: 30,
          height: 18,
          filter: 'grayscale(1)',
        });
        const fallback = new Image();
        const fallbackSize = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => {
            fallback.onload = () =>
              resolve({ width: fallback.naturalWidth, height: fallback.naturalHeight });
            fallback.onerror = () => reject(new Error('SVG PNG fallback did not decode'));
            fallback.src = asset.data;
          },
        );
        fallback.src = '';
        const encoded = asset.svgData?.split(',')[1] ?? '';
        const svgData = new TextDecoder().decode(
          Uint8Array.from(atob(encoded), (value) => value.charCodeAt(0)),
        );
        return { asset, filteredAsset, fallbackSize, svgData };
      },
      { assetsUrl },
    );

    expect(result.asset.mime).toBe('image/png');
    expect(result.asset.assetId).toContain('data:image/svg+xml,');
    expect(result.asset.data).toMatch(/^data:image\/png;base64,/);
    expect(result.asset.svgData).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(result.filteredAsset).toMatchObject({
      mime: 'image/png',
      assetId: result.asset.assetId,
      naturalWidth: 20,
      naturalHeight: 12,
    });
    expect(result.filteredAsset.data).toMatch(/^data:image\/png;base64,/);
    expect(result.filteredAsset.svgData).toBeUndefined();
    expect(result.asset.naturalWidth).toBe(20);
    expect(result.asset.naturalHeight).toBe(12);
    expect(result.fallbackSize.width).toBeGreaterThanOrEqual(60);
    expect(result.fallbackSize.height).toBeGreaterThanOrEqual(36);
    expect(result.svgData).toContain('<svg');
    expect(result.svgData).toContain('url(#mask)');
    expect(result.svgData).toContain('url(#soft)');
  });

  test('rejects unsafe or undecodable SVG and stops promptly on cancellation', async ({ page }) => {
    const result = await page.evaluate(
      async ({ assetsUrl }) => {
        const { normalizeImageAsset } = await import(assetsUrl);
        const run = async (url: string) => {
          try {
            await normalizeImageAsset(url, new AbortController().signal);
            return { code: 'resolved', name: 'resolved', message: '' };
          } catch (error) {
            return {
              code: (error as { code?: string }).code ?? '',
              name: (error as { name?: string }).name ?? '',
              message: error instanceof Error ? error.message : String(error),
            };
          }
        };
        const controller = new AbortController();
        controller.abort();
        const [script, external, foreignObject, cssExternal, invalid, cancelled] =
          await Promise.all([
            run(
              'data:image/svg+xml,%3Csvg%20xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E%3C%2Fsvg%3E',
            ),
            run(
              'data:image/svg+xml,%3Csvg%20xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%3E%3Cimage%20href="https%3A%2F%2Fevil.example%2Fimage.png"%20%2F%3E%3C%2Fsvg%3E',
            ),
            run(
              'data:image/svg+xml,%3Csvg%20xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%3E%3CforeignObject%3Etext%3C%2FforeignObject%3E%3C%2Fsvg%3E',
            ),
            run(
              'data:image/svg+xml,%3Csvg%20xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%3E%3Cstyle%3E.x%7Bfill%3Aurl(https%3A%2F%2Fevil.example%2Fpaint.png)%7D%3C%2Fstyle%3E%3Crect%20class="x"%20width="1"%20height="1"%2F%3E%3C%2Fsvg%3E',
            ),
            run('data:image/png;base64,SGVsbG8='),
            (async () => {
              try {
                await normalizeImageAsset('data:image/png;base64,iVBORw0KGgo=', controller.signal);
                return { code: 'resolved', name: 'resolved', message: '' };
              } catch (error) {
                return {
                  code: (error as { code?: string }).code ?? '',
                  name: (error as { name?: string }).name ?? '',
                  message: error instanceof Error ? error.message : String(error),
                };
              }
            })(),
          ]);
        return { script, external, foreignObject, cssExternal, invalid, cancelled };
      },
      { assetsUrl },
    );

    expect(result.script).toMatchObject({ code: 'svg-unsafe', name: 'ImageAssetError' });
    expect(result.script.message).toContain('script');
    expect(result.external).toMatchObject({ code: 'svg-unsafe', name: 'ImageAssetError' });
    expect(result.external.message).toContain('Embed the resource');
    expect(result.foreignObject).toMatchObject({ code: 'svg-unsafe', name: 'ImageAssetError' });
    expect(result.foreignObject.message).toContain('foreignObject');
    expect(result.cssExternal).toMatchObject({ code: 'svg-unsafe', name: 'ImageAssetError' });
    expect(result.cssExternal.message).toContain('evil.example');
    expect(result.invalid).toMatchObject({ code: 'decode-failed', name: 'ImageAssetError' });
    expect(result.cancelled).toMatchObject({ name: 'AbortError' });
  });

  test('does not hang when fetch ignores the timeout abort', async ({ page }) => {
    const result = await page.evaluate(
      async ({ assetsUrl }) => {
        const { normalizeImageAsset } = await import(assetsUrl);
        const originalFetch = window.fetch;
        const originalSetTimeout = window.setTimeout.bind(window);
        window.fetch = (() => new Promise<Response>(() => {})) as typeof window.fetch;
        window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
          originalSetTimeout(
            handler,
            Math.min(timeout ?? 0, 25),
            ...args,
          )) as typeof window.setTimeout;
        try {
          const started = performance.now();
          try {
            await normalizeImageAsset(
              'https://hang.example/image.png',
              new AbortController().signal,
            );
            return { code: 'resolved', elapsedMs: Math.round(performance.now() - started) };
          } catch (error) {
            return {
              code: (error as { code?: string }).code ?? '',
              name: (error as { name?: string }).name ?? '',
              elapsedMs: Math.round(performance.now() - started),
            };
          }
        } finally {
          window.fetch = originalFetch;
          window.setTimeout = originalSetTimeout;
        }
      },
      { assetsUrl },
    );

    expect(result).toMatchObject({ code: 'timeout', name: 'ImageAssetError' });
    expect(result.elapsedMs).toBeLessThan(500);
  });
});
