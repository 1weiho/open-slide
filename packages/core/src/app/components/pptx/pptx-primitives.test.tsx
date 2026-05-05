import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PptxBox, PptxGroup, PptxImage, PptxShape, PptxText } from './index.tsx';

describe('pptx primitives', () => {
  it('renders text as normal HTML with pptx metadata', () => {
    const html = renderToStaticMarkup(<PptxText style={{ fontSize: 40 }}>Hello</PptxText>);

    expect(html).toContain('Hello');
    expect(html).toContain('data-osd-pptx-kind="text"');
    expect(html).toContain('font-size:40px');
  });

  it('renders boxes, groups, images, and shapes with pptx metadata', () => {
    const html = renderToStaticMarkup(
      <PptxGroup className="stack">
        <PptxBox id="panel" />
        <PptxImage src="/photo.png" alt="Photo" />
        <PptxShape shape="ellipse" />
      </PptxGroup>,
    );

    expect(html).toContain('class="stack"');
    expect(html).toContain('data-osd-pptx-kind="group"');
    expect(html).toContain('data-osd-pptx-kind="box"');
    expect(html).toContain('data-osd-pptx-kind="image"');
    expect(html).toContain('data-osd-pptx-kind="shape"');
    expect(html).toContain('data-osd-pptx-shape="ellipse"');
  });
});
