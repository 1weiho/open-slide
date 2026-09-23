import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { strFromU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildPptxFiles, escapeXml, geometryXml } from './ooxml';
import type { DeckScene, RunStyle } from './scene';

const PNG_1PX = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

const style: RunStyle = {
  font: 'Inter',
  sizePx: 40,
  bold: true,
  italic: false,
  underline: false,
  strike: false,
  color: { r: 26, g: 24, b: 20, a: 1 },
  letterSpacingPx: -0.8,
  baselineShift: null,
  shadow: null,
  outline: null,
};

const deck: DeckScene = {
  images: [{ id: 1, bytes: PNG_1PX, format: 'png' }],
  slides: [
    {
      background: { kind: 'solid', color: { r: 247, g: 245, b: 240, a: 1 } },
      notes: 'Open with the quote.\n\nPause.',
      nodes: [
        {
          kind: 'shape',
          name: 'Card',
          box: { x: 100, y: 100, w: 400, h: 200 },
          rotationDeg: 0,
          flipV: false,
          geometry: { kind: 'roundRect', radius: 24 },
          fill: {
            kind: 'gradient',
            angleDeg: 90,
            stops: [
              { pos: 0, color: { r: 255, g: 0, b: 0, a: 1 } },
              { pos: 1, color: { r: 0, g: 0, b: 255, a: 0.5 } },
            ],
          },
          outline: { width: 2, color: { r: 0, g: 0, b: 0, a: 1 }, dash: 'dash' },
          shadow: {
            blur: 30,
            dist: 10,
            dirDeg: 90,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            spread: 0,
            inner: false,
          },
        },
        {
          kind: 'text',
          name: 'Text: Hello',
          box: { x: 120, y: 120, w: 300, h: 128 },
          rotationDeg: -3,
          flipV: false,
          paragraphs: [
            {
              lineSpacingPx: 64,
              align: 'ctr',
              bullet: { kind: 'char', char: '•', color: { r: 0, g: 0, b: 0, a: 1 }, font: 'Arial' },
              marginLeftPx: 20,
              indentPx: -20,
              endSizePx: 40,
              lines: [
                { runs: [{ text: 'Hello <world> & "friends"', style }], sizePx: 40 },
                { runs: [], sizePx: 40 },
                { runs: [{ text: 'again', style: { ...style, bold: false } }], sizePx: 40 },
              ],
            },
          ],
        },
        {
          kind: 'picture',
          name: 'Image',
          box: { x: 600, y: 100, w: 200, h: 100 },
          rotationDeg: 0,
          flipV: false,
          imageId: 1,
          crop: { l: 0.1, t: 0, r: 0.1, b: 0 },
          alpha: 0.8,
          geometry: { kind: 'ellipse' },
          outline: null,
          shadow: null,
        },
      ],
    },
    { background: null, notes: null, nodes: [] },
  ],
};

describe('buildPptxFiles', () => {
  const files = buildPptxFiles(deck);
  const text = (name: string) => strFromU8(files[name]);

  it('emits every package part and wires the relationships', () => {
    expect(Object.keys(files).sort()).toEqual(
      [
        '[Content_Types].xml',
        '_rels/.rels',
        'ppt/_rels/presentation.xml.rels',
        'ppt/media/image1.png',
        'ppt/notesMasters/_rels/notesMaster1.xml.rels',
        'ppt/notesMasters/notesMaster1.xml',
        'ppt/notesSlides/_rels/notesSlide1.xml.rels',
        'ppt/notesSlides/notesSlide1.xml',
        'ppt/presProps.xml',
        'ppt/presentation.xml',
        'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
        'ppt/slideLayouts/slideLayout1.xml',
        'ppt/slideMasters/_rels/slideMaster1.xml.rels',
        'ppt/slideMasters/slideMaster1.xml',
        'ppt/slides/_rels/slide1.xml.rels',
        'ppt/slides/_rels/slide2.xml.rels',
        'ppt/slides/slide1.xml',
        'ppt/slides/slide2.xml',
        'ppt/theme/theme1.xml',
        'ppt/theme/theme2.xml',
      ].sort(),
    );
    expect(text('ppt/presentation.xml')).toContain('<p:sldSz cx="12192000" cy="6858000"/>');
    expect(text('ppt/presentation.xml')).toContain('<p:notesMasterId r:id="rId5"/>');
    expect(text('ppt/slides/_rels/slide1.xml.rels')).toContain('Target="../media/image1.png"');
    expect(text('ppt/slides/_rels/slide1.xml.rels')).toContain('notesSlides/notesSlide1.xml');
    expect(text('ppt/slides/_rels/slide2.xml.rels')).not.toContain('notesSlide');
    expect(text('[Content_Types].xml')).toContain('/ppt/notesSlides/notesSlide1.xml');
  });

  it('converts geometry, text and fills into DrawingML', () => {
    const slide = text('ppt/slides/slide1.xml');
    expect(slide).toContain(
      '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="F7F5F0"></a:srgbClr></a:solidFill>',
    );
    expect(slide).toContain('<a:off x="635000" y="635000"/><a:ext cx="2540000" cy="1270000"/>');
    expect(slide).toContain(
      '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 12000"/>',
    );
    expect(slide).toContain('<a:lin ang="0" scaled="0"/>');
    expect(slide).toContain('<a:alpha val="50000"/>');
    expect(slide).toContain('<a:prstDash val="dash"/>');
    expect(slide).toContain('<a:outerShdw blurRad="190500" dist="63500" dir="5400000"');
    expect(slide).toContain('<a:xfrm rot="21420000">');
    expect(slide).toContain('<a:lnSpc><a:spcPts val="3200"/></a:lnSpc>');
    expect(slide).toContain('marL="127000" indent="-127000" algn="ctr"');
    expect(slide).toContain('<a:buChar char="•"/>');
    expect(slide).toContain('sz="2000" b="1" spc="-40" dirty="0"');
    expect(slide).toContain('<a:t>Hello &lt;world&gt; &amp; &quot;friends&quot;</a:t>');
    expect(slide.match(/<a:br>/g)).toHaveLength(2);
    expect(slide).toContain('<a:latin typeface="Inter"/><a:ea typeface="Inter"/>');
    expect(slide).toContain('<a:alphaModFix amt="80000"/>');
    expect(slide).toContain('<a:srcRect l="10000" t="0" r="10000" b="0"/>');
    expect(slide).toContain('<a:prstGeom prst="ellipse">');
    expect(text('ppt/notesSlides/notesSlide1.xml')).toContain('<a:t>Open with the quote.</a:t>');
  });

  it('builds a custom rounded path for uneven corners', () => {
    const xml = geometryXml(
      {
        kind: 'custom',
        radii: [
          { x: 10, y: 10 },
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 0 },
        ],
      },
      { x: 0, y: 0, w: 100, h: 50 },
    );
    expect(xml).toContain('<a:path w="635000" h="317500">');
    expect(xml.match(/<a:arcTo /g)).toHaveLength(2);
    expect(xml).toContain('stAng="10800000"');
    expect(xml).toContain('stAng="0"');
  });

  it('strips control characters', () => {
    expect(escapeXml('a\u0000b\u0007c\td')).toBe('abc\td');
  });

  it('round-trips through a zip', () => {
    const zipped = zipSync(files);
    const unzipped = unzipSync(zipped);
    expect(Object.keys(unzipped)).toHaveLength(Object.keys(files).length);
    const out = process.env.PPTX_SAMPLE_OUT;
    if (out) {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, zipped);
    }
  });
});
