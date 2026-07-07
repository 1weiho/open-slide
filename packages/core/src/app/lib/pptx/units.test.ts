import { describe, expect, it } from 'vitest';
import {
  alphaToTransparency,
  isBold,
  lineSpacingMultiple,
  mapTextAlign,
  parseBoxShadow,
  parseCssColor,
  pxToIn,
  pxToPt,
  rotationDeg,
  transformNeedsRaster,
} from './units';

describe('pxToIn', () => {
  it('converts px to inches at the CSS 96dpi reference', () => {
    expect(pxToIn(96)).toBe(1);
    expect(pxToIn(1920)).toBe(20);
    expect(pxToIn(0)).toBe(0);
  });
});

describe('pxToPt', () => {
  it('converts px to points (1px = 0.75pt at 96dpi)', () => {
    expect(pxToPt(16)).toBe(12);
    expect(pxToPt(40)).toBe(30);
  });
});

describe('parseCssColor', () => {
  it('parses an rgb() string into uppercase hex with full alpha', () => {
    expect(parseCssColor('rgb(255, 0, 0)')).toEqual({ hex: 'FF0000', alpha: 1 });
  });

  it('parses an rgba() string and keeps the alpha channel', () => {
    expect(parseCssColor('rgba(0, 128, 255, 0.5)')).toEqual({ hex: '0080FF', alpha: 0.5 });
  });

  it('treats a fully transparent color as alpha 0', () => {
    expect(parseCssColor('rgba(0, 0, 0, 0)')).toEqual({ hex: '000000', alpha: 0 });
  });

  it('returns null for a non-color value', () => {
    expect(parseCssColor('none')).toBeNull();
    expect(parseCssColor('')).toBeNull();
  });

  it('parses rgb directly without invoking the normalizer', () => {
    let called = false;
    const normalize = () => {
      called = true;
      return null;
    };
    expect(parseCssColor('rgb(10, 20, 30)', normalize)).toEqual({ hex: '0A141E', alpha: 1 });
    expect(called).toBe(false);
  });

  it('falls back to the normalizer for modern color syntax (e.g. oklch)', () => {
    // Browser getComputedStyle preserves oklch()/lab()/color() — the normalizer
    // (canvas round-trip in the browser) turns it back into rgb.
    const normalize = (css: string) => (css.startsWith('oklch') ? 'rgb(37, 99, 235)' : null);
    expect(parseCssColor('oklch(0.55 0.2 264)', normalize)).toEqual({ hex: '2563EB', alpha: 1 });
  });

  it('returns null for modern color syntax when no normalizer can resolve it', () => {
    expect(parseCssColor('oklch(0.55 0.2 264)', () => null)).toBeNull();
  });
});

describe('isBold', () => {
  it('treats numeric weight >= 600 as bold', () => {
    expect(isBold('600')).toBe(true);
    expect(isBold('700')).toBe(true);
    expect(isBold('400')).toBe(false);
    expect(isBold('100')).toBe(false);
  });

  it('handles keyword weights', () => {
    expect(isBold('bold')).toBe(true);
    expect(isBold('normal')).toBe(false);
  });
});

describe('mapTextAlign', () => {
  it('maps CSS text-align to PptxGenJS alignment', () => {
    expect(mapTextAlign('left')).toBe('left');
    expect(mapTextAlign('center')).toBe('center');
    expect(mapTextAlign('right')).toBe('right');
    expect(mapTextAlign('justify')).toBe('justify');
  });

  it('falls back to left for start/unknown values', () => {
    expect(mapTextAlign('start')).toBe('left');
    expect(mapTextAlign('-webkit-auto')).toBe('left');
  });
});

describe('lineSpacingMultiple', () => {
  it('returns the ratio of line-height to font-size', () => {
    expect(lineSpacingMultiple(60, 40)).toBeCloseTo(1.5);
  });

  it('returns null when font-size is zero', () => {
    expect(lineSpacingMultiple(60, 0)).toBeNull();
  });
});

describe('rotationDeg', () => {
  it('returns 0 for no transform', () => {
    expect(rotationDeg('none')).toBe(0);
  });

  it('recovers the rotation angle from a 2D matrix', () => {
    // rotate(90deg) => matrix(0, 1, -1, 0, 0, 0)
    expect(rotationDeg('matrix(0, 1, -1, 0, 0, 0)')).toBeCloseTo(90);
    // rotate(45deg)
    const c = Math.SQRT1_2;
    expect(rotationDeg(`matrix(${c}, ${c}, ${-c}, ${c}, 0, 0)`)).toBeCloseTo(45);
  });

  it('normalizes negative rotations into 0..360', () => {
    // rotate(-90deg) => matrix(0, -1, 1, 0, 0, 0)
    expect(rotationDeg('matrix(0, -1, 1, 0, 0, 0)')).toBeCloseTo(270);
  });
});

describe('transformNeedsRaster', () => {
  it('is false for none, pure translation, and pure rotation', () => {
    expect(transformNeedsRaster('none')).toBe(false);
    expect(transformNeedsRaster('matrix(1, 0, 0, 1, 30, 50)')).toBe(false);
    expect(transformNeedsRaster('matrix(0, 1, -1, 0, 0, 0)')).toBe(false);
  });

  it('is true for 3D transforms', () => {
    expect(transformNeedsRaster('matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)')).toBe(true);
  });

  it('is true for skew (non-orthogonal axes)', () => {
    // skewX(20deg) => matrix(1, 0, tan20, 1, 0, 0)
    expect(transformNeedsRaster('matrix(1, 0, 0.364, 1, 0, 0)')).toBe(true);
  });

  it('is true for non-uniform scale', () => {
    expect(transformNeedsRaster('matrix(2, 0, 0, 3, 0, 0)')).toBe(true);
  });
});

describe('alphaToTransparency', () => {
  it('converts an alpha channel to a PptxGenJS transparency percent', () => {
    expect(alphaToTransparency(1)).toBe(0);
    expect(alphaToTransparency(0)).toBe(100);
    expect(alphaToTransparency(0.5)).toBe(50);
  });
});

describe('parseBoxShadow', () => {
  it('returns null for none / empty', () => {
    expect(parseBoxShadow('none')).toBeNull();
    expect(parseBoxShadow('')).toBeNull();
  });

  it('parses color + offset + blur (spread ignored)', () => {
    expect(parseBoxShadow('rgba(0, 0, 0, 0.25) 0px 8px 24px 0px')).toEqual({
      hex: '000000',
      alpha: 0.25,
      offX: 0,
      offY: 8,
      blur: 24,
    });
  });

  it('defaults blur to 0 when only two lengths are given', () => {
    expect(parseBoxShadow('rgb(10, 20, 30) 4px 6px')).toEqual({
      hex: '0A141E',
      alpha: 1,
      offX: 4,
      offY: 6,
      blur: 0,
    });
  });

  it('skips inset shadows and takes the first outer one', () => {
    const v = 'rgba(0,0,0,0.3) 0px 2px 4px 0px inset, rgba(0,0,0,0.5) 0px 10px 30px 0px';
    expect(parseBoxShadow(v)).toEqual({ hex: '000000', alpha: 0.5, offX: 0, offY: 10, blur: 30 });
  });

  it('returns null when every shadow is inset', () => {
    expect(parseBoxShadow('rgba(0,0,0,0.3) 0px 2px 4px inset')).toBeNull();
  });
});
