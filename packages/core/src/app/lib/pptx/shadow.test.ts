import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Decoration } from './effects';
import { contours } from './geometry';
import { shadowShapes } from './shadow';

vi.mock('./style', () => ({
  color: (value: string, opacity = 1) => ({ color: value, opacity }),
  px: (value: string) => Number.parseFloat(value) || 0,
}));

function supportsColor(_property: string, value: string): boolean {
  return /^(?:#[\da-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i.test(value);
}

function style(boxShadow: string, backgroundColor = 'rgb(255, 255, 255)'): CSSStyleDeclaration {
  return { boxShadow, backgroundColor } as CSSStyleDeclaration;
}

function area(shape: Decoration | undefined): number {
  return contours(shape ?? { geometry: 'rect', w: 0, h: 0 }).reduce(
    (total, polygon) =>
      total +
      Math.abs(
        polygon.reduce((sum, point, index) => {
          const next = polygon[(index + 1) % polygon.length];
          return sum + point.x * next.y - next.x * point.y;
        }, 0),
      ) /
        2,
    0,
  );
}

function contains(shape: Decoration, x: number, y: number): boolean {
  return contours(shape).some((polygon) => {
    const point = { x: x - shape.x, y: y - shape.y };
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i];
      const b = polygon[j];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    }
    return inside;
  });
}

function gaussianSamples(blur: number, count: number): { expansion: number; weight: number }[] {
  const sigma = blur / 2;
  return Array.from({ length: count }, (_, index) => {
    const z = -3 + ((index + 0.5) * 6) / count;
    return { expansion: z * sigma, weight: Math.exp((-z * z) / 2) };
  }).reverse();
}

beforeEach(() => {
  vi.stubGlobal('CSS', { supports: supportsColor });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('native shadow bands', () => {
  it('partitions a blurred shadow into disjoint rings with cumulative Gaussian opacity', () => {
    const box = { x: 200, y: 100, w: 100, h: 80 };
    const blur = 24;
    const bands = shadowShapes(style(`#000000 0 0 ${blur}px`), box, 1, [0, 0, 0, 0]).before;
    const samples = gaussianSamples(blur, 64);
    const total = samples.reduce((sum, sample) => sum + sample.weight, 0);

    expect(bands).toHaveLength(32);
    expect(bands.every((band) => band.fill?.opacity !== undefined)).toBe(true);
    expect(bands[0].fill?.opacity).toBeLessThan(bands.at(-1)?.fill?.opacity ?? 0);
    expect(bands.at(-1)?.fill?.opacity).toBeCloseTo(0.5, 8);
    expect(bands.reduce((sum, band) => sum + area(band), 0)).toBeCloseTo(
      (box.w + samples[0].expansion * 2) * (box.h + samples[0].expansion * 2) -
        (4 - Math.PI) * samples[0].expansion ** 2 -
        box.w * box.h,
      -1,
    );

    let cumulative = 0;
    bands.forEach((band, index) => {
      cumulative += samples[index].weight;
      expect(band.fill?.opacity).toBeCloseTo(cumulative / total, 8);
      const nextExpansion = samples[index + 1]?.expansion ?? 0;
      const midpoint = (samples[index].expansion + nextExpansion) / 2;
      if (midpoint > 0) {
        const pointX = box.x - midpoint;
        const pointY = box.y + box.h / 2;
        expect(bands.filter((candidate) => contains(candidate, pointX, pointY))).toHaveLength(1);
      }
    });
  });

  it('clips every band out of the original border box, including offset shadows', () => {
    const box = { x: 200, y: 100, w: 100, h: 80 };
    const bands = shadowShapes(
      style('#000000 12px 8px 24px', 'transparent'),
      box,
      1,
      [0, 0, 0, 0],
    ).before;
    expect(bands.length).toBeGreaterThan(0);
    expect(bands.some((band) => contains(band, box.x + box.w / 2, box.y + box.h / 2))).toBe(false);
  });

  it('keeps the solid zero-blur fast path and inset shadow representation', () => {
    const box = { x: 20, y: 30, w: 100, h: 80 };
    const solid = shadowShapes(style('#000000 8px 4px 0'), box, 1, [0, 0, 0, 0]);
    expect(solid.before).toHaveLength(1);
    expect(solid.before[0]).toMatchObject({ x: 28, y: 34, w: 100, h: 80, geometry: 'rect' });
    expect(solid.before[0].fill).toEqual({ color: '#000000', opacity: 1 });

    const inset = shadowShapes(style('#000000 0 0 0 8px inset'), box, 1, [0, 0, 0, 0]);
    expect(inset.after).toHaveLength(1);
    expect(inset.after[0].stroke).toMatchObject({ color: '#000000', opacity: 1, width: 8 });
  });

  it('uses 64 bands for expensive silhouettes and 128 for high-blur rectangles', () => {
    const box = { x: 0, y: 0, w: 120, h: 80 };
    expect(
      shadowShapes(style('#000000 0 0 24px 100px'), box, 1, [20, 20, 20, 20]).before,
    ).toHaveLength(64);
    expect(
      shadowShapes(style('#000000 0 0 100px 200px'), box, 1, [0, 0, 0, 0]).before,
    ).toHaveLength(128);
  });
});
