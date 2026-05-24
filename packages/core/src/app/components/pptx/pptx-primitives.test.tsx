import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  PptxBox,
  PptxChart,
  PptxEquation,
  PptxGroup,
  PptxImage,
  PptxRasterLayer,
  PptxShape,
  PptxTable,
  PptxText,
} from './index.tsx';

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

  it('renders raster layers as normal images with export metadata', () => {
    const html = renderToStaticMarkup(
      <PptxRasterLayer
        alt="Texture"
        dataUrl="data:image/png;base64,abc"
        reason="unsupported filter"
      />,
    );

    expect(html).toContain('alt="Texture"');
    expect(html).toContain('src="data:image/png;base64,abc"');
    expect(html).toContain('data-osd-pptx-kind="raster"');
    expect(html).toContain('data-osd-pptx-reason="unsupported filter"');
  });

  it('renders equation metadata with editable fallback text', () => {
    const html = renderToStaticMarkup(
      <PptxEquation latex="E = mc^2" fallbackText="E = m c^2" inline />,
    );

    expect(html).toContain('E = m c^2');
    expect(html).toContain('data-osd-pptx-kind="equation"');
    expect(html).toContain('data-osd-pptx-latex="E = mc^2"');
    expect(html).toContain('data-osd-pptx-inline="true"');
  });

  it('renders table metadata and normal table markup', () => {
    const html = renderToStaticMarkup(
      <PptxTable columns={['Metric', 'Value']} rows={[['Text', 'Editable']]} />,
    );

    expect(html).toContain('<table');
    expect(html).toContain('data-osd-pptx-kind="table"');
    expect(html).toContain('Metric');
    expect(html).toContain('Editable');
  });

  it('renders chart metadata while preserving browser children', () => {
    const html = renderToStaticMarkup(
      <PptxChart
        chartType="bar"
        labels={['Text', 'Images']}
        series={[{ color: '3F7D58', name: 'Score', values: [92, 76] }]}
        title="Editability score"
      >
        <span>Browser chart</span>
      </PptxChart>,
    );

    expect(html).toContain('Browser chart');
    expect(html).toContain('data-osd-pptx-kind="chart"');
    expect(html).toContain('&quot;chartType&quot;:&quot;bar&quot;');
    expect(html).toContain('Editability score');
  });
});
