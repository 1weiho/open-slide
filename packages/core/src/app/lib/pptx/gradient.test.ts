import { describe, expect, it } from 'vitest';
import {
  buildGradFillXml,
  cssAngleToOoxml,
  parseGradient,
  patchSlideXmlGradients,
} from './gradient';

describe('cssAngleToOoxml', () => {
  it('maps CSS gradient angles to OOXML 60000ths-of-a-degree (clockwise from +x)', () => {
    expect(cssAngleToOoxml(90)).toBe(0); // to right
    expect(cssAngleToOoxml(180)).toBe(90 * 60000); // to bottom
    expect(cssAngleToOoxml(0)).toBe(270 * 60000); // to top
    expect(cssAngleToOoxml(45)).toBe(315 * 60000);
  });
});

describe('parseGradient', () => {
  it('parses a linear-gradient with explicit angle and stops', () => {
    const g = parseGradient('linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)');
    expect(g).toEqual({
      kind: 'linear',
      angleDeg: 90,
      stops: [
        { hex: 'FF0000', alpha: 1, pos: 0 },
        { hex: '0000FF', alpha: 1, pos: 100 },
      ],
    });
  });

  it('resolves the "to <side>" keyword to an angle', () => {
    const g = parseGradient('linear-gradient(to right, rgb(0, 0, 0), rgb(255, 255, 255))');
    expect(g?.kind).toBe('linear');
    expect(g?.angleDeg).toBe(90);
  });

  it('defaults to 180deg (to bottom) when no direction is given', () => {
    const g = parseGradient('linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))');
    expect(g?.angleDeg).toBe(180);
  });

  it('distributes positions evenly when stops omit them', () => {
    const g = parseGradient(
      'linear-gradient(0deg, rgb(0,0,0), rgb(128,128,128), rgb(255,255,255))',
    );
    expect(g?.stops.map((s) => s.pos)).toEqual([0, 50, 100]);
  });

  it('keeps the alpha channel of rgba stops', () => {
    const g = parseGradient('linear-gradient(90deg, rgba(255, 0, 0, 0.5) 0%, rgb(0, 0, 255) 100%)');
    expect(g?.stops[0]).toEqual({ hex: 'FF0000', alpha: 0.5, pos: 0 });
  });

  it('classifies radial gradients as "radial" and drops the shape/position head', () => {
    const g = parseGradient('radial-gradient(circle at center, rgb(255, 0, 0), rgb(0, 0, 255))');
    expect(g?.kind).toBe('radial');
    expect(g?.stops).toEqual([
      { hex: 'FF0000', alpha: 1, pos: 0 },
      { hex: '0000FF', alpha: 1, pos: 100 },
    ]);
  });

  it('classifies conic gradients as "conic" (no native OOXML fill; solid fallback only)', () => {
    const g = parseGradient('conic-gradient(from 0deg, rgb(255, 0, 0), rgb(0, 0, 255))');
    expect(g?.kind).toBe('conic');
    expect(g?.stops[0].hex).toBe('FF0000');
  });

  it('parses a modern-color stop that carries an explicit position', () => {
    // getComputedStyle can hand back a gradient whose stops keep their oklch()
    // notation plus a position; the color and the position must be split before
    // the color is normalised. A fake normaliser stands in for the canvas.
    const normalize = (css: string) =>
      css.startsWith('oklch') ? 'rgb(10, 20, 30)' : css.startsWith('rgb') ? css : null;
    const g = parseGradient(
      'linear-gradient(90deg, oklch(0.7 0.15 30) 40%, rgb(0, 0, 255) 100%)',
      normalize,
    );
    expect(g?.stops).toEqual([
      { hex: '0A141E', alpha: 1, pos: 40 },
      { hex: '0000FF', alpha: 1, pos: 100 },
    ]);
  });

  it('returns null for non-gradient values', () => {
    expect(parseGradient('none')).toBeNull();
    expect(parseGradient('url(foo.png)')).toBeNull();
  });
});

describe('buildGradFillXml', () => {
  it('builds an a:gradFill with gsLst stops and a linear angle', () => {
    const xml = buildGradFillXml({
      kind: 'linear',
      angleDeg: 90,
      stops: [
        { hex: 'FF0000', alpha: 1, pos: 0 },
        { hex: '0000FF', alpha: 1, pos: 100 },
      ],
    });
    expect(xml).toContain('<a:gradFill>');
    expect(xml).toContain('<a:gsLst>');
    expect(xml).toContain('<a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs>');
    expect(xml).toContain('<a:gs pos="100000"><a:srgbClr val="0000FF"/></a:gs>');
    expect(xml).toContain('<a:lin ang="0" scaled="1"/>');
  });

  it('encodes stop alpha as an a:alpha child', () => {
    const xml = buildGradFillXml({
      kind: 'linear',
      angleDeg: 180,
      stops: [
        { hex: 'FF0000', alpha: 0.5, pos: 0 },
        { hex: '0000FF', alpha: 1, pos: 100 },
      ],
    });
    expect(xml).toContain('<a:srgbClr val="FF0000"><a:alpha val="50000"/></a:srgbClr>');
    expect(xml).toContain('<a:lin ang="5400000" scaled="1"/>');
  });

  it('builds a centered circle path fill for radial gradients (no a:lin)', () => {
    const xml = buildGradFillXml({
      kind: 'radial',
      angleDeg: 0,
      stops: [
        { hex: 'FF0000', alpha: 1, pos: 0 },
        { hex: '0000FF', alpha: 1, pos: 100 },
      ],
    });
    expect(xml).toContain('<a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs>');
    expect(xml).toContain('<a:gs pos="100000"><a:srgbClr val="0000FF"/></a:gs>');
    expect(xml).toContain(
      '<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>',
    );
    expect(xml).not.toContain('<a:lin');
  });
});

describe('patchSlideXmlGradients', () => {
  const shape = (name: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="2" name="${name}"/></p:nvSpPr><p:spPr><a:prstGeom prst="rect"/><a:solidFill><a:srgbClr val="112233"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="445566"/></a:solidFill></a:ln></p:spPr></p:sp>`;

  it('replaces the fill solidFill of a marked shape with its gradFill, leaving the border fill intact', () => {
    const gradients = new Map([['osd-grad-0', '<a:gradFill>GRAD</a:gradFill>']]);
    const out = patchSlideXmlGradients(shape('osd-grad-0'), gradients);
    expect(out).toContain('<a:gradFill>GRAD</a:gradFill>');
    expect(out).toContain('<a:ln><a:solidFill><a:srgbClr val="445566"/></a:solidFill></a:ln>');
    expect(out).not.toContain('<a:srgbClr val="112233"/>');
  });

  it('leaves shapes without a matching marker untouched', () => {
    const gradients = new Map([['osd-grad-9', '<a:gradFill>GRAD</a:gradFill>']]);
    const input = shape('osd-grad-0');
    expect(patchSlideXmlGradients(input, gradients)).toBe(input);
  });

  it('is a no-op when there are no gradients', () => {
    const input = shape('osd-grad-0');
    expect(patchSlideXmlGradients(input, new Map())).toBe(input);
  });
});
