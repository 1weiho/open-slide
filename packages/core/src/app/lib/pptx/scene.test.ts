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

  it('allows horizontal and vertical line nodes with zero thickness', () => {
    expect(isRenderableNode({ kind: 'shape', shape: 'line', x: 0, y: 0, w: 100, h: 0 })).toBe(true);
    expect(isRenderableNode({ kind: 'shape', shape: 'line', x: 0, y: 0, w: 0, h: 100 })).toBe(true);
  });

  it('keeps export decision metadata separate from renderability', () => {
    const node = {
      decision: { kind: 'native' as const },
      kind: 'shape',
      shape: 'rect',
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    };

    expect(isRenderableNode(node)).toBe(true);
  });
});
