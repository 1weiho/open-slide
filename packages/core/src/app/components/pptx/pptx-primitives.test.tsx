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

  it('renders equation metadata with Temml MathML preview', () => {
    const html = renderToStaticMarkup(
      <PptxEquation latex="E = mc^2" fallbackText="E = m c^2" inline />,
    );

    expect(html).toContain('E = m');
    expect(html).toContain('<math');
    expect(html).toContain('<msup>');
    expect(html).toContain('data-osd-pptx-kind="equation"');
    expect(html).toContain('data-osd-pptx-latex="E = mc^2"');
    expect(html).toContain('data-osd-pptx-inline="true"');
    expect(html).toContain('data-osd-pptx-fallback="E = m c^2"');
    expect(html).toContain('aria-label="E = m c^2"');
  });

  it('renders browser previews for common LaTeX equations', () => {
    const displayHtml = renderToStaticMarkup(
      <PptxEquation
        latex="\\int_0^1 x^2 dx = \\frac{1}{3}"
        fallbackText="integral from 0 to 1 of x squared d x equals one third"
      />,
    );
    const inlineHtml = renderToStaticMarkup(
      <PptxEquation latex="\\beta = \\alpha + 1" fallbackText="beta = alpha + 1" inline />,
    );

    expect(displayHtml).toContain('<math');
    expect(displayHtml).toContain('<msubsup>');
    expect(displayHtml).toContain('<mfrac>');
    expect(inlineHtml).toContain(`<mi>${String.fromCharCode(0x03b2)}</mi>`);
    expect(inlineHtml).toContain(`<mi>${String.fromCharCode(0x03b1)}</mi>`);
  });

  it('renders browser previews for matrix and binomial LaTeX', () => {
    const matrixHtml = renderToStaticMarkup(
      <PptxEquation latex="A=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}" />,
    );
    const binomialHtml = renderToStaticMarkup(
      <PptxEquation latex="\\sum_{k=0}^{n} \\binom{n}{k}x^k y^{n-k} = (x+y)^n" />,
    );

    expect(matrixHtml).toContain('<mtable>');
    expect(matrixHtml).not.toContain('ParseError');
    expect(binomialHtml).toContain('<munderover>');
    expect(binomialHtml).toContain('<mfrac');
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
