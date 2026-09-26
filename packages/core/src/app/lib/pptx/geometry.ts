import { cropGradient, type Decoration, intersect, roundPath } from './effects';
import type { PptxPathCommand, PptxRect, PptxShape } from './model';

export type Point = { x: number; y: number };

export function contours(
  shape: Pick<PptxShape, 'w' | 'h' | 'path' | 'geometry' | 'radius'>,
): Point[][] {
  const { w, h } = shape;
  let path = shape.path;
  if (shape.geometry === 'ellipse')
    return [
      Array.from({ length: 128 }, (_, i) => ({
        x: w / 2 + (w / 2) * Math.cos((i * Math.PI) / 64),
        y: h / 2 + (h / 2) * Math.sin((i * Math.PI) / 64),
      })),
    ];
  if (shape.geometry === 'line')
    return [
      [
        { x: 0, y: 0 },
        { x: w, y: h },
      ],
    ];
  if (!path)
    path = roundPath(w, h, Array(4).fill(shape.geometry === 'roundRect' ? (shape.radius ?? 0) : 0));
  const result: Point[][] = [];
  let points: Point[] = [],
    last: Point = { x: 0, y: 0 };
  for (const command of path) {
    if (command.type === 'move') {
      if (points.length) result.push(points);
      points = [{ x: command.x, y: command.y }];
    }
    if (command.type === 'line') points.push({ x: command.x, y: command.y });
    if (command.type === 'cubic') {
      for (let i = 1; i <= 24; i++) {
        const t = i / 24,
          u = 1 - t;
        points.push({
          x:
            u ** 3 * last.x +
            3 * u * u * t * command.x1 +
            3 * u * t * t * command.x2 +
            t ** 3 * command.x,
          y:
            u ** 3 * last.y +
            3 * u * u * t * command.y1 +
            3 * u * t * t * command.y2 +
            t ** 3 * command.y,
        });
      }
    }
    if (command.type === 'close' && points.length) points.push(points[0]);
    if ('x' in command) last = { x: command.x, y: command.y };
  }
  if (points.length) result.push(points);
  return result;
}

