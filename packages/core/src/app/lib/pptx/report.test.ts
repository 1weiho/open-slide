import { describe, expect, it, vi } from 'vitest';
import type { PptxSlideScene } from './scene';
import { createPptxExportReport, logPptxExportReport, summarizePptxScene } from './report';

const scene: PptxSlideScene = {
  width: 1920,
  height: 1080,
  diagnostics: [{ level: 'warn', message: 'unsupported filter' }],
  nodes: [
    { kind: 'text', text: 'Title', style: {}, x: 0, y: 0, w: 100, h: 40 },
    {
      decision: { kind: 'native-reduced', reason: 'font fallback' },
      kind: 'shape',
      shape: 'rect',
      x: 0,
      y: 50,
      w: 100,
      h: 40,
    },
    {
      dataUrl: 'data:image/png;base64,abc',
      decision: { kind: 'raster', reason: 'blend mode' },
      kind: 'raster',
      reason: 'blend mode',
      x: 0,
      y: 100,
      w: 100,
      h: 40,
    },
    {
      decision: { kind: 'omitted', reason: 'unsupported video' },
      kind: 'image',
      src: '/video-poster.png',
      x: 0,
      y: 150,
      w: 100,
      h: 40,
    },
  ],
};

describe('pptx export report', () => {
  it('summarizes native, reduced, raster, omitted, and warning counts', () => {
    expect(summarizePptxScene(0, scene)).toEqual({
      slideIndex: 0,
      nativeCount: 1,
      nativeReducedCount: 1,
      rasterCount: 1,
      omittedCount: 1,
      warnings: ['unsupported filter', 'font fallback', 'blend mode', 'unsupported video'],
    });
  });

  it('creates reports for multiple slides', () => {
    expect(createPptxExportReport([scene, { ...scene, nodes: [] }]).slides).toHaveLength(2);
  });

  it('logs a compact developer-facing report', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    logPptxExportReport(createPptxExportReport([scene]));

    expect(info).toHaveBeenCalledWith(
      '[open-slide:pptx] slide 1: 1 native 1 reduced 1 raster 1 omitted',
    );
    expect(warn).toHaveBeenCalledWith('[open-slide:pptx] slide 1: unsupported filter');
    expect(warn).toHaveBeenCalledWith('[open-slide:pptx] slide 1: font fallback');
  });
});
