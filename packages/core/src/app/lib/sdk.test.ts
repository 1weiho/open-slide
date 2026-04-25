import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './sdk.ts';

describe('canvas constants', () => {
  it('targets a 1920x1080 canvas', () => {
    expect(CANVAS_WIDTH).toBe(1920);
    expect(CANVAS_HEIGHT).toBe(1080);
  });

  it('preserves a 16:9 aspect ratio', () => {
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(16 / 9);
  });
});
