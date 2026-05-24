import { describe, expect, it } from 'vitest';
import type { PptxExportDecision } from './decision';

describe('pptx export decisions', () => {
  it('represents native, reduced, raster, and omitted decisions', () => {
    const decisions: PptxExportDecision[] = [
      { kind: 'native' },
      { kind: 'native-reduced', reason: 'font fallback' },
      { kind: 'raster', reason: 'unsupported filter' },
      { kind: 'omitted', reason: 'unsupported media' },
    ];

    expect(decisions.map((decision) => decision.kind)).toEqual([
      'native',
      'native-reduced',
      'raster',
      'omitted',
    ]);
  });
});
