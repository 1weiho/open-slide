import { describe, expect, it } from 'vitest';
import type { PptxSlideScene } from './scene';
import { readPptxXml } from './test-utils';
import { writePptxFile } from './write-pptx';

describe('pptx equations', () => {
  it('writes equation fallback text as editable text until native OfficeMath lands', async () => {
    const scene: PptxSlideScene = {
      width: 1920,
      height: 1080,
      diagnostics: [],
      nodes: [
        {
          decision: {
            kind: 'native-reduced',
            reason:
              'Equation exported as editable fallback text; native OfficeMath is not implemented',
          },
          fallbackText: 'integral from 0 to 1 of x squared d x equals one third',
          kind: 'equation',
          latex: '\\int_0^1 x^2 dx = 1/3',
          style: { fontFace: 'Cambria', fontSize: 42 },
          x: 100,
          y: 100,
          w: 900,
          h: 120,
        },
      ],
    };

    const blob = await writePptxFile({ slides: [scene], title: 'Equation test' });

    expect(await readPptxXml(blob, 'ppt/slides/slide1.xml')).toContain(
      'integral from 0 to 1',
    );
  });
});
