import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, getCanvasDims } from './sdk.ts';

describe('canvas constants', () => {
  it('targets a 1920x1080 canvas', () => {
    expect(CANVAS_WIDTH).toBe(1920);
    expect(CANVAS_HEIGHT).toBe(1080);
  });

  it('preserves a 16:9 aspect ratio', () => {
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(16 / 9);
  });
});

describe('getCanvasDims', () => {
  it('returns 16:9 dims by default', () => {
    expect(getCanvasDims(undefined)).toEqual({ width: 1920, height: 1080 });
    expect(getCanvasDims('16:9')).toEqual({ width: 1920, height: 1080 });
  });

  it('returns 4:3 dims when requested', () => {
    const { width, height } = getCanvasDims('4:3');
    expect(width).toBe(1440);
    expect(height).toBe(1080);
    expect(width / height).toBeCloseTo(4 / 3);
  });
});
