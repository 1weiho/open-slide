import { describe, expect, it } from 'vitest';
import type { PptxRichTextNode, PptxSlideScene, PptxTextNode } from './scene';
import { readPptxXml, unzipPptx } from './test-utils';
import { pxToPt, writePptxFile } from './write-pptx';

const textNode: PptxTextNode = {
  kind: 'text',
  x: 120,
  y: 160,
  w: 640,
  h: 120,
  text: 'Editable PPTX text',
  style: {
    color: '243B53',
    fontFace: 'Arial',
    fontSize: 48,
    bold: true,
    align: 'center',
    valign: 'middle',
  },
};

const richTextNode: PptxRichTextNode = {
  kind: 'richText',
  x: 120,
  y: 320,
  w: 760,
  h: 120,
  style: {
    color: '171512',
    fontFace: 'Georgia',
    fontSize: 40,
  },
  runs: [
    { text: 'Hello ' },
    { text: 'accent', style: { color: 'B34A2A', italic: true } },
    { text: ' text' },
  ],
};

describe('writePptxFile', () => {
  it('converts browser pixels to PowerPoint points for text and stroke APIs', () => {
    expect(pxToPt(48)).toBe(36);
    expect(pxToPt(undefined)).toBeUndefined();
  });

  it('exports a pptx blob containing slide XML and text', async () => {
    const slide: PptxSlideScene = {
      width: 1920,
      height: 1080,
      nodes: [textNode],
      diagnostics: [],
    };

    const blob = await writePptxFile({ title: 'Test', slides: [slide] });

    expect(blob.type).toContain('presentation');
    expect(blob.size).toBeGreaterThan(0);

    const zip = await unzipPptx(blob);
    expect(zip['ppt/slides/slide1.xml']).toBeDefined();
    expect(await readPptxXml(blob, 'ppt/slides/slide1.xml')).toContain('Editable PPTX text');
  });

  it('writes speaker notes when notes are provided', async () => {
    const blob = await writePptxFile({
      title: 'Notes test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [textNode],
          diagnostics: [],
        },
      ],
      notes: ['Presenter note'],
    });

    const zip = await unzipPptx(blob);
    expect(zip['ppt/notesSlides/notesSlide1.xml']).toBeDefined();
    expect(await readPptxXml(blob, 'ppt/notesSlides/notesSlide1.xml')).toContain('Presenter note');
  });

  it('exports rich text nodes as editable text runs', async () => {
    const blob = await writePptxFile({
      title: 'Rich text test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [richTextNode],
          diagnostics: [],
        },
      ],
    });

    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');
    expect(xml).toContain('Hello ');
    expect(xml).toContain('accent');
    expect(xml).toContain(' text');
  });

  it('exports preserved rich text lines as separate editable text boxes', async () => {
    const blob = await writePptxFile({
      title: 'Measured rich text lines test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              h: 220,
              kind: 'richText',
              lineBreakPolicy: 'preserve-browser-lines',
              lines: [
                {
                  h: 96,
                  runs: [{ text: 'Not autocomplete.' }],
                  text: 'Not autocomplete.',
                  w: 1200,
                  x: 100,
                  y: 120,
                },
                {
                  h: 96,
                  runs: [
                    { text: 'An ' },
                    { text: 'agent', style: { color: 'B34A2A', italic: true } },
                    { text: ' that does the work.' },
                  ],
                  text: 'An agent that does the work.',
                  w: 1200,
                  x: 100,
                  y: 226,
                },
              ],
              runs: [
                { text: 'Not autocomplete.\nAn ' },
                { text: 'agent', style: { color: 'B34A2A', italic: true } },
                { text: ' that does the work.' },
              ],
              style: { fontFace: 'Georgia', fontSize: 72, lineHeight: 96 },
              w: 1200,
              x: 100,
              y: 120,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');
    expect(xml).toContain('Not autocomplete.');
    expect(xml).toContain('agent');
    expect(xml.match(/name="Text/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('exports preserved browser text lines as separate editable text boxes', async () => {
    const blob = await writePptxFile({
      title: 'Measured lines test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              h: 120,
              kind: 'text',
              lineBreakPolicy: 'preserve-browser-lines',
              lines: [
                { h: 42, text: 'Browser line one', w: 360, x: 100, y: 120 },
                { h: 42, text: 'Browser line two', w: 370, x: 100, y: 172 },
              ],
              style: { fontFace: 'Georgia', fontSize: 36, lineHeight: 48 },
              text: 'Browser line one\nBrowser line two',
              w: 520,
              x: 100,
              y: 120,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');
    expect(xml).toContain('Browser line one');
    expect(xml).toContain('Browser line two');
    expect(xml.match(/name="Text/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('embeds inline SVG image fallbacks', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
    ).toString('base64');
    const blob = await writePptxFile({
      title: 'SVG test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              h: 100,
              kind: 'image',
              src: `data:image/svg+xml;base64,${svg}`,
              w: 100,
              x: 0,
              y: 0,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const zip = await unzipPptx(blob);
    expect(Object.keys(zip).some((name) => name.startsWith('ppt/media/image'))).toBe(true);
  });

  it('embeds raster nodes as slide media', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="blue"/></svg>',
    ).toString('base64');
    const blob = await writePptxFile({
      title: 'Raster test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              dataUrl: `data:image/svg+xml;base64,${svg}`,
              h: 100,
              kind: 'raster',
              reason: 'explicit test raster',
              w: 100,
              x: 0,
              y: 0,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const zip = await unzipPptx(blob);
    expect(Object.keys(zip).some((name) => name.startsWith('ppt/media/image'))).toBe(true);
  });

  it('exports table nodes as editable table XML', async () => {
    const blob = await writePptxFile({
      title: 'Table test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              columns: ['Metric', 'Value'],
              h: 240,
              kind: 'table',
              rows: [['Text', 'Editable']],
              style: { fontFace: 'Aptos', fontSize: 24 },
              w: 640,
              x: 80,
              y: 120,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const xml = await readPptxXml(blob, 'ppt/slides/slide1.xml');
    expect(xml).toContain('Metric');
    expect(xml).toContain('Editable');
  });

  it('exports chart nodes as editable chart parts', async () => {
    const blob = await writePptxFile({
      title: 'Chart test',
      slides: [
        {
          width: 1920,
          height: 1080,
          nodes: [
            {
              chartType: 'bar',
              h: 360,
              kind: 'chart',
              labels: ['Text', 'Images'],
              series: [{ color: '3F7D58', name: 'Score', values: [92, 76] }],
              style: { fontFace: 'Aptos', fontSize: 18 },
              title: 'Editability score',
              w: 720,
              x: 80,
              y: 120,
            },
          ],
          diagnostics: [],
        },
      ],
    });

    const zip = await unzipPptx(blob);
    const chartPath = Object.keys(zip).find((name) => name.startsWith('ppt/charts/chart'));
    expect(chartPath).toBeDefined();
    expect(await readPptxXml(blob, chartPath ?? '')).toContain('Editability score');
  });
});
