import { describe, expect, it } from 'vitest';
import { classifyNode, type NodeStyleView, type NodeView } from './classify';

function view(
  partial: Partial<Omit<NodeView, 'style'>> & { tag: string; style?: Partial<NodeStyleView> },
): NodeView {
  return {
    isSvg: false,
    hasTextContent: false,
    childElementTags: [],
    ...partial,
    style: {
      display: 'block',
      visibility: 'visible',
      filter: 'none',
      backdropFilter: 'none',
      mixBlendMode: 'normal',
      clipPath: 'none',
      transform: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      backgroundImage: 'none',
      borderStyle: 'none',
      borderTopWidth: '0px',
      ...partial.style,
    },
  };
}

describe('classifyNode', () => {
  it('classifies a heading with inline children as a single text box (no recurse)', () => {
    const c = classifyNode(
      view({ tag: 'h2', hasTextContent: true, childElementTags: ['em', 'br'] }),
    );
    expect(c).toEqual({ kind: 'text', recurse: false });
  });

  it('classifies a plain paragraph as text', () => {
    expect(classifyNode(view({ tag: 'p', hasTextContent: true })).kind).toBe('text');
  });

  it('classifies a layout wrapper with block children as a container (recurse, emit nothing)', () => {
    const c = classifyNode(view({ tag: 'div', childElementTags: ['div', 'div'] }));
    expect(c).toEqual({ kind: 'container', recurse: true });
  });

  it('emits a backing shape but still recurses when a box has a visible solid background', () => {
    const c = classifyNode(
      view({
        tag: 'div',
        childElementTags: ['h2', 'p'],
        style: { backgroundColor: 'rgb(20, 20, 20)' },
      }),
    );
    expect(c).toEqual({ kind: 'shape', recurse: true });
  });

  it('emits a backing shape for a visible border with no background', () => {
    const c = classifyNode(
      view({
        tag: 'div',
        childElementTags: ['p'],
        style: { borderStyle: 'solid', borderTopWidth: '2px' },
      }),
    );
    expect(c.kind).toBe('shape');
    expect(c.recurse).toBe(true);
  });

  it('treats a fully transparent background as no paint (container)', () => {
    const c = classifyNode(
      view({ tag: 'div', childElementTags: ['div'], style: { backgroundColor: 'rgba(0,0,0,0)' } }),
    );
    expect(c.kind).toBe('container');
  });

  it('classifies an <img> as an image leaf', () => {
    expect(classifyNode(view({ tag: 'img' }))).toEqual({ kind: 'image', recurse: false });
  });

  it('classifies a <table> as a table leaf', () => {
    expect(classifyNode(view({ tag: 'table', hasTextContent: true }))).toEqual({
      kind: 'table',
      recurse: false,
    });
  });

  it('rasterizes any SVG subtree', () => {
    expect(classifyNode(view({ tag: 'svg' })).kind).toBe('raster');
  });

  it('keeps a text element editable when it has a filter (drops the effect, no raster)', () => {
    expect(
      classifyNode(
        view({ tag: 'h2', hasTextContent: true, style: { filter: 'drop-shadow(0 2px 4px #000)' } }),
      ).kind,
    ).toBe('text');
  });

  it('recurses (does not rasterize) a container with text descendants and a blend mode', () => {
    expect(
      classifyNode(
        view({
          tag: 'div',
          hasTextContent: true,
          childElementTags: ['h2', 'p'],
          style: { mixBlendMode: 'multiply' },
        }),
      ).kind,
    ).toBe('container');
  });

  it('rasterizes a text-free decorative element with a filter', () => {
    expect(
      classifyNode(view({ tag: 'div', hasTextContent: false, style: { filter: 'blur(40px)' } }))
        .kind,
    ).toBe('raster');
  });

  it('rasterizes a text-free decorative element with a non-normal blend mode', () => {
    expect(
      classifyNode(view({ tag: 'div', hasTextContent: false, style: { mixBlendMode: 'multiply' } }))
        .kind,
    ).toBe('raster');
  });

  it('rasterizes a text-free element clipped by clip-path', () => {
    expect(
      classifyNode(view({ tag: 'div', hasTextContent: false, style: { clipPath: 'inset(10px)' } }))
        .kind,
    ).toBe('raster');
  });

  it('rasterizes a skewed subtree but not a rotated one', () => {
    expect(
      classifyNode(
        view({ tag: 'div', hasTextContent: true, style: { transform: 'matrix(1,0,0.36,1,0,0)' } }),
      ).kind,
    ).toBe('raster');
    expect(
      classifyNode(
        view({ tag: 'p', hasTextContent: true, style: { transform: 'matrix(0,1,-1,0,0,0)' } }),
      ).kind,
    ).toBe('text');
  });

  it('skips display:none and hidden elements', () => {
    expect(classifyNode(view({ tag: 'div', style: { display: 'none' } })).kind).toBe('skip');
    expect(classifyNode(view({ tag: 'div', style: { visibility: 'hidden' } })).kind).toBe('skip');
  });

  it('skips non-visual tags', () => {
    expect(classifyNode(view({ tag: 'script' })).kind).toBe('skip');
    expect(classifyNode(view({ tag: 'style' })).kind).toBe('skip');
  });
});
