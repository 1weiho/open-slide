import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createPptxBuffer, type PptxDeck, pxToEmu } from './exporter.ts';

function unzipXml(buffer: Uint8Array, name: string): string {
  const files = unzipSync(buffer);
  const file = files[name];
  if (!file) throw new Error(`Missing ${name}`);
  return strFromU8(file);
}

describe('editable PPTX exporter', () => {
  it('writes editable text and shapes instead of slide screenshots', () => {
    const deck: PptxDeck = {
      title: 'Editable deck',
      slides: [
        {
          background: '#0F172A',
          elements: [
            { type: 'rect', x: 96, y: 96, w: 480, h: 180, fill: '#22C55E', radius: 24 },
            {
              type: 'text',
              x: 128,
              y: 124,
              w: 900,
              h: 100,
              text: 'Hello editable PPTX',
              fontSize: 44,
              bold: true,
              color: '#FFFFFF',
            },
            { type: 'line', x: 128, y: 260, w: 640, h: 0, color: '#F97316', width: 4 },
          ],
        },
      ],
    };

    const pptx = createPptxBuffer(deck);
    const slideXml = unzipXml(pptx, 'ppt/slides/slide1.xml');

    expect(slideXml).toContain('Hello editable PPTX');
    expect(slideXml).toContain('<a:t>');
    expect(slideXml).toContain('<p:sp>');
    expect(slideXml).toContain('<a:solidFill>');
    expect(slideXml).not.toContain('<p:pic>');
    expect(slideXml).not.toContain('image/png');
  });

  it('maps Open Slide 1920x1080 pixels to PowerPoint EMUs', () => {
    expect(pxToEmu(0)).toBe(0);
    expect(pxToEmu(144)).toBe(914400);
    expect(pxToEmu(1920)).toBe(12192000);
    expect(pxToEmu(1080)).toBe(6858000);
  });
});
