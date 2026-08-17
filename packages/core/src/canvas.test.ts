import { describe, expect, it } from 'vitest';
import { CANVAS_PRESETS, DEFAULT_CANVAS_SIZE, resolveCanvasSize } from './canvas.ts';

describe('canvas presets', () => {
  it('defaults to a 1920x1080 16:9 canvas', () => {
    expect(DEFAULT_CANVAS_SIZE).toEqual({ width: 1920, height: 1080 });
    expect(DEFAULT_CANVAS_SIZE.width / DEFAULT_CANVAS_SIZE.height).toBeCloseTo(16 / 9);
  });

  it('matches every preset to its name', () => {
    const ratios: Record<keyof typeof CANVAS_PRESETS, number> = {
      '16:9': 16 / 9,
      '4:3': 4 / 3,
      '4:5': 4 / 5,
      '1:1': 1,
      '9:16': 9 / 16,
    };
    for (const [name, size] of Object.entries(CANVAS_PRESETS)) {
      expect(size.width / size.height).toBeCloseTo(ratios[name as keyof typeof ratios]);
    }
  });

  it('keeps landscape presets at a 1080px height so type scale carries over', () => {
    expect(CANVAS_PRESETS['16:9'].height).toBe(1080);
    expect(CANVAS_PRESETS['4:3'].height).toBe(1080);
  });
});

describe('resolveCanvasSize', () => {
  it('falls back to the default when unset', () => {
    expect(resolveCanvasSize()).toEqual({ width: 1920, height: 1080 });
  });

  it('expands a preset name', () => {
    expect(resolveCanvasSize('4:5')).toEqual({ width: 1080, height: 1350 });
    expect(resolveCanvasSize('9:16')).toEqual({ width: 1080, height: 1920 });
  });

  it('passes explicit dimensions through', () => {
    expect(resolveCanvasSize({ width: 1240, height: 1754 })).toEqual({
      width: 1240,
      height: 1754,
    });
  });

  it('returns a fresh object so callers cannot mutate the preset table', () => {
    const size = resolveCanvasSize('16:9');
    size.width = 1;
    expect(CANVAS_PRESETS['16:9'].width).toBe(1920);
  });

  it('rejects names inherited from Object.prototype', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      // @ts-expect-error — exercising the runtime guard for untyped config files
      expect(() => resolveCanvasSize(name)).toThrow(/Invalid "canvas" preset/);
    }
  });

  it('rejects an unknown preset name', () => {
    // @ts-expect-error — exercising the runtime guard for untyped config files
    expect(() => resolveCanvasSize('21:9')).toThrow(/Invalid "canvas" preset/);
  });

  it('rejects non-integer, zero, and negative dimensions', () => {
    expect(() => resolveCanvasSize({ width: 1080, height: 1350.5 })).toThrow(
      /Invalid "canvas" dimensions/,
    );
    expect(() => resolveCanvasSize({ width: 0, height: 1080 })).toThrow(
      /Invalid "canvas" dimensions/,
    );
    expect(() => resolveCanvasSize({ width: -1920, height: 1080 })).toThrow(
      /Invalid "canvas" dimensions/,
    );
  });

  it('rejects a value that is neither a preset nor a size', () => {
    // @ts-expect-error — exercising the runtime guard for untyped config files
    expect(() => resolveCanvasSize(1920)).toThrow(/Invalid "canvas" value/);
    // @ts-expect-error — exercising the runtime guard for untyped config files
    expect(() => resolveCanvasSize(null)).toThrow(/Invalid "canvas" value/);
  });
});
