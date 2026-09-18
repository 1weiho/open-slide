import { type Decoration, sampleGradient } from './effects';
import { clipConvex, contours, type Point, subtractShape } from './geometry';
import type { PptxPathCommand } from './model';

function path(points: Point[]): PptxPathCommand[] {
  return points.length < 3
    ? []
    : [
        { type: 'move', ...points[0] },
        ...points.slice(1).map((p) => ({ type: 'line' as const, ...p })),
        { type: 'close' },
      ];
}

export function radialFillShapes(shape: Decoration): Decoration[] {
  const gradient = shape.gradient;
  if (gradient?.kind !== 'radial') return [shape];
  if (shape.shadow !== undefined)
    throw new Error(
      'Radial gradients cannot be combined with native shape shadows in editable PowerPoint.',
    );
  const cx = (gradient.center?.x ?? 0.5) * shape.w;
  const cy = (gradient.center?.y ?? 0.5) * shape.h;
  const rx = (gradient.radius?.x ?? 0.5) * shape.w;
  const ry = (gradient.radius?.y ?? 0.5) * shape.h;
  if (rx <= 0 || ry <= 0) throw new Error('A radial gradient needs positive radii.');
  const polygons = contours(shape);
  if (polygons.length !== 1)
    throw new Error('Radial fills on compound paths need a native adapter.');
  const perimeter = polygons[0];
  const signs = new Set(
    perimeter
      .map((a, i) => {
        const b = perimeter[(i + 1) % perimeter.length],
          c = perimeter[(i + 2) % perimeter.length];
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        return Math.abs(cross) < 1e-6 ? 0 : Math.sign(cross);
      })
      .filter(Boolean),
  );
  if (signs.size > 1) throw new Error('Radial fills on concave paths need a native adapter.');
  const fillShape = { ...shape, stroke: undefined };
  const ellipse = (r: number) => ({
    ...fillShape,
    x: shape.x + cx - rx * r,
    y: shape.y + cy - ry * r,
    w: rx * r * 2,
    h: ry * r * 2,
    geometry: 'ellipse' as const,
    gradient: undefined,
    path: undefined,
  });
  const result: Decoration[] = [];
  const last = sampleGradient(gradient, 1);
  if (last.opacity > 0) {
    const outside = subtractShape({ ...fillShape, gradient: undefined, fill: last }, ellipse(1));
    if (outside) result.push(outside);
  }
  // Office remaps radial focuses and quantizes very faint stacked alpha layers.
  // Non-overlapping vector bands retain CSS centre/radii and composite each pixel once.
  const stops = [...new Set([0, ...gradient.stops.map((s) => s.offset), 1])].sort((a, b) => a - b);
  for (let segment = 1; segment < stops.length; segment++) {
    const start = stops[segment - 1],
      end = stops[segment];
    const count = Math.max(1, Math.ceil((end - start) * 128));
    for (let i = 0; i < count; i++) {
      const lo = start + ((end - start) * i) / count;
      const hi = start + ((end - start) * (i + 1)) / count;
      const fill = sampleGradient(gradient, (lo + hi) / 2);
      if (!fill.opacity) continue;
      const outer = ellipse(hi);
      const boundary = contours(outer)[0].map((p) => ({
        x: p.x + outer.x - shape.x,
        y: p.y + outer.y - shape.y,
      }));
      const clipped = clipConvex(perimeter, boundary);
      if (clipped.length < 3) continue;
      const band: Decoration = {
        ...fillShape,
        geometry: 'path',
        gradient: undefined,
        fill,
        path: path(clipped),
      };
      const ring = lo > 0 ? subtractShape(band, ellipse(lo)) : band;
      if (ring) result.push(ring);
    }
  }
  if (shape.stroke?.opacity && shape.stroke.width)
    result.push({ ...shape, gradient: undefined, fill: undefined });
  return result;
}
