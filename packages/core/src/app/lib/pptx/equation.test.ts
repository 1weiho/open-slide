import { describe, expect, it } from 'vitest';
import { createOmmlEquation, ensureMathNamespace } from './equation';
import type { PptxSlideScene } from './scene';
import { readPptxXml } from './test-utils';
import { writePptxFile } from './write-pptx';

describe('pptx equations', () => {
  it('creates reduced OfficeMath XML from simple LaTeX', () => {
    const omml = createOmmlEquation({
      fallbackText: 'E = m c^2',
      kind: 'equation',
      latex: 'E = mc^2',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:oMathPara>');
    expect(omml).toContain('<m:t>\u00B2</m:t>');
  });

  it('adds the OfficeMath namespace to slide XML', () => {
    expect(ensureMathNamespace('<p:sld xmlns:p="p"></p:sld>')).toContain('xmlns:m=');
  });

  it('writes equation nodes as native OfficeMath paragraphs', async () => {
    const scene: PptxSlideScene = {
      width: 1920,
      height: 1080,
      diagnostics: [],
      nodes: [
        {
          decision: {
            kind: 'native-reduced',
            reason:
              'Equation exported as native OfficeMath with reduced LaTeX conversion; verify in PowerPoint Desktop',
          },
          fallbackText: 'integral from 0 to 1 of x squared d x equals one third',
          kind: 'equation',
          latex: '\\int_0^1 x^2 dx = 1/3',
          style: { fontFace: 'Cambria', fontSize: 42 },
          x: 100,
          y: 100,
          w: 900,
          h: 120,
        },
      ],
    };

    const blob = await writePptxFile({ slides: [scene], title: 'Equation test' });
    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');

    expect(xml).toContain('xmlns:m=');
    expect(xml).toContain('<m:oMathPara>');
    expect(xml).toContain('<m:t>\u222B</m:t>');
    expect(xml).toContain('<m:t>\u2080</m:t>');
    expect(xml).toContain('<m:t>\u00B9</m:t>');
  });

  it('normalizes Greek symbols for inline equation exports', async () => {
    const scene: PptxSlideScene = {
      width: 1920,
      height: 1080,
      diagnostics: [],
      nodes: [
        {
          fallbackText: '\u03B2 = \u03B1 + 1',
          inline: true,
          kind: 'equation',
          latex: '\\beta = \\alpha + 1',
          style: { fontFace: 'Cambria Math', fontSize: 30 },
          x: 100,
          y: 100,
          w: 320,
          h: 60,
        },
      ],
    };

    const blob = await writePptxFile({ slides: [scene], title: 'Inline equation test' });
    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');

    expect(xml).toContain('<m:t>\u03B2</m:t>');
    expect(xml).toContain('<m:t>\u03B1</m:t>');
  });
});
