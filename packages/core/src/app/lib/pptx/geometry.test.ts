import { describe, expect, it } from 'vitest';
import { borderPaths } from './border-path';
import { type Decoration, roundPath } from './effects';
import { subtractShape } from './geometry';

function rectangle(x: number, y: number, w: number, h: number): Decoration {
  return { kind: 'shape', geometry: 'rect', x, y, w, h, fill: { color: '000000', opacity: 0.1 } };
}
function area(shape: Decoration | undefined): number {
  let total = 0;
  let points: { x: number; y: number }[] = [];
  for (const command of shape?.path ?? []) {
    if (command.type === 'move') points = [command];
    if (command.type === 'line') points.push(command);
    if (command.type === 'close')
      total +=
        Math.abs(
          points.reduce((sum, a, i) => {
            const b = points[(i + 1) % points.length];
            return sum + a.x * b.y - b.x * a.y;
          }, 0),
        ) / 2;
  }
  return total;
}
describe('outer shadow border-box exclusion', () => {
  it('gives a bottom-only border its full rounded corners', () => {
    const bottom = borderPaths(60, 16, [0, 0, 999, 999], [0, 0, 6, 0])[2];
    expect(bottom[0]).toEqual({ type: 'move', x: 60, y: 0 });
    expect(bottom[bottom.length - 1]).toMatchObject({ type: 'cubic', x: 0, y: 0 });
  });
  it('removes the transparent interior without adding paint outside the shadow silhouette', () => {
    const silhouette = rectangle(0, 18, 100, 80);
    const clipped = subtractShape(silhouette, rectangle(0, 0, 100, 80));
    expect(area(clipped)).toBeCloseTo(1800);
    for (const command of clipped?.path ?? []) {
      if ('x' in command) expect(command.y + silhouette.y).toBeGreaterThanOrEqual(80);
    }
    expect(subtractShape(silhouette, rectangle(-20, 0, 140, 140))).toBeUndefined();
    expect(area(subtractShape(silhouette, rectangle(300, 300, 20, 20)))).toBeCloseTo(8000);
  });
  it('preserves a rounded perimeter and an elliptical perimeter as editable paths', () => {
    const round = {
      ...rectangle(0, 0, 120, 80),
      geometry: 'path' as const,
      path: roundPath(120, 80, [12, 12, 12, 12]),
    };
    const hole = {
      ...rectangle(10, 10, 100, 60),
      geometry: 'path' as const,
      path: roundPath(100, 60, [2, 2, 2, 2]),
    };
    expect(area(subtractShape(round, hole))).toBeCloseTo(3600 - (4 - Math.PI) * (144 - 4), -1);
    const ellipse = { ...rectangle(0, 0, 120, 80), geometry: 'ellipse' as const };
    const inner = { ...rectangle(10, 10, 100, 60), geometry: 'ellipse' as const };
    expect(area(subtractShape(ellipse, inner))).toBeCloseTo(Math.PI * (60 * 40 - 50 * 30), -1);
  });
});
