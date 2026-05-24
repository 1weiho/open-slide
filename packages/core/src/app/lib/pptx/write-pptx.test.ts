import { describe, expect, it } from 'vitest';
import type { PptxSlideScene, PptxTextNode } from './scene';
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
    expect(await readPptxXml(blob, 'ppt/notesSlides/notesSlide1.xml')).toContain(
      'Presenter note',
    );
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
});
