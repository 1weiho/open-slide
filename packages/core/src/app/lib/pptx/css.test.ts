import { describe, expect, it } from 'vitest';
import {
  applyTextTransform,
  decompose,
  geometryFor,
  gradientLineLength,
  multiply,
  normalizeRadii,
  parseBlurPx,
  parseColor,
  parseCornerRadius,
  parseFontFamilies,
  parseLinearGradient,
  parseShadows,
  parseTransform,
  splitTopLevel,
  toHex,
  transformedBounds,
  translation,
} from './css';

describe('parseColor', () => {
  it('parses legacy and modern rgb syntax', () => {
    expect(parseColor('rgb(255, 0, 128)')).toEqual({ r: 255, g: 0, b: 128, a: 1 });
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor('rgb(255 0 0 / 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });
  it('parses hex forms', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('#6d4cff')).toEqual({ r: 109, g: 76, b: 255, a: 1 });
    expect(parseColor('#00000080')?.a).toBeCloseTo(0.502, 2);
  });
  it('rejects colours it cannot resolve', () => {
    expect(parseColor('oklch(0.62 0.18 250)')).toBeNull();
    expect(parseColor('red')).toBeNull();
  });
  it('formats hex', () => {
    expect(toHex({ r: 109, g: 76, b: 255, a: 1 })).toBe('6D4CFF');
  });
});

describe('splitTopLevel', () => {
  it('ignores separators inside parentheses and quotes', () => {
    expect(splitTopLevel('rgba(1, 2, 3, 0.5) 0px 4px, url("a,b") 1px')).toEqual([
      'rgba(1, 2, 3, 0.5) 0px 4px',
      'url("a,b") 1px',
    ]);
  });
});

describe('transforms', () => {
  it('parses matrix and flat matrix3d', () => {
    expect(parseTransform('none')).toEqual([1, 0, 0, 1, 0, 0]);
    expect(parseTransform('matrix(1, 0, 0, 1, -50, -25)')).toEqual([1, 0, 0, 1, -50, -25]);
    expect(parseTransform('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1)')).toEqual([
      1, 0, 0, 1, 10, 20,
    ]);
    expect(
      parseTransform('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0.001, 0, 0, 0, 1)'),
    ).toBeNull();
  });
  it('decomposes rotation and scale', () => {
    const rotated = parseTransform('matrix(0.984808, 0.173648, -0.173648, 0.984808, 0, 0)');
    const d = rotated ? decompose(rotated) : null;
    expect(d?.rotationDeg).toBeCloseTo(10, 3);
    expect(d?.scaleX).toBeCloseTo(1, 5);
    expect(d?.scaleY).toBeCloseTo(1, 5);
    expect(d?.skewed).toBe(false);
    expect(d?.flipV).toBe(false);
    const s = decompose([2, 0, 0, -3, 0, 0]);
    expect(s).toMatchObject({ scaleX: 2, scaleY: 3, flipV: true, skewed: false });
    expect(decompose([1, 0, 1, 1, 0, 0])?.skewed).toBe(true);
  });
  it('composes translations and computes bounds', () => {
    const m = multiply(translation(10, 20), [2, 0, 0, 2, 0, 0]);
    expect(transformedBounds(m, 0, 0, 10, 10)).toEqual({ x: 10, y: 20, w: 20, h: 20 });
  });
});

describe('parseLinearGradient', () => {
  it('parses angle, stops and interpolates missing positions', () => {
    const g = parseLinearGradient(
      'linear-gradient(135deg, rgba(120, 120, 130, 0.06) 0%, rgb(0, 0, 0), rgba(120, 120, 130, 0.06) 100%)',
      100,
      100,
    );
    expect(g?.angleDeg).toBe(135);
    expect(g?.stops.map((s) => s.pos)).toEqual([0, 0.5, 1]);
  });
  it('defaults to top-to-bottom and resolves side keywords', () => {
    expect(
      parseLinearGradient('linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))', 10, 10)?.angleDeg,
    ).toBe(180);
    expect(
      parseLinearGradient('linear-gradient(to right, rgb(0, 0, 0), rgb(255, 255, 255))', 10, 10)
        ?.angleDeg,
    ).toBe(90);
    const corner = parseLinearGradient(
      'linear-gradient(to bottom right, rgb(0, 0, 0), rgb(255, 255, 255))',
      100,
      100,
    );
    expect(corner?.angleDeg).toBeCloseTo(135, 5);
  });
  it('converts px stop positions against the gradient line', () => {
    const g = parseLinearGradient(
      'linear-gradient(to right, rgb(0, 0, 0) 25px, rgb(255, 255, 255) 75px)',
      100,
      50,
    );
    expect(g?.stops.map((s) => s.pos)).toEqual([0.25, 0.75]);
    expect(gradientLineLength(90, 100, 50)).toBeCloseTo(100);
  });
  it('rejects unsupported colour syntax and non-linear gradients', () => {
    expect(
      parseLinearGradient('linear-gradient(oklch(0.6 0.1 20), rgb(0, 0, 0))', 10, 10),
    ).toBeNull();
    expect(parseLinearGradient('radial-gradient(rgb(0, 0, 0), rgb(1, 1, 1))', 10, 10)).toBeNull();
  });
});

describe('parseShadows', () => {
  it('parses Chrome computed box-shadow values', () => {
    const s = parseShadows(
      'rgba(0, 0, 0, 0.25) 0px 10px 30px 0px, rgb(255, 0, 0) 0px 0px 0px 2px inset',
    );
    expect(s).toHaveLength(2);
    expect(s[0]).toMatchObject({ x: 0, y: 10, blur: 30, spread: 0, inset: false });
    expect(s[1]).toMatchObject({ spread: 2, inset: true });
    expect(parseShadows('none')).toEqual([]);
  });
});

describe('radii', () => {
  it('parses px, percentage and elliptical corners', () => {
    expect(parseCornerRadius('12px', 100, 50)).toEqual({ x: 12, y: 12 });
    expect(parseCornerRadius('50%', 100, 50)).toEqual({ x: 50, y: 25 });
    expect(parseCornerRadius('10px 20px', 100, 50)).toEqual({ x: 10, y: 20 });
  });
  it('scales overlapping radii down like CSS', () => {
    const r = normalizeRadii(
      [
        { x: 80, y: 80 },
        { x: 80, y: 80 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      100,
      100,
    );
    expect(r[0].x).toBeCloseTo(50);
    expect(r[1].x).toBeCloseTo(50);
  });
});

describe('misc', () => {
  it('sums blur radii and parses families', () => {
    expect(parseBlurPx('blur(40px) brightness(1.2) blur(10px)')).toBe(50);
    expect(parseBlurPx('none')).toBe(0);
    expect(parseFontFamilies('"Inter", -apple-system, \'JetBrains Mono\', monospace')).toEqual([
      'Inter',
      '-apple-system',
      'JetBrains Mono',
      'monospace',
    ]);
  });
  it('applies text-transform', () => {
    expect(applyTextTransform('hello world', 'uppercase')).toBe('HELLO WORLD');
    expect(applyTextTransform('hello world', 'capitalize')).toBe('Hello World');
    expect(applyTextTransform('Hello', 'none')).toBe('Hello');
  });
});

describe('geometryFor', () => {
  const uniform = (x: number, y = x): Parameters<typeof geometryFor>[0] => [
    { x, y },
    { x, y },
    { x, y },
    { x, y },
  ];
  it('keeps a pill as a rounded rectangle', () => {
    const radii = normalizeRadii(uniform(9999), 540, 56);
    expect(geometryFor(radii, 540, 56)).toEqual({ kind: 'roundRect', radius: 28 });
  });
  it('treats a fully rounded square as an ellipse', () => {
    const radii = normalizeRadii(uniform(9999), 64, 64);
    expect(geometryFor(radii, 64, 64)).toEqual({ kind: 'ellipse' });
  });
  it('treats 50% corners on a wide box as an ellipse', () => {
    expect(geometryFor(uniform(100, 30), 200, 60)).toEqual({ kind: 'ellipse' });
  });
  it('maps small uniform corners to a rounded rectangle', () => {
    expect(geometryFor(uniform(12), 300, 80)).toEqual({ kind: 'roundRect', radius: 12 });
  });
  it('falls back to a custom path for mixed or elliptical corners', () => {
    const mixed = uniform(12);
    mixed[2] = { x: 0, y: 0 };
    expect(geometryFor(mixed, 300, 80).kind).toBe('custom');
    expect(geometryFor(uniform(40, 10), 300, 80).kind).toBe('custom');
  });
  it('maps no radius to a plain rectangle', () => {
    expect(geometryFor(uniform(0), 300, 80)).toEqual({ kind: 'rect' });
  });
});
