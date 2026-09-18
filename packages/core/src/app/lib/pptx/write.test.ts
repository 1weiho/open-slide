import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { PptxCell, PptxDeck, PptxGradient, PptxPage, PptxTable } from './model';
import { PPTX_CANVAS, writePptx } from './write';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmYwMDAwIi8+PC9zdmc+';
const color = (value: string) => ({ color: value, opacity: 1 });
const TEXT_GRADIENT: PptxGradient = {
  kind: 'linear',
  angle: 90,
  stops: [
    { offset: 0, color: color('FF0000') },
    { offset: 1, color: color('0000FF') },
  ],
};
const run = (text: string, overrides: Partial<Parameters<typeof makeRun>[1]> = {}) =>
  makeRun(text, overrides);
const borders = (): PptxCell['borders'] =>
  [0, 1, 2, 3].map(() => ({
    ...color('000000'),
    width: 1,
    dash: 'solid' as const,
  })) as PptxCell['borders'];

function tableCell(
  text: string,
  overrides: Partial<Parameters<typeof makeRun>[1]> = {},
  valign: PptxCell['valign'] = 'middle',
  fill?: PptxCell['fill'],
): PptxCell {
  return {
    paragraphs: [
      {
        runs: [run(text, overrides)],
        align: 'left',
        lineHeight: 20,
        spaceBefore: 0,
        spaceAfter: 0,
      },
    ],
    fill,
    borders: borders(),
    padding: [4, 8, 4, 8],
    valign,
  };
}

function makeRun(
  text: string,
  overrides: Partial<{
    fontFace: string;
    fontSize: number;
    color: { color: string; opacity: number };
    gradient: PptxGradient;
    gradientBounds: { w: number; h: number };
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    letterSpacing: number;
    lang: string;
    link: { url: string } | { slide: number };
  }> = {},
) {
  return {
    text,
    fontFace: 'Arial',
    fontSize: 24,
    color: color('111111'),
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    letterSpacing: 0,
    lang: 'en-US',
    ...overrides,
  };
}

function page(objects: PptxPage['objects']): PptxPage {
  return {
    index: 0,
    id: 'page-1',
    background: color('FFFFFF'),
    objects,
    notes: 'Speaker notes\n第二行 https://example.com',
    diagnostics: [],
  };
}

function deck(objects: PptxPage['objects']): PptxDeck {
  return {
    version: 1,
    id: 'fixture',
    title: 'Editable fixture',
    width: 1920,
    height: 1080,
    pages: [page(objects)],
  };
}

const textObject = {
  kind: 'text' as const,
  id: 'text-1',
  source: 'fixture.text',
  order: 1,
  x: 144,
  y: 72,
  w: 576,
  h: 288,
  link: { url: 'https://example.com/text' },
  paragraphs: [
    {
      runs: [run('Head', { bold: true, color: color('AA0000') }), run('ing')],
      align: 'left' as const,
      lineHeight: 32,
      spaceBefore: 0,
      spaceAfter: 8,
    },
    {
      runs: [run('Bullet')],
      align: 'left' as const,
      lineHeight: 28,
      spaceBefore: 0,
      spaceAfter: 4,
      list: { kind: 'bullet' as const, start: 1, level: 0, indent: 24, hanging: 6 },
    },
    {
      runs: [run('Numbered\ncontinued')],
      align: 'left' as const,
      lineHeight: 28,
      spaceBefore: 0,
      spaceAfter: 0,
      list: { kind: 'number' as const, start: 3, level: 1, indent: 48, hanging: 8 },
    },
  ],
};

const tableObject: PptxTable = {
  kind: 'table' as const,
  id: 'table-1',
  source: 'fixture.table',
  order: 2,
  x: 144,
  y: 400,
  w: 720,
  h: 144,
  columnWidths: [288, 432],
  rowHeights: [72, 72],
  rows: [
    [
      tableCell('Name', { bold: true }, 'middle', color('EEEEEE')),
      tableCell('Value', { link: { url: 'https://example.com' } }, 'top'),
    ],
    [tableCell('CJK 中文', {}, 'bottom'), tableCell('D')],
  ],
};

