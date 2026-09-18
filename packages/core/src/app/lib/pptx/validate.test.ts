import { describe, expect, it } from 'vitest';
import type { PptxDeck } from './model';
import { validateDeck } from './validate';

const color = (value: string) => ({ color: value, opacity: 1 });
const stroke = () => ({ ...color('000000'), width: 1, dash: 'solid' as const });
const paragraph = (text: string) => ({
  runs: [
    {
      text,
      fontFace: 'Arial',
      fontSize: 24,
      color: color('000000'),
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      letterSpacing: 0,
      lang: 'en-US',
    },
  ],
  align: 'left' as const,
  lineHeight: 28,
  spaceBefore: 0,
  spaceAfter: 0,
});

function validDeck(): PptxDeck {
  return {
    version: 1,
    id: 'deck',
    title: 'Fixture',
    width: 1920,
    height: 1080,
    pages: [
      {
        index: 0,
        id: 'page',
        background: color('FFFFFF'),
        diagnostics: [
          {
            severity: 'warning',
            code: 'source-warning',
            page: 1,
            source: 'source',
            message: 'kept',
            suggestion: 'kept',
          },
        ],
        objects: [
          {
            kind: 'text',
            id: 'text',
            source: 'source.text',
            order: 0,
            x: 0,
            y: 0,
            w: 288,
            h: 72,
            paragraphs: [paragraph('Hello')],
          },
        ],
      },
    ],
  };
}

