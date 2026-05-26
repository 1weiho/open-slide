import { describe, expect, it } from 'vitest';
import { createOmmlEquation, ensureMathNamespace } from './equation';
import type { PptxSlideScene } from './scene';
import { readPptxXml } from './test-utils';
import { writePptxFile } from './write-pptx';

describe('pptx equations', () => {
  it('creates editable OfficeMath XML from simple LaTeX', () => {
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
    expect(omml).toContain('<m:sSup>');
    expect(omml).toContain('<m:t xml:space="preserve">2</m:t>');
  });

  it('creates editable display math for integrals and fractions', () => {
    const omml = createOmmlEquation({
      fallbackText: '\u222B\u2080\u00B9 x\u00B2 dx = 1/3',
      kind: 'equation',
      latex: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:nary>');
    expect(omml).toContain('<m:chr m:val="\u222B"/>');
    expect(omml).not.toContain('<m:e/>');
    expect(omml).toMatch(
      /<m:nary>[\s\S]*<m:e>[\s\S]*dx[\s\S]*<\/m:e><\/m:nary><m:r><m:t xml:space="preserve">=<\/m:t><\/m:r><m:f>/,
    );
    expect(omml).toContain('<m:f>');
    expect(omml).toContain('<m:den>');
  });

  it('applies equation text color and font to OfficeMath runs and controls', () => {
    const omml = createOmmlEquation({
      kind: 'equation',
      latex: '\\frac{x}{1}',
      style: { color: 'FFFAF0', fontFace: 'Cambria Math' },
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<w:color w:val="FFFAF0"/>');
    expect(omml).toContain('w:ascii="Cambria Math"');
    expect(omml).toContain('<m:ctrlPr><w:rPr><w:color w:val="FFFAF0"/>');
  });

  it('creates editable OfficeMath for aligned derivations', () => {
    const omml = createOmmlEquation({
      kind: 'equation',
      latex:
        '\\begin{aligned} y\\prime - 2y &= e^{3x} \\\\ e^{-2x}y\\prime - 2e^{-2x}y &= e^x \\\\ (e^{-2x}y)\\prime &= e^x \\end{aligned}',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:m>');
    expect(omml).toContain('<m:mPr>');
    expect(omml).toContain('<m:mr>');
    expect(omml).toContain('<m:mc>');
  });

  it('creates editable OfficeMath for matrices and eigenvalues', () => {
    const omml = createOmmlEquation({
      kind: 'equation',
      latex: 'A=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix},\\quad \\lambda_1=3,\\;\\lambda_2=1',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:m>');
    expect(omml).toContain('<m:cGpRule m:val="4"/>');
    expect(omml).toContain('<m:cGp m:val="4"/>');
    expect(omml).toContain('<m:d>');
    expect(omml).toContain('<m:begChr m:val="["/>');
    expect(omml).toContain('<m:endChr m:val="]"/>');
    expect(omml).toContain('\u03BB');
    expect(omml).toContain('<m:sSub>');
  });

  it('normalizes JSX-authored escaped LaTeX before OfficeMath conversion', () => {
    const omml = createOmmlEquation({
      kind: 'equation',
      latex: 'A=\\\\begin{bmatrix}2&1\\\\\\\\1&2\\\\end{bmatrix},\\\\quad \\\\lambda_1=3',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:m>');
    expect(omml).toContain('\u03BB');
    expect(omml).not.toContain('ParseError');
  });

  it('creates editable OfficeMath for summations and binomials', () => {
    const omml = createOmmlEquation({
      kind: 'equation',
      latex: '\\sum_{k=0}^{n} \\binom{n}{k}x^k y^{n-k} = (x+y)^n',
      style: {},
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });

    expect(omml).toContain('<m:nary>');
    expect(omml).toContain('<m:chr m:val="\u2211"/>');
    expect(omml).not.toContain('<m:e/>');
    expect(omml).toContain('<m:f>');
    expect(omml).toContain('<m:type m:val="noBar"/>');
    expect(omml).toContain('<m:den>');
  });

  it('adds the OfficeMath namespace to slide XML', () => {
    expect(ensureMathNamespace('<p:sld xmlns:p="p"></p:sld>')).toContain('xmlns:m=');
    expect(ensureMathNamespace('<p:sld xmlns:p="p"></p:sld>')).toContain('xmlns:a14=');
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
          latex: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
          style: { color: 'FFFAF0', fontFace: 'Cambria', fontSize: 42 },
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
    expect(xml).toContain('xmlns:w=');
    expect(xml).toContain('xmlns:a14=');
    expect(xml).toContain('<a:defRPr');
    expect(xml).toContain('<a:srgbClr val="FFFAF0"/>');
    expect(xml).toContain('<a14:m><m:oMathPara>');
    expect(xml).toContain('<w:color w:val="FFFAF0"/>');
    expect(xml).toContain('<m:oMathPara>');
    expect(xml).toContain('<m:nary>');
    expect(xml).toContain('<m:f>');
    expect(xml).not.toContain('OSD_PPTX_EQUATION');
  });

  it('writes Greek inline equation exports as native OfficeMath', async () => {
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

    expect(xml).toContain('<m:oMathPara>');
    expect(xml).toContain('\u03B2');
    expect(xml).toContain('\u03B1');
    expect(xml).not.toContain('OSD_PPTX_EQUATION');
  });

  it('keeps fallback text visible when LaTeX conversion fails', async () => {
    const scene: PptxSlideScene = {
      width: 1920,
      height: 1080,
      diagnostics: [],
      nodes: [
        {
          fallbackText: 'unconverted equation',
          kind: 'equation',
          latex: '\\not_a_real_command{',
          style: { fontFace: 'Cambria Math', fontSize: 30 },
          x: 100,
          y: 100,
          w: 320,
          h: 60,
        },
      ],
    };

    const blob = await writePptxFile({ slides: [scene], title: 'Invalid equation test' });
    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');

    expect(xml).toContain('unconverted equation');
    expect(xml).not.toContain('<m:oMathPara>');
    expect(xml).not.toContain('OSD_PPTX_EQUATION');
  });
});
