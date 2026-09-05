import { describe, expect, it, vi } from 'vitest';

vi.mock('virtual:open-slide/config', () => ({
  default: { canvas: { width: 1920, height: 1080 } },
}));

import { buildHtml } from './export-html.ts';
import { getPrintStyles } from './export-pdf.ts';
import { getPptxSlideSize } from './export-pptx.ts';

describe('canvas-aware exports', () => {
  it('uses explicit dimensions in standalone HTML', () => {
    const html = buildHtml({
      title: 'Portrait',
      pagesHtml: ['<div>page</div>'],
      bundledCss: '',
      externalLinks: '',
      design: undefined,
      canvas: { width: 1080, height: 1350 },
    });

    expect(html).toContain('.os-frame { width: 1080px; height: 1350px;');
  });

  it('keeps legacy PDF supersampling for the default canvas', () => {
    const css = getPrintStyles({ width: 1920, height: 1080 });

    expect(css).toContain('@page { size: 1920px 1080px; margin: 0; }');
    expect(css).toContain('zoom: 2;');
    expect(css).toContain('transform: scale(0.5);');
  });

  it('prints configured canvases at native density', () => {
    const css = getPrintStyles({ width: 3840, height: 2160 });

    expect(css).toContain('@page { size: 3840px 2160px; margin: 0; }');
    expect(css).toContain('zoom: 1;');
    expect(css).toContain('transform: scale(1);');
  });

  it('maps arbitrary canvas dimensions into PPTX slide units', () => {
    expect(getPptxSlideSize({ width: 1080, height: 1350 })).toEqual({
      width: 6_858_000,
      height: 8_572_500,
    });
    expect(getPptxSlideSize({ width: 7680, height: 4320 })).toEqual({
      width: 48_768_000,
      height: 27_432_000,
    });
  });

  it('keeps maximum canvases within PowerPoint slide limits', () => {
    const size = getPptxSlideSize({ width: 8192, height: 4320 });

    expect(size.width).toBeLessThanOrEqual(51_206_400);
    expect(size.height).toBeLessThanOrEqual(51_206_400);
    expect(size.width / size.height).toBeCloseTo(8192 / 4320, 6);
  });
});
