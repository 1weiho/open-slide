import { describe, expect, it, vi } from 'vitest';

vi.mock('virtual:open-slide/config', () => ({
  default: { canvas: { width: 3840, height: 2160 } },
}));

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvas.ts';

describe('configured canvas constants', () => {
  it('uses the resolved workspace dimensions', () => {
    expect(CANVAS_WIDTH).toBe(3840);
    expect(CANVAS_HEIGHT).toBe(2160);
  });
});
