import { describe, expect, it } from 'vitest';
import { createPptxSlide, isRenderableNode } from './scene';

describe('pptx scene', () => {
  it('creates a slide scene with default dimensions', () => {
    const slide = createPptxSlide();

    expect(slide.width).toBe(1920);
    expect(slide.height).toBe(1080);
    expect(slide.nodes).toEqual([]);
  });

  it('rejects nodes without positive size', () => {
    expect(isRenderableNode({ kind: 'shape', x: 0, y: 0, w: 0, h: 10 })).toBe(false);
  });
});