function clipPolygon(points: Point[], box: PptxRect): Point[] {
  let result = points;
  const edges: [keyof Point, number, boolean][] = [
    ['x', box.x, true],
    ['x', box.x + box.w, false],
    ['y', box.y, true],
    ['y', box.y + box.h, false],
  ];
  for (const [axis, edge, lower] of edges) {
    const input = result;
    result = [];
    for (let i = 0; i < input.length; i++) {
      const a = input[i],
        b = input[(i + 1) % input.length];
      const ain = lower ? a[axis] >= edge : a[axis] <= edge,
        bin = lower ? b[axis] >= edge : b[axis] <= edge;
      if (ain) result.push(a);
      if (ain !== bin) {
        const t = (edge - a[axis]) / (b[axis] - a[axis]);
        result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
  }
  return result;
}

function clipLine(a: Point, b: Point, box: PptxRect): [Point, Point] | undefined {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  let lo = 0,
    hi = 1;
  for (const [p, q] of [
    [-dx, a.x - box.x],
    [dx, box.x + box.w - a.x],
    [-dy, a.y - box.y],
    [dy, box.y + box.h - a.y],
  ]) {
    if (p === 0) {
      if (q < 0) return;
      continue;
    }
    const r = q / p;
    if (p < 0) lo = Math.max(lo, r);
    else hi = Math.min(hi, r);
    if (lo > hi) return;
  }
  return [
    { x: a.x + lo * dx, y: a.y + lo * dy },
    { x: a.x + hi * dx, y: a.y + hi * dy },
  ];
}

export function clipShape(shape: PptxShape, clip: PptxRect): PptxShape[] {
  if (
    shape.x >= clip.x &&
    shape.y >= clip.y &&
    shape.x + shape.w <= clip.x + clip.w &&
    shape.y + shape.h <= clip.y + clip.h
  )
    return [shape];
  if (shape.geometry === 'line') {
    const line = clipLine(
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.w, y: shape.y + shape.h },
      clip,
    );
    if (!line) return [];
    return [
      { ...shape, x: line[0].x, y: line[0].y, w: line[1].x - line[0].x, h: line[1].y - line[0].y },
    ];
  }
  const box = intersect(shape, clip);
  if (!box) return [];
  const localClip = { x: box.x - shape.x, y: box.y - shape.y, w: box.w, h: box.h };
  const paths = contours(shape);
  const offset = (p: Point): Point => ({ x: p.x - localClip.x, y: p.y - localClip.y });
  const result: PptxShape[] = [];
  if (shape.fill || shape.gradient) {
    const path: PptxPathCommand[] = [];
    for (const points of paths) {
      const clipped = clipPolygon(points, localClip);
      if (!clipped.length) continue;
      path.push(
        { type: 'move', ...offset(clipped[0]) },
        ...clipped.slice(1).map((p) => ({ type: 'line' as const, ...offset(p) })),
        { type: 'close' },
      );
    }
    if (path.length)
      result.push({
        ...shape,
        ...box,
        geometry: 'path',
        path,
        gradient: shape.gradient ? cropGradient(shape.gradient, shape, box) : undefined,
        stroke: undefined,
      });
  }
  if (shape.stroke?.opacity && shape.stroke.width) {
    const path: PptxPathCommand[] = [];
    for (const points of paths)
      for (let i = 0; i < points.length - 1; i++) {
        const line = clipLine(points[i], points[i + 1], localClip);
        if (line)
          path.push({ type: 'move', ...offset(line[0]) }, { type: 'line', ...offset(line[1]) });
      }
    if (path.length)
      result.push({
        ...shape,
        ...box,
        geometry: 'path',
        path,
        fill: undefined,
        gradient: undefined,
      });
  }
  return result;
}

export function subtractShape(shape: Decoration, hole: Decoration): Decoration | undefined {
  const outer = contours(shape)[0];
  const inner = contours(hole)[0].map((p) => ({
    x: p.x + hole.x - shape.x,
    y: p.y + hole.y - shape.y,
  }));
  let remaining = outer;
  const pieces: Point[][] = [];
  for (let i = 0; i < inner.length && remaining.length; i++) {
    const a = inner[i],
      b = inner[(i + 1) % inner.length];
    if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-8) continue;
    const inside: Point[] = [],
      outside: Point[] = [];
    const distance = (p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    for (let j = 0; j < remaining.length; j++) {
      const p = remaining[j],
        q = remaining[(j + 1) % remaining.length];
      const pd = distance(p),
        qd = distance(q);
      (pd >= 0 ? inside : outside).push(p);
      if (pd >= 0 !== qd >= 0) {
        const t = pd / (pd - qd);
        const crossing = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
        inside.push(crossing);
        outside.push(crossing);
      }
    }
    const signedArea = outside.reduce((sum, p, j) => {
      const q = outside[(j + 1) % outside.length];
      return sum + p.x * q.y - q.x * p.y;
    }, 0);
    if (Math.abs(signedArea) > 1e-6) pieces.push(outside);
    remaining = inside;
  }
  if (!pieces.length) return;
  const path: PptxPathCommand[] = pieces.flatMap((points) => [
    { type: 'move', ...points[0] },
    ...points.slice(1).map((p) => ({ type: 'line' as const, ...p })),
    { type: 'close' },
  ]);
  return { ...shape, geometry: 'path', path };
}

export function clipConvex(points: Point[], boundary: Point[]): Point[] {
  let result = points;
  for (let i = 0; i < boundary.length && result.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length];
    if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-8) continue;
    const distance = (p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const input = result;
    result = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j],
        q = input[(j + 1) % input.length];
      const pd = distance(p),
        qd = distance(q);
      if (pd >= 0) result.push(p);
      if (pd >= 0 !== qd >= 0) {
        const t = pd / (pd - qd);
        result.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
  }
  return result;
}
