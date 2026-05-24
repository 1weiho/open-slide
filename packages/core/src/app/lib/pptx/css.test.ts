import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fontWeightToBold,
  normalizeCssColor,
  parseCssPx,
  readElementRect,
  readElementTextStyle,
} from './css.ts';

function elementWithRect(rect: DOMRectInit): Element {
  return {
    getBoundingClientRect: () => ({
      bottom: (rect.y ?? 0) + (rect.height ?? 0),
      height: rect.height ?? 0,
      left: rect.x ?? 0,
      right: (rect.x ?? 0) + (rect.width ?? 0),
      toJSON: () => ({}),
      top: rect.y ?? 0,
      width: rect.width ?? 0,
      x: rect.x ?? 0,
      y: rect.y ?? 0,
    }),
  } as Element;
}

describe('normalizeCssColor', () => {
  it('normalizes rgb and hex colors for pptxgen', () => {
    expect(normalizeCssColor('rgb(255, 79, 26)')).toBe('FF4F1A');
    expect(normalizeCssColor('#0fa')).toBe('00FFAA');
    expect(normalizeCssColor('#00ffaa')).toBe('00FFAA');
  });

  it('drops transparent colors and unsupported color syntax', () => {
    expect(normalizeCssColor('transparent')).toBeUndefined();
    expect(normalizeCssColor('rgba(0, 0, 0, 0)')).toBeUndefined();
    expect(normalizeCssColor('linear-gradient(red, blue)')).toBeUndefined();
  });
});

describe('parseCssPx', () => {
  it('parses pixel values', () => {
    expect(parseCssPx('24px')).toBe(24);
    expect(parseCssPx(' 12.5px ')).toBe(12.5);
  });

  it('rejects non-pixel values', () => {
    expect(parseCssPx('normal')).toBeUndefined();
    expect(parseCssPx('1.5rem')).toBeUndefined();
  });
});

describe('fontWeightToBold', () => {
  it('maps bold keywords and numeric weights to booleans', () => {
    expect(fontWeightToBold('bold')).toBe(true);
    expect(fontWeightToBold('700')).toBe(true);
    expect(fontWeightToBold('600')).toBe(false);
    expect(fontWeightToBold('normal')).toBe(false);
  });
});

describe('readElementTextStyle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts supported computed text styles', () => {
    vi.stubGlobal('getComputedStyle', () => ({
      color: 'rgb(255, 79, 26)',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '48px',
      fontStyle: 'italic',
      fontWeight: '700',
      letterSpacing: '3px',
      lineHeight: '60px',
      textAlign: 'center',
    }));

    expect(readElementTextStyle(elementWithRect({}))).toEqual({
      align: 'center',
      bold: true,
      color: 'FF4F1A',
      fontFace: 'Georgia',
      fontSize: 48,
      italic: true,
      charSpacing: 3,
      lineHeight: 60,
    });
  });

  it('omits unsupported or unavailable styles', () => {
    vi.stubGlobal('getComputedStyle', () => ({
      color: 'linear-gradient(red, blue)',
      fontFamily: '',
      fontSize: 'large',
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 'normal',
      textAlign: 'start',
    }));

    expect(readElementTextStyle(elementWithRect({}))).toEqual({ bold: false });
  });

  it('uses PowerPoint-safe font fallbacks when reading text styles', () => {
    vi.stubGlobal('getComputedStyle', () => ({
      color: 'rgb(0, 0, 0)',
      fontFamily: '"Iowan Old Style", "Times New Roman", Georgia, serif',
      fontSize: '48px',
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: '60px',
      textAlign: 'left',
    }));

    expect(readElementTextStyle(elementWithRect({}))).toEqual(
      expect.objectContaining({
        fontFace: 'Times New Roman',
        fontFallbackWarning: 'Font fallback: Iowan Old Style -> Times New Roman',
      }),
    );
  });
});

describe('readElementRect', () => {
  it('reads a canvas-relative element rect', () => {
    const canvas = elementWithRect({ height: 1080, width: 1920, x: 100, y: 50 });
    const el = elementWithRect({ height: 200, width: 300, x: 140, y: 110 });

    expect(readElementRect(el, canvas)).toEqual({
      h: 200,
      w: 300,
      x: 40,
      y: 60,
    });
  });

  it('normalizes scaled canvas rects to canonical slide coordinates', () => {
    const canvas = elementWithRect({ height: 540, width: 960, x: 10, y: 20 });
    const el = elementWithRect({ height: 100, width: 150, x: 30, y: 50 });

    expect(readElementRect(el, canvas)).toEqual({
      h: 200,
      w: 300,
      x: 40,
      y: 60,
    });
  });

  it('returns null for elements without positive size', () => {
    const canvas = elementWithRect({ height: 1080, width: 1920, x: 0, y: 0 });
    const el = elementWithRect({ height: 0, width: 300, x: 0, y: 0 });

    expect(readElementRect(el, canvas)).toBeNull();
  });
});
