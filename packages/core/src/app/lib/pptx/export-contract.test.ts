import { describe, expect, it } from 'vitest';
import type { PptxSlideScene } from './scene';
import { readPptxXml, unzipPptx } from './test-utils';
import { writePptxFile } from './write-pptx';

const tinySvgDataUrl = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#b9472d"/></svg>',
).toString('base64')}`;

describe('PPTX export structural contract', () => {
  it('writes mixed editable and raster objects into inspectable pptx parts', async () => {
    const scene: PptxSlideScene = {
      width: 1920,
      height: 1080,
      diagnostics: [],
      nodes: [
        {
          kind: 'text',
          style: { fontFace: 'Georgia', fontSize: 72 },
          text: 'Native heading',
          x: 100,
          y: 80,
          w: 760,
          h: 110,
        },
        {
          kind: 'richText',
          runs: [
            { text: 'Rich ' },
            { style: { color: 'B9472D', italic: true }, text: 'editable' },
            { text: ' runs' },
          ],
          style: { fontFace: 'Aptos', fontSize: 34 },
          x: 100,
          y: 220,
          w: 760,
          h: 90,
        },
        {
          chartType: 'bar',
          h: 300,
          kind: 'chart',
          labels: ['Text', 'Images'],
          series: [{ color: '3F7D58', name: 'Score', values: [92, 76] }],
          style: { fontFace: 'Aptos', fontSize: 18 },
          title: 'Native chart',
          w: 620,
          x: 100,
          y: 360,
        },
        {
          fallbackText: 'E = m c^2',
          h: 90,
          kind: 'equation',
          latex: 'E = mc^2',
          style: { fontFace: 'Cambria Math', fontSize: 30 },
          w: 360,
          x: 780,
          y: 220,
        },
        {
          columns: ['Layer', 'Export'],
          h: 180,
          kind: 'table',
          rows: [['Text', 'Native']],
          style: { fontFace: 'Aptos', fontSize: 20 },
          w: 620,
          x: 780,
          y: 360,
        },
        {
          dataUrl: tinySvgDataUrl,
          h: 120,
          kind: 'raster',
          reason: 'contract test raster',
          w: 120,
          x: 780,
          y: 120,
        },
      ],
    };

    const blob = await writePptxFile({
      notes: ['Contract note'],
      slides: [scene],
      title: 'PPTX contract',
    });

    const zip = await unzipPptx(blob);
    const slideXml = await readPptxXml(blob, 'ppt/slides/slide1.xml');
    const chartPath = Object.keys(zip).find((path) => path.startsWith('ppt/charts/chart'));
    const mediaPaths = Object.keys(zip).filter((path) => path.startsWith('ppt/media/image'));

    expect(slideXml).toContain('Native heading');
    expect(slideXml).toContain('Rich ');
    expect(slideXml).toContain('editable');
    expect(slideXml).toContain('Layer');
    expect(slideXml).toContain('Native');
    expect(slideXml).toContain('<m:oMathPara>');
    expect(slideXml.match(/<a:r>/g)?.length).toBeGreaterThanOrEqual(4);
    expect(chartPath).toBeDefined();
    expect(await readPptxXml(blob, chartPath ?? '')).toContain('Native chart');
    expect(mediaPaths.length).toBeGreaterThanOrEqual(1);
    expect(await readPptxXml(blob, 'ppt/notesSlides/notesSlide1.xml')).toContain('Contract note');
  });
});
