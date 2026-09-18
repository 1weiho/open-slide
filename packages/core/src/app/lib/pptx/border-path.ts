import { roundPath } from './effects';
import type { PptxPathCommand } from './model';

type Point = { x: number; y: number };
type Curve = Extract<PptxPathCommand, { type: 'cubic' }>;
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function halves(start: Point, curve: Curve, t: number): [Point, Curve, Curve] {
  const interpolate = (a: Point, b: Point) =>
    t === 0.5 ? midpoint(a, b) : { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  const a = interpolate(start, { x: curve.x1, y: curve.y1 });
  const b = interpolate({ x: curve.x1, y: curve.y1 }, { x: curve.x2, y: curve.y2 });
  const c = interpolate({ x: curve.x2, y: curve.y2 }, curve);
  const d = interpolate(a, b);
  const e = interpolate(b, c);
  const m = interpolate(d, e);
  return [
    m,
    { type: 'cubic', x1: a.x, y1: a.y, x2: d.x, y2: d.y, ...m },
    { type: 'cubic', x1: e.x, y1: e.y, x2: c.x, y2: c.y, x: curve.x, y: curve.y },
  ];
}

export function borderPaths(
  w: number,
  h: number,
  radii: number[],
  widths = [1, 1, 1, 1],
): PptxPathCommand[][] {
  const perimeter = roundPath(w, h, radii);
  const corners = [2, 4, 6, 8].map((index, side) => {
    const next = (side + 1) % 4;
    // A missing adjoining border leaves the entire rounded corner on the painted side.
    const t = widths[side] === 0 ? 0 : widths[next] === 0 ? 1 : 0.5;
    return halves(perimeter[index - 1] as Point, perimeter[index] as Curve, t);
  });
  return corners.map((corner, side) => {
    const previous = corners[(side + 3) % 4];
    return [{ type: 'move', ...previous[0] }, previous[2], perimeter[side * 2 + 1], corner[1]];
  });
}
