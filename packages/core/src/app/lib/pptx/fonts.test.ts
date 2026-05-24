import { describe, expect, it } from 'vitest';
import { parseFontFamilies, resolvePptxFontFace } from './fonts';

describe('pptx font fallback policy', () => {
  it('parses quoted CSS font stacks', () => {
    expect(parseFontFamilies('"Iowan Old Style", "Times New Roman", Georgia, serif')).toEqual([
      'Iowan Old Style',
      'Times New Roman',
      'Georgia',
      'serif',
    ]);
  });

  it('keeps PowerPoint-safe fonts', () => {
    expect(resolvePptxFontFace('Georgia, serif')).toEqual({ fontFace: 'Georgia' });
  });

  it('resolves editorial serif stacks to a PowerPoint-safe fallback', () => {
    expect(
      resolvePptxFontFace('"Iowan Old Style", "Times New Roman", Georgia, serif'),
    ).toEqual({
      fontFace: 'Times New Roman',
      warning: 'Font fallback: Iowan Old Style -> Times New Roman',
    });
  });

  it('resolves web sans stacks to PowerPoint-safe sans fonts', () => {
    expect(resolvePptxFontFace('Inter, Arial, sans-serif')).toEqual({
      fontFace: 'Arial',
      warning: 'Font fallback: Inter -> Arial',
    });
  });

  it('resolves generic mono stacks to PowerPoint-safe mono fonts', () => {
    expect(resolvePptxFontFace('ui-monospace, "SF Mono", Menlo, monospace')).toEqual({
      fontFace: 'Consolas',
      warning: 'Font fallback: ui-monospace -> Consolas',
    });
  });
});