it('keeps native table and text IDs unique after a group falls back', async () => {
  const fixture = deck([textObject, tableObject]);
  fixture.version = 2;
  fixture.pages[0].objects.push({ ...textObject, id: 'text-2', order: 3, x: 950 });
  fixture.pages[0].groups = [
    { id: 'text-group', kind: 'explicit', source: 'fixture', members: ['text-2', 'table-1'] },
  ];
  const zip = unzipSync(new Uint8Array(await (await writePptx(fixture)).arrayBuffer()));
  const xml = strFromU8(zip['ppt/slides/slide1.xml']);
  const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
  expect(xml).toContain('<a:tbl>');
  expect(xml).toContain('Numbered');
});

describe('writePptx', () => {
  it('writes native text, lists, table, notes, links and image objects into a real PPTX', async () => {
    const objects = [
      textObject,
      tableObject,
      {
        kind: 'shape' as const,
        id: 'shape-1',
        source: 'fixture.shape',
        order: 0,
        x: 0,
        y: 0,
        w: 144,
        h: 72,
        geometry: 'roundRect' as const,
        radius: 8,
        fill: color('00FF00'),
        stroke: { ...color('0000FF'), width: 2, dash: 'dot' as const },
      },
      {
        kind: 'shape' as const,
        id: 'line-1',
        source: 'fixture.line',
        order: 3,
        x: 864,
        y: 72,
        w: 288,
        h: 0,
        geometry: 'line' as const,
        stroke: { ...color('000000'), width: 1, dash: 'dash' as const },
        startArrow: true,
        endArrow: true,
      },
      {
        kind: 'image' as const,
        id: 'image-1',
        source: 'fixture.image',
        order: 4,
        x: 1000,
        y: 72,
        w: 144,
        h: 144,
        data: `data:image/png;base64,${PNG}`,
        mime: 'image/png',
        assetId: 'asset-1',
        crop: { left: 0.1, top: 0.2, right: 0.1, bottom: 0 },
      },
    ];
    const output = await writePptx(deck(objects));
    expect(output).toBeInstanceOf(Blob);
    expect(output.type).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
    const files = unzipSync(new Uint8Array(await output.arrayBuffer()));
    const presentation = strFromU8(files['ppt/presentation.xml']);
    const slide = strFromU8(files['ppt/slides/slide1.xml']);
    const rels = strFromU8(files['ppt/slides/_rels/slide1.xml.rels']);
    const notes = strFromU8(files['ppt/notesSlides/notesSlide1.xml']);
    const paragraphs = [...slide.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)].map((match) => match[0]);
    const relationshipIds = new Set([...rels.matchAll(/Id="([^"]+)"/g)].map((match) => match[1]));
    for (const paragraph of paragraphs) {
      expect((paragraph.match(/<a:pPr\b/g) ?? []).length).toBeLessThanOrEqual(1);
      const pPr = paragraph.indexOf('<a:pPr');
      const firstRun = paragraph.search(/<a:(?:r|br|fld)\b/);
      expect(pPr).toBeGreaterThanOrEqual(0);
      expect(firstRun).toBeGreaterThan(pPr);
    }
    for (const id of [...slide.matchAll(/r:id="([^"]+)"/g)].map((match) => match[1])) {
      expect(id).not.toMatch(/undefined|NaN/);
      expect(relationshipIds).toContain(id);
    }

    expect(presentation).toContain('<p:sldSz cx="12192000" cy="6858000"/>');
    expect(slide).toContain('<p:sp>');
    expect(slide).toContain('<a:t>Head</a:t>');
    expect(slide).toContain('<a:t>ing</a:t>');
    expect(slide).toContain('<a:t>Bullet</a:t>');
    expect(slide).toContain('<a:buChar char="&#x2022;"/>');
    expect(slide).toContain('<a:t>Numbered</a:t>');
    expect(slide).toContain('<a:br/>');
    expect(slide).toContain('a:buAutoNum');
    expect(slide).toContain('startAt="3"');
    expect(slide).toContain(
      '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">',
    );
    expect(slide).toContain('<a:gridCol w="1828800"/>');
    expect(slide).toContain('<a:gridCol w="2743200"/>');
    expect(slide).toContain('<a:srcRect l="10000" t="20000" r="10000" b="0"/>');
    expect(slide).toContain('fmla="val 11111"');
    expect(slide).toContain('marL="50800"');
    expect(slide).toContain('tailEnd type="triangle"');
    expect(rels).toContain('Target="https://example.com"');
    expect(rels).toContain('Target="https://example.com/text"');
    expect(notes).toMatch(/Speaker notes\r?\n第二行 https:\/\/example\.com/);
    expect(
      Object.keys(files).some((name) => name.startsWith('ppt/media/') && !name.endsWith('/')),
    ).toBe(true);
  });

  it('keeps mixed gradient runs native across soft breaks, links and table cells', async () => {
    const gradientText = {
      kind: 'text' as const,
      id: 'gradient-text',
      source: 'fixture.gradient-text',
      order: 0,
      x: 0,
      y: 0,
      w: 576,
      h: 144,
      link: { url: 'https://example.com/object' },
      paragraphs: [
        {
          runs: [
            run('plain '),
            run('GRAD\nIENT', {
              gradient: TEXT_GRADIENT,
              gradientBounds: { w: 576, h: 144 },
              link: { url: 'https://example.com/run' },
            }),
            run(' tail'),
          ],
          align: 'left' as const,
          lineHeight: 28,
          spaceBefore: 0,
          spaceAfter: 0,
        },
      ],
    };
    const gradientTable: PptxTable = {
      kind: 'table',
      id: 'gradient-table',
      source: 'fixture.gradient-table',
      order: 1,
      x: 0,
      y: 200,
      w: 576,
      h: 72,
      columnWidths: [288, 288],
      rowHeights: [72],
      rows: [
        [
          tableCell('plain cell'),
          tableCell('GRAD\nCELL', {
            gradient: TEXT_GRADIENT,
            gradientBounds: { w: 288, h: 72 },
            link: { url: 'https://example.com/cell' },
          }),
        ],
      ],
    };
    const output = await writePptx(deck([gradientText, gradientTable]));
    const files = unzipSync(new Uint8Array(await output.arrayBuffer()));
    const slide = strFromU8(files['ppt/slides/slide1.xml']);
    const rels = strFromU8(files['ppt/slides/_rels/slide1.xml.rels']);
    const namedShape = (id: string) =>
      [...slide.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].find((match) =>
        match[0].includes(`name="${id}"`),
      )?.[0] ?? '';
    const namedFrame = (id: string) =>
      [...slide.matchAll(/<p:graphicFrame>[\s\S]*?<\/p:graphicFrame>/g)].find((match) =>
        match[0].includes(`name="${id}"`),
      )?.[0] ?? '';
    const text = namedShape('gradient-text');
    const table = namedFrame('gradient-table');
    expect(text).toContain('<a:t>plain </a:t>');
    expect(text).toContain('<a:t>GRAD</a:t>');
    expect(text).toContain('<a:t>IENT</a:t>');
    expect(text).toContain('<a:t> tail</a:t>');
    expect(text).toContain('<a:br/>');
    expect(text.match(/<a:gradFill\b/g) ?? []).toHaveLength(2);
    expect(table.match(/<a:gradFill\b/g) ?? []).toHaveLength(2);
    expect(table).toContain('<a:t>GRAD</a:t>');
    expect(table).toContain('<a:t>CELL</a:t>');

    const paragraphs = [
      ...text.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g),
      ...table.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g),
    ].map((match) => match[0]);
    for (const paragraph of paragraphs) {
      expect((paragraph.match(/<a:pPr\b/g) ?? []).length).toBeLessThanOrEqual(1);
      const pPr = paragraph.indexOf('<a:pPr');
      const firstRun = paragraph.search(/<a:(?:r|br|fld)\b/);
      expect(pPr).toBeGreaterThanOrEqual(0);
      expect(firstRun).toBeGreaterThan(pPr);
    }

    const relationshipIds = new Set([...rels.matchAll(/Id="([^"]+)"/g)].map((match) => match[1]));
    for (const id of [...slide.matchAll(/r:id="([^"]+)"/g)].map((match) => match[1])) {
      expect(id).not.toMatch(/undefined|NaN/);
      expect(relationshipIds).toContain(id);
    }
    expect(rels).toContain('Target="https://example.com/object"');
    expect(rels).toContain('Target="https://example.com/run"');
    expect(rels).toContain('Target="https://example.com/cell"');
    expect(
      Object.keys(files).some((name) => name.startsWith('ppt/media/') && !name.endsWith('/')),
    ).toBe(false);
  });

  it('keeps text and shapes native without creating bitmap media', async () => {
    const output = await writePptx(
      deck([
        textObject,
        {
          kind: 'shape',
          id: 'shape-1',
          source: 'fixture.shape',
          order: 0,
          x: 0,
          y: 0,
          w: 144,
          h: 72,
          geometry: 'rect',
        },
      ]),
    );
    const files = unzipSync(new Uint8Array(await output.arrayBuffer()));
    const slide = strFromU8(files['ppt/slides/slide1.xml']);
    expect(slide).toContain('<p:txBody>');
    expect(slide).toContain('<a:prstGeom prst="rect"');
    expect(slide).toContain('<a:noFill/>');
    expect(
      Object.keys(files).some((name) => name.startsWith('ppt/media/') && !name.endsWith('/')),
    ).toBe(false);
  });

  it('writes gradients, custom paths, effects, transforms and SVG fallback assets natively', async () => {
    const output = await writePptx(
      deck([
        {
          kind: 'shape',
          id: 'gradient-linear',
          source: 'fixture.gradient-linear',
          order: 0,
          x: 0,
          y: 0,
          w: 288,
          h: 144,
          geometry: 'rect',
          gradient: {
            kind: 'linear',
            angle: 0,
            stops: [
              { offset: 0, color: color('FF0000') },
              { offset: 0.5, color: color('00FF00') },
              { offset: 0.5, color: color('0000FF') },
              { offset: 1, color: color('FFFFFF') },
            ],
          },
        },
        {
          kind: 'shape',
          id: 'gradient-radial',
          source: 'fixture.gradient-radial',
          order: 1,
          x: 288,
          y: 0,
          w: 288,
          h: 144,
          geometry: 'rect',
          gradient: {
            kind: 'radial',
            center: { x: 0.25, y: 0.75 },
            radius: { x: 0.1, y: 0.2 },
            stops: [
              { offset: 0, color: { color: 'FF0000', opacity: 0.8 } },
              { offset: 1, color: color('000000') },
            ],
          },
        },
        {
          kind: 'shape',
          id: 'custom-path',
          source: 'fixture.custom-path',
          order: 2,
          x: 0,
          y: 200,
          w: 288,
          h: 144,
          geometry: 'path',
          path: [
            { type: 'move', x: 0, y: 0 },
            { type: 'line', x: 288, y: 0 },
            { type: 'cubic', x1: 288, y1: 48, x2: 240, y2: 144, x: 144, y: 144 },
            { type: 'line', x: 0, y: 144 },
            { type: 'close' },
          ],
          stroke: { ...color('112233'), width: 3, cap: 'round', join: 'bevel' },
        },
        {
          kind: 'shape',
          id: 'shadowed-shape',
          source: 'fixture.shadowed-shape',
          order: 3,
          x: 600,
          y: 0,
          w: 288,
          h: 144,
          geometry: 'rect',
          fill: color('DDDDDD'),
          shadow: { ...color('000000'), x: 8, y: 4, blur: 6 },
          blur: 3,
        },
        {
          kind: 'text',
          id: 'rotated-text',
          source: 'fixture.rotated-text',
          order: 4,
          x: 0,
          y: 400,
          w: 288,
          h: 72,
          rotation: 12,
          shadow: { ...color('000000'), x: 0, y: 0, blur: 2, inset: true },
          paragraphs: [
            {
              runs: [run('Rotated')],
              align: 'left',
              lineHeight: 24,
              spaceBefore: 0,
              spaceAfter: 0,
            },
          ],
        },
        {
          kind: 'image',
          id: 'svg-image',
          source: 'fixture.svg-image',
          order: 5,
          x: 1000,
          y: 400,
          w: 144,
          h: 144,
          data: `data:image/png;base64,${PNG}`,
          mime: 'image/png',
          assetId: 'svg-asset',
          svgData: SVG,
          opacity: 0.5,
          rotation: -15,
        },
      ]),
    );
    const files = unzipSync(new Uint8Array(await output.arrayBuffer()));
    const slide = strFromU8(files['ppt/slides/slide1.xml']);
    const rels = strFromU8(files['ppt/slides/_rels/slide1.xml.rels']);
    const contentTypes = strFromU8(files['[Content_Types].xml']);
    const namedShape = (id: string) =>
      [...slide.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].find((match) =>
        match[0].includes(`name="${id}"`),
      )?.[0] ?? '';
    const namedPicture = (id: string) =>
      [...slide.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)].find((match) =>
        match[0].includes(`name="${id}"`),
      )?.[0] ?? '';
    const linear = namedShape('gradient-linear');
    const radial = namedShape('gradient-radial-radial-0');
    const path = namedShape('custom-path');
    const shadow = namedShape('shadowed-shape');
    const text = namedShape('rotated-text');
    const picture = namedPicture('svg-image');
    expect(linear).toContain('<a:gradFill');
    expect(linear).toContain('<a:lin ang="16200000" scaled="1"/>');
    expect(linear).toContain('<a:gs pos="50000">');
    expect(radial).toContain('<a:custGeom>');
    expect(radial).not.toContain('<a:gradFill');
    expect(slide.match(/name="gradient-radial-radial-\d+"/g)?.length).toBeGreaterThan(20);
    expect(path).toContain('<a:custGeom>');
    expect(path).toContain('<a:cubicBezTo>');
    expect(path).toContain('<a:close />');
    expect(path).toMatch(/<a:ln[^>]*cap="rnd"/);
    expect(path).toContain('<a:bevel/>');
    expect(shadow).toContain('<a:outerShdw');
    expect(shadow).toContain('<a:blur rad="19050" grow="1"/>');
    expect(text).toContain('<a:innerShdw');
    expect(text).toContain('rot="720000"');
    expect(picture).toContain('rot="-900000"');
    expect(picture).toContain('<asvg:svgBlip');
    expect(picture).toContain('<a:alphaModFix amt="50000"/>');
    expect(contentTypes).toContain('<Default Extension="svg" ContentType="image/svg+xml"/>');
    expect(rels).toMatch(/<Relationship Id="rId\d+"[^>]*Target="\.\.\/media\/open-slide-1-1\.svg"/);
    const relationshipIds = new Set([...rels.matchAll(/Id="([^"]+)"/g)].map((match) => match[1]));
    for (const id of [...slide.matchAll(/r:(?:id|embed)="([^"]+)"/g)].map((match) => match[1])) {
      expect(id).not.toMatch(/undefined|NaN/);
      expect(relationshipIds).toContain(id);
    }
    const media = Object.keys(files).filter((name) => name.startsWith('ppt/media/'));
    expect(media.some((name) => name.endsWith('.png'))).toBe(true);
    expect(media).toContain('ppt/media/open-slide-1-1.svg');
    expect(strFromU8(files['ppt/media/open-slide-1-1.svg'])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ff0000"/></svg>',
    );
  });

  it('keeps generated radial names clear of source page and object IDs', async () => {
    const fixture = deck([
      {
        kind: 'shape',
        id: 'radial',
        source: 'fixture.radial',
        order: 0,
        x: 0,
        y: 0,
        w: 288,
        h: 144,
        geometry: 'rect',
        gradient: {
          kind: 'radial',
          center: { x: 0.5, y: 0.5 },
          radius: { x: 0.5, y: 0.5 },
          stops: [
            { offset: 0, color: color('FFFFFF') },
            { offset: 1, color: color('000000') },
          ],
        },
      },
      {
        kind: 'shape',
        id: 'radial-radial-1',
        source: 'fixture.source-shape',
        order: 1,
        x: 288,
        y: 0,
        w: 144,
        h: 144,
        geometry: 'rect',
        fill: color('00FF00'),
      },
    ]);
    fixture.pages[0].id = 'radial-radial-0';
    const files = unzipSync(new Uint8Array(await (await writePptx(fixture)).arrayBuffer()));
    const slide = strFromU8(files['ppt/slides/slide1.xml']);
    const names = [...slide.matchAll(/<p:cNvPr\b[^>]*\bname="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain('radial-radial-0');
    expect(slide.match(/name="radial-radial-1"/g)).toHaveLength(1);
    expect(names).toContain('radial-radial-2');
  });

  it('uses the canonical pixel conversion constants', () => {
    expect(PPTX_CANVAS).toEqual({ width: 13 + 1 / 3, height: 7.5, pxPerInch: 144, ptPerPx: 0.5 });
  });
});
