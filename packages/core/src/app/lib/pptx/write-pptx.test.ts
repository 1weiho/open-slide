import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { PptxSlideScene, PptxTextNode } from './scene';
import { writePptxFile } from './write-pptx';

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

function unzipBlob(blob: Blob): Promise<Record<string, Uint8Array>> {
  return blob.arrayBuffer().then((buffer) => unzipSync(new Uint8Array(buffer)));
}

describe('writePptxFile', () => {
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

    const zip = await unzipBlob(blob);
    expect(zip['ppt/slides/slide1.xml']).toBeDefined();
    expect(strFromU8(zip['ppt/slides/slide1.xml'])).toContain('Editable PPTX text');
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

    const zip = await unzipBlob(blob);
    expect(zip['ppt/notesSlides/notesSlide1.xml']).toBeDefined();
    expect(strFromU8(zip['ppt/notesSlides/notesSlide1.xml'])).toContain('Presenter note');
  });
});