describe('validateDeck', () => {
  it('preserves page diagnostics and accepts a valid native deck', () => {
    const diagnostics = validateDeck(validDeck());
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'source-warning', message: 'kept' }),
    );
    expect(diagnostics.filter((entry) => entry.severity === 'error')).toHaveLength(0);
  });

  it('blocks noncanonical canvases for the fixed-size writer', () => {
    const deck = validDeck();
    deck.width = 1600;
    const diagnostic = validateDeck(deck).find((entry) => entry.code === 'noncanonical-canvas');
    expect(diagnostic).toMatchObject({
      severity: 'error',
      page: 0,
      source: 'deck',
    });
  });

  it('reports XML 1.0-invalid controls with page and source locators', () => {
    const deck = validDeck();
    const page = deck.pages[0];
    const object = page.objects[0];
    if (object.kind !== 'text') throw new Error('Expected the fixture object to be text.');
    const run = object.paragraphs[0].runs[0];
    run.text = 'before\u0001after';
    run.link = { url: 'https://example.test/run\u000b' };
    object.link = { url: 'https://example.test/object\u000c' };
    page.notes = 'speaker\u0000note';

    const diagnostics = validateDeck(deck).filter(
      (entry) => entry.code === 'invalid-xml-character',
    );
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          page: 1,
          source: 'source.text/paragraph[0]/run[0]',
          message: expect.stringContaining('U+0001'),
        }),
        expect.objectContaining({
          page: 1,
          source: 'source.text/paragraph[0]/run[0]/url',
          message: expect.stringContaining('U+000B'),
        }),
        expect.objectContaining({
          page: 1,
          source: 'source.text/url',
          message: expect.stringContaining('U+000C'),
        }),
        expect.objectContaining({
          page: 1,
          source: 'page:page/notes',
          message: expect.stringContaining('U+0000'),
        }),
      ]),
    );
    expect(diagnostics.every((entry) => entry.severity === 'error')).toBe(true);
  });

  it('accepts and preserves legal whitespace and Unicode text', () => {
    const deck = validDeck();
    const page = deck.pages[0];
    const object = page.objects[0];
    if (object.kind !== 'text') throw new Error('Expected the fixture object to be text.');
    const text = '中文\u00a0\u3000\n\t';
    const notes = '講者\u00a0\u3000\n\t';
    object.paragraphs[0].runs[0].text = text;
    page.notes = notes;

    const diagnostics = validateDeck(deck);
    expect(diagnostics.filter((entry) => entry.severity === 'error')).toHaveLength(0);
    expect(object.paragraphs[0].runs[0].text).toBe(text);
    expect(page.notes).toBe(notes);
  });

  it('reports duplicate IDs, nonfinite bounds, malformed tables and unsafe links', () => {
    const deck = validDeck();
    deck.pages[0].objects.push(
      {
        kind: 'shape',
        id: 'text',
        source: 'source.shape',
        order: 1,
        x: Number.NaN,
        y: 0,
        w: 72,
        h: 72,
        geometry: 'rect',
      },
      {
        kind: 'table',
        id: 'table',
        source: 'source.table',
        order: 2,
        x: 0,
        y: 100,
        w: 200,
        h: 72,
        columnWidths: [100, 100],
        rowHeights: [72],
        rows: [
          [
            {
              paragraphs: [paragraph('A')],
              borders: [stroke(), stroke(), stroke(), stroke()],
              padding: [4, 4, 4, 4],
              valign: 'top',
            },
          ],
          [
            {
              paragraphs: [paragraph('B')],
              borders: [stroke(), stroke(), stroke(), stroke()],
              padding: [4, 4, 4, 4],
              valign: 'top',
            },
            {
              paragraphs: [paragraph('C')],
              borders: [stroke(), stroke(), stroke(), stroke()],
              padding: [4, 4, 4, 4],
              valign: 'top',
            },
          ],
        ],
      },
      {
        kind: 'text',
        id: 'unsafe',
        source: 'source.unsafe',
        order: 3,
        x: 0,
        y: 200,
        w: 288,
        h: 72,
        link: { url: 'javascript:alert(1)' },
        paragraphs: [
          {
            ...paragraph('Link'),
            runs: [{ ...paragraph('Link').runs[0], link: { url: 'javascript:alert(1)' } }],
          },
        ],
      },
    );
    const codes = validateDeck(deck).map((entry) => entry.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'duplicate-id',
        'invalid-dimension',
        'table-nonrectangular',
        'unsafe-link',
      ]),
    );
  });

  it('blocks SVG worker assets and invalid crop edges', () => {
    const deck = validDeck();
    deck.pages[0].objects = [
      {
        kind: 'image',
        id: 'image',
        source: 'source.image',
        order: 0,
        x: 0,
        y: 0,
        w: 144,
        h: 144,
        data: 'data:image/svg+xml;base64,PHN2Zy8+',
        mime: 'image/svg+xml',
        assetId: 'svg',
        crop: { left: 0.75, top: 0, right: 0.3, bottom: 0 },
      },
    ];
    const diagnostics = validateDeck(deck);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'unsupported-image-mime', severity: 'error' }),
        expect.objectContaining({ code: 'invalid-image-crop', severity: 'error' }),
      ]),
    );
  });

  it('accepts native gradients, bounded custom paths, effects and SVG fallbacks', () => {
    const deck = validDeck();
    deck.pages[0].objects = [
      {
        kind: 'shape',
        id: 'path',
        source: 'source.path',
        order: 0,
        x: 0,
        y: 0,
        w: 288,
        h: 144,
        geometry: 'path',
        path: [
          { type: 'move', x: 0, y: 0 },
          { type: 'line', x: 288, y: 0 },
          { type: 'cubic', x1: 288, y1: 40, x2: 220, y2: 144, x: 144, y: 144 },
          { type: 'line', x: 0, y: 144 },
          { type: 'close' },
        ],
        gradient: {
          kind: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: color('112233') },
            { offset: 1, color: color('445566') },
          ],
        },
        stroke: { ...stroke(), cap: 'round', join: 'bevel' },
        shadow: { ...color('000000'), x: 4, y: 2, blur: 3 },
        blur: 2,
      },
      {
        kind: 'image',
        id: 'svg',
        source: 'source.svg',
        order: 1,
        x: 288,
        y: 0,
        w: 144,
        h: 144,
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        mime: 'image/png',
        assetId: 'svg-asset',
        opacity: 0.5,
        svgData:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',
      },
    ];
    const diagnostics = validateDeck(deck);
    expect(diagnostics.filter((entry) => entry.severity === 'error')).toHaveLength(0);
  });

  it('validates text gradient runs and their positive source bounds', () => {
    const deck = validDeck();
    const object = deck.pages[0].objects[0];
    if (object.kind !== 'text') throw new Error('Expected the fixture object to be text.');
    const sourceRun = object.paragraphs[0].runs[0];
    sourceRun.gradient = {
      kind: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: color('FF0000') },
        { offset: 1, color: color('0000FF') },
      ],
    };
    sourceRun.gradientBounds = { w: 288, h: 72 };
    expect(validateDeck(deck).filter((entry) => entry.severity === 'error')).toHaveLength(0);

    sourceRun.gradientBounds = { w: 0, h: Number.NaN };
    expect(validateDeck(deck).map((entry) => entry.code)).toContain('invalid-gradient-bounds');

    sourceRun.gradient = undefined;
    expect(validateDeck(deck).map((entry) => entry.code)).toContain(
      'gradient-bounds-without-gradient',
    );
  });

  it('blocks radial gradient text with a source locator', () => {
    const deck = validDeck();
    const object = deck.pages[0].objects[0];
    if (object.kind !== 'text') throw new Error('Expected the fixture object to be text.');
    object.paragraphs[0].runs[0].gradient = {
      kind: 'radial',
      center: { x: 0.5, y: 0.5 },
      radius: { x: 0.5, y: 0.5 },
      stops: [
        { offset: 0, color: color('FF0000') },
        { offset: 1, color: color('0000FF') },
      ],
    };
    const diagnostic = validateDeck(deck).find((entry) => entry.code === 'unsupported-radial-text');
    expect(diagnostic).toMatchObject({
      severity: 'error',
      page: 1,
      source: 'source.text/paragraph[0]/run[0]',
    });
  });

  it('blocks radial gradient shapes combined with native effects', () => {
    const deck = validDeck();
    deck.pages[0].objects = [
      {
        kind: 'shape',
        id: 'radial-effects',
        source: 'source.radial-effects',
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
        shadow: { ...color('000000'), x: 2, y: 2, blur: 4 },
        blur: 2,
      },
    ];
    const diagnostic = validateDeck(deck).find(
      (entry) => entry.code === 'unsupported-radial-effects',
    );
    expect(diagnostic).toMatchObject({
      severity: 'error',
      page: 1,
      source: 'source.radial-effects',
      suggestion: expect.stringContaining('Remove the native shadow'),
    });
  });

  it('rejects invalid base64 padding at the image boundary', () => {
    const deck = validDeck();
    deck.pages[0].objects = [
      {
        kind: 'image',
        id: 'invalid-image',
        source: 'source.invalid-image',
        order: 0,
        x: 0,
        y: 0,
        w: 144,
        h: 144,
        data: 'data:image/png;base64,A===',
        mime: 'image/png',
        assetId: 'invalid-image-asset',
      },
    ];
    expect(validateDeck(deck).find((entry) => entry.code === 'invalid-asset-data')).toMatchObject({
      severity: 'error',
      page: 1,
      source: 'source.invalid-image',
    });
    const image = deck.pages[0].objects[0];
    if (image.kind !== 'image') throw new Error('Expected the image fixture');
    // Large source assets must not exhaust the RegExp engine's call stack.
    image.data = `data:image/png;base64,${'AAAA'.repeat(1_048_576)}`;
    expect(validateDeck(deck).some((entry) => entry.code === 'invalid-asset-data')).toBe(false);
  });

  it('reports malformed gradient, path, effects and SVG extension values', () => {
    const deck = validDeck();
    deck.pages[0].objects = [
      {
        kind: 'shape',
        id: 'bad-shape',
        source: 'source.bad-shape',
        order: 0,
        x: 0,
        y: 0,
        w: 288,
        h: 144,
        geometry: 'path',
        path: [
          { type: 'move', x: 0, y: 0 },
          { type: 'line', x: 500, y: 500 },
          { type: 'cubic', x1: Number.NaN, y1: 0, x2: 0, y2: 0, x: 0, y: 0 },
          { type: 'close' },
        ],
        gradient: {
          kind: 'linear',
          angle: Number.NaN,
          center: { x: 0.5, y: 0.5 },
          stops: [
            { offset: 0.9, color: color('FF0000') },
            { offset: 0.1, color: color('00FF00') },
          ],
        },
        shadow: { ...color('000000'), x: Number.NaN, y: 0, blur: -1 },
        blur: Number.NaN,
      },
      {
        kind: 'image',
        id: 'bad-svg',
        source: 'source.bad-svg',
        order: 1,
        x: 288,
        y: 0,
        w: 144,
        h: 144,
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        mime: 'image/png',
        assetId: 'bad-svg',
        svgData: 'data:image/svg+xml;base64,not-base64!',
        opacity: 2,
      },
    ];
    const codes = validateDeck(deck).map((entry) => entry.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'invalid-gradient-angle',
        'unsupported-gradient-focus',
        'unordered-gradient-stops',
        'invalid-path-coordinate',
        'path-out-of-bounds',
        'invalid-shadow-offset',
        'invalid-shadow-blur',
        'invalid-blur',
        'invalid-svg-data',
        'invalid-image-opacity',
      ]),
    );
  });
});
