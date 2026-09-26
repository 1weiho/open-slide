import { describe, expect, it } from 'vitest';
import { type Decoration, sampleGradient } from './effects';
import { contours, type Point } from './geometry';
import { radialFillShapes } from './radial';

function contains(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}

describe('native radial decoration geometry', () => {
  it('preserves CSS focus, elliptical radius and alpha without stacked-opacity loss', () => {
    const shape: Decoration = {
      kind: 'shape',
      geometry: 'rect',
      x: 100,
      y: 60,
      w: 800,
      h: 500,
      gradient: {
        kind: 'radial',
        center: { x: 0.82, y: 0.18 },
        radius: { x: 0.9, y: 1.4 },
        stops: [
          { offset: 0, color: { color: '00FFCC', opacity: 0.3 } },
          { offset: 0.65, color: { color: '000000', opacity: 0 } },
          { offset: 1, color: { color: '000000', opacity: 0 } },
        ],
      },
    };
    const gradient = shape.gradient;
    if (!gradient) throw new Error('Expected gradient fixture.');
    const layers = radialFillShapes(shape);
    expect(layers.length).toBeGreaterThan(10);
    expect(layers.every((layer) => !layer.gradient && layer.geometry === 'path')).toBe(true);
    for (const p of [
      { x: 655.9, y: 90.1 },
      { x: 500, y: 140 },
      { x: 80, y: 400 },
    ]) {
      const painted = layers.filter((layer) =>
        contours(layer).some((polygon) => contains(p, polygon)),
      );
      expect(painted.length).toBeLessThanOrEqual(1);
      const radius = Math.hypot((p.x - 656) / 720, (p.y - 90) / 700);
      expect(painted[0]?.fill?.opacity ?? 0).toBeCloseTo(
        sampleGradient(gradient, radius).opacity,
        2,
      );
    }
  });

  it('rejects native radial shadows while retaining the supported blur approximation', () => {
    const shape: Decoration = {
      kind: 'shape',
      geometry: 'rect',
      x: 0,
      y: 0,
      w: 240,
      h: 120,
      gradient: {
        kind: 'radial',
        center: { x: 0.5, y: 0.5 },
        radius: { x: 0.5, y: 0.5 },
        stops: [
          { offset: 0, color: { color: 'FFFFFF', opacity: 1 } },
          { offset: 1, color: { color: '000000', opacity: 0 } },
        ],
      },
    };
    expect(() =>
      radialFillShapes({
        ...shape,
        shadow: { color: '000000', opacity: 1, x: 0, y: 0, blur: 4 },
      }),
    ).toThrow(/cannot be combined with native shape shadows/);
    expect(radialFillShapes({ ...shape, blur: 4 }).every((layer) => layer.blur === 4)).toBe(true);
  });
});
