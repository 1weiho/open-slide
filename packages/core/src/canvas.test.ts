import { describe, expect, it } from 'vitest';
import {
  CANVAS_PRESETS,
  DEFAULT_CANVAS_SIZE,
  getPptxCapturePixelRatio,
  getPrintSupersample,
  MAX_CANVAS_AREA,
  MAX_CANVAS_DIMENSION,
  resolveCanvasSize,
} from './canvas.ts';

describe('canvas presets', () => {
  it.each([
    ['1080p', 1920, 1080],
    ['4k', 3840, 2160],
    ['8k', 7680, 4320],
  ] as const)('%s maps to explicit dimensions', (preset, width, height) => {
    expect(CANVAS_PRESETS[preset]).toEqual({ width, height });
  });

  it('defaults to 1920x1080', () => {
    expect(DEFAULT_CANVAS_SIZE).toEqual({ width: 1920, height: 1080 });
    expect(resolveCanvasSize()).toEqual(DEFAULT_CANVAS_SIZE);
  });
});

describe('resolveCanvasSize', () => {
  it('passes explicit portrait dimensions through', () => {
    expect(resolveCanvasSize({ width: 1080, height: 1350 })).toEqual({
      width: 1080,
      height: 1350,
    });
  });

  it('returns fresh objects for presets and explicit dimensions', () => {
    const preset = resolveCanvasSize('4k');
    const explicit = { width: 1080, height: 1350 };

    expect(preset).not.toBe(CANVAS_PRESETS['4k']);
    expect(resolveCanvasSize(explicit)).not.toBe(explicit);
  });

  it('rejects inherited property names and unknown presets', () => {
    for (const value of ['constructor', 'toString', 'hasOwnProperty', '__proto__', '720p']) {
      expect(() => resolveCanvasSize(value)).toThrow(/Invalid open-slide canvas preset/);
    }
  });

  it('rejects malformed dimensions', () => {
    for (const value of [
      { width: 0, height: 1080 },
      { width: -1, height: 1080 },
      { width: 1920.5, height: 1080 },
      { width: 1920, height: Number.NaN },
      null,
      1920,
    ]) {
      expect(() => resolveCanvasSize(value)).toThrow(/Invalid open-slide canvas/);
    }
  });

  it('accepts the maximum dimension and area', () => {
    expect(resolveCanvasSize({ width: MAX_CANVAS_DIMENSION, height: 4320 })).toEqual({
      width: 8192,
      height: 4320,
    });
    expect(MAX_CANVAS_AREA).toBe(8192 * 4320);
  });

  it('rejects dimensions above the per-axis limit', () => {
    expect(() => resolveCanvasSize({ width: MAX_CANVAS_DIMENSION + 1, height: 1080 })).toThrow(
      /at most 8192 pixels/,
    );
  });

  it('rejects dimensions above the total-area limit', () => {
    expect(() => resolveCanvasSize({ width: 8192, height: 4321 })).toThrow(
      /at most 35389440 pixels/,
    );
  });
});

describe('export sampling', () => {
  it('preserves legacy 2x sampling only for the default canvas', () => {
    expect(getPptxCapturePixelRatio({ width: 1920, height: 1080 })).toBe(2);
    expect(getPptxCapturePixelRatio({ width: 1080, height: 1350 })).toBe(1);
    expect(getPptxCapturePixelRatio({ width: 3840, height: 2160 })).toBe(1);
    expect(getPptxCapturePixelRatio({ width: 7680, height: 4320 })).toBe(1);

    expect(getPrintSupersample({ width: 1920, height: 1080 })).toEqual({
      zoom: 2,
      inverseScale: 0.5,
    });
    expect(getPrintSupersample({ width: 3840, height: 2160 })).toEqual({
      zoom: 1,
      inverseScale: 1,
    });
  });
});
