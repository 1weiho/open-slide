import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const originalWindow = (globalThis as { window?: unknown }).window;

beforeAll(() => {
  (globalThis as { window?: unknown }).window = {
    location: { href: 'http://localhost:5173/', origin: 'http://localhost:5173' },
  };
});

afterAll(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
});

const { findHtmlAssetUrls } = await import('./export-html');

describe('findHtmlAssetUrls', () => {
  it('collects src and srcset assets', () => {
    const html = '<img src="/assets/a.png" srcset="/assets/b.png 1x, /assets/c.png 2x">';
    expect(findHtmlAssetUrls(html)).toEqual(
      expect.arrayContaining(['/assets/a.png', '/assets/b.png', '/assets/c.png']),
    );
  });

  it('collects inline background-image with entity-encoded quotes', () => {
    const html = '<div style="background-image:url(&quot;/assets/bg.png&quot;)"></div>';
    expect(findHtmlAssetUrls(html)).toContain('/assets/bg.png');
  });

  it('collects inline background-image with plain quotes and without quotes', () => {
    const html =
      '<div style="background:url(\'/assets/x.jpg\')"></div><div style="background-image:url(/assets/y.webp)"></div>';
    expect(findHtmlAssetUrls(html)).toEqual(
      expect.arrayContaining(['/assets/x.jpg', '/assets/y.webp']),
    );
  });

  it('ignores data URIs and non-asset urls', () => {
    const html =
      '<div style="background-image:url(data:image/png;base64,AAAA)"></div><a href="/page">x</a>';
    expect(findHtmlAssetUrls(html)).toEqual([]);
  });
});
