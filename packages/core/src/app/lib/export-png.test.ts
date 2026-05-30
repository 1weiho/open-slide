/**
 * Unit tests for the PNG exporter's pure helpers, progress reducer, DOM
 * cleanup contract, and full-deck progress emission. The rasteriser is
 * swapped out via the test seam so these tests do not depend on a real
 * `Image` decoder or `canvas.toBlob` implementation.
 *
 * @agents-index Vitest tests for export-png.ts (filename, percent, cleanup, progress).
 */

// @vitest-environment happy-dom

import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __setRasteriserForTesting,
  computePercent,
  exportSlideAsPngZip,
  exportSlidePageAsPng,
  type PngExportProgress,
  pngFilenameFor,
} from './export-png';
import { cloneWithInlinedStyles, nodeToSvgDataUrl } from './export-png.rasterize';
import type { SlideModule } from './sdk';

function blankPage(): () => ReturnType<typeof createElement> {
  return () => createElement('div', { 'data-test-page': '' }, 'page');
}

function makeSlide(pageCount: number): SlideModule {
  const pages = Array.from({ length: pageCount }, () => blankPage());
  return { default: pages } as unknown as SlideModule;
}

afterEach(() => {
  __setRasteriserForTesting(null);
  for (const host of Array.from(document.querySelectorAll('[data-png-export-host]'))) {
    host.remove();
  }
});

describe('pngFilenameFor', () => {
  it('filename for single-page export uses page-count-width zero padding', () => {
    expect(pngFilenameFor('slide', 0, 9)).toBe('slide-p1.png');
    expect(pngFilenameFor('slide', 8, 9)).toBe('slide-p9.png');
    expect(pngFilenameFor('slide', 0, 100)).toBe('slide-p001.png');
    expect(pngFilenameFor('slide', 99, 100)).toBe('slide-p100.png');
    expect(pngFilenameFor('slide', 0, 10)).toBe('slide-p01.png');
  });
});

describe('computePercent', () => {
  it('progress emitter produces monotonically non-decreasing percent', () => {
    const total = 3;
    const sequence: Array<{ phase: PngExportProgress['phase']; current: number }> = [
      { phase: 'processing', current: 0 },
      { phase: 'processing', current: 1 },
      { phase: 'rasterising', current: 1 },
      { phase: 'processing', current: 2 },
      { phase: 'rasterising', current: 2 },
      { phase: 'processing', current: 3 },
      { phase: 'rasterising', current: 3 },
      { phase: 'zipping', current: 3 },
      { phase: 'done', current: 3 },
    ];
    let prev = -1;
    for (const { phase, current } of sequence) {
      const pct = computePercent(phase, current, total);
      expect(pct).toBeGreaterThanOrEqual(prev);
      prev = pct;
    }
    expect(computePercent('done', total, total)).toBe(100);
  });
});

describe('exportSlidePageAsPng cleanup', () => {
  it('exportSlidePageAsPng rejects with no DOM residue when the rasterizer throws', async () => {
    __setRasteriserForTesting(() => Promise.reject(new Error('rasteriser boom')));
    const slide = makeSlide(1);
    await expect(exportSlidePageAsPng(slide, 'slide', 0)).rejects.toThrow(/boom/);
    expect(document.querySelectorAll('[data-png-export-host]').length).toBe(0);
  });
});

describe('cloneWithInlinedStyles', () => {
  it('neutralises the offscreen host positioning so the clone is not pushed out of the foreignObject viewport', () => {
    const host = document.createElement('div');
    Object.assign(host.style, { position: 'fixed', left: '-99999px', top: '0' });
    host.appendChild(document.createElement('span'));
    document.body.appendChild(host);
    try {
      const clone = cloneWithInlinedStyles(host);
      expect(clone.style.position).toBe('static');
      expect(clone.style.left).toBe('0px');
      expect(clone.style.transform).toBe('none');
      expect(clone.style.left).not.toContain('99999');
    } finally {
      host.remove();
    }
  });
});

describe('nodeToSvgDataUrl', () => {
  it('renders at 2x density with a 1x viewBox so the canvas can draw down to the exact output size', () => {
    const node = document.createElement('div');
    const url = nodeToSvgDataUrl(node, 1920, 1080);
    const svg = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
    expect(svg).toContain('width="3840"');
    expect(svg).toContain('height="2160"');
    expect(svg).toContain('viewBox="0 0 1920 1080"');
    expect(svg).toContain('<foreignObject');
  });
});

describe('exportSlideAsPngZip progress', () => {
  it('exportSlideAsPngZip calls onProgress at least once per phase', async () => {
    __setRasteriserForTesting(
      async () => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' }),
    );
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    try {
      const slide = makeSlide(2);
      const phases: PngExportProgress['phase'][] = [];
      await exportSlideAsPngZip(slide, 'deck', (p) => {
        phases.push(p.phase);
      });
      for (const expected of ['processing', 'rasterising', 'zipping', 'done'] as const) {
        expect(phases).toContain(expected);
      }
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
