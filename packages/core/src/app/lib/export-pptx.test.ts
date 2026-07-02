import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildEditablePptx } from './export-pptx-editable';

const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function unzip(bytes: Uint8Array): Record<string, Uint8Array> {
  return unzipSync(bytes);
}

function xml(files: Record<string, Uint8Array>, path: string): string {
  return strFromU8(files[path]);
}

describe('editable PPTX OOXML', () => {
  it('writes text, shape, and image nodes as editable PowerPoint objects', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 80,
            y: 96,
            w: 420,
            h: 150,
            radius: 24,
            fill: '#f8fafc',
            stroke: { color: '#0f172a', width: 4 },
          },
          {
            kind: 'text',
            x: 120,
            y: 132,
            w: 340,
            h: 84,
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#111827',
            align: 'center',
            paragraphs: [
              [
                { text: 'Hello ', bold: true },
                { text: 'world', italic: true, color: '#ef4444' },
              ],
            ],
          },
          {
            kind: 'image',
            x: 560,
            y: 150,
            w: 220,
            h: 120,
            alt: 'Logo',
            mime: 'image/png',
            data: pngBytes,
          },
        ],
      },
    ]);

    const files = unzip(bytes);
    const slide = xml(files, 'ppt/slides/slide1.xml');
    const rels = xml(files, 'ppt/slides/_rels/slide1.xml.rels');

    expect(slide).toContain('<p:sp>');
    expect(slide).toContain('name="Text 3"');
    expect(slide).toContain('<a:t>Hello </a:t>');
    expect(slide).toContain('<a:t>world</a:t>');
    expect(slide).toContain('b="1"');
    expect(slide).toContain('i="1"');
    expect(slide).toContain('<p:pic>');
    expect(slide).toContain('name="Logo"');
    expect(slide).not.toContain('name="Slide"');
    expect(rels).toContain('Target="../media/image1.png"');
    expect(files['ppt/media/image1.png']).toEqual(pngBytes);
  });

  it('writes linear gradients as vector gradient fills', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 0,
            y: 0,
            w: 1920,
            h: 1080,
            fill: {
              kind: 'linearGradient',
              angle: 90,
              stops: [
                { color: '#ff0000', position: 0 },
                { color: '#0000ff', position: 1 },
              ],
            },
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:gradFill rotWithShape="1">');
    expect(slide).toContain('<a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs>');
    expect(slide).toContain('<a:gs pos="100000"><a:srgbClr val="0000FF"/></a:gs>');
    expect(slide).toContain('<a:lin ang="5400000" scaled="0"/>');
  });

  it('writes tables as native PowerPoint table objects', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'table',
            x: 100,
            y: 120,
            w: 600,
            h: 180,
            rows: [
              [
                { text: 'Name', bold: true, fill: '#e2e8f0' },
                { text: 'Count', bold: true, fill: '#e2e8f0' },
              ],
              [{ text: 'Slides' }, { text: '12' }],
            ],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<p:graphicFrame>');
    expect(slide).toContain('<a:tbl>');
    expect(slide).toContain('<a:t>Name</a:t>');
    expect(slide).toContain('<a:t>Count</a:t>');
    expect(slide).toContain('<a:t>Slides</a:t>');
    expect(slide).toContain('<a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill>');
  });
});
