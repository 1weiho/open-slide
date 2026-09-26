import { type Decoration, roundPath, splitCss } from './effects';
import { contours, subtractShape } from './geometry';
import type { PptxPathCommand, PptxRect } from './model';
import { color, px } from './style';

type ShadowSample = { expansion: number; weight: number };

function subtractCompound(shape: Decoration, hole: Decoration): Decoration | undefined {
  const path: PptxPathCommand[] = [];
  for (const points of contours(shape)) {
    if (points.length < 3) continue;
    const candidate: Decoration = {
      ...shape,
      geometry: 'path',
      path: [
        { type: 'move', ...points[0] },
        ...points.slice(1).map((point) => ({ type: 'line' as const, ...point })),
        { type: 'close' },
      ],
    };
    const piece = subtractShape(candidate, hole);
    if (piece?.path) path.push(...piece.path);
  }
  return path.length ? { ...shape, geometry: 'path', path } : undefined;
}

function bandCount(blur: number, ellipse: boolean, radii: number[]): number {
  if (blur <= 0) return 1;
  const expensiveGeometry = ellipse || radii.some((radius) => radius > 0);
  return expensiveGeometry ? 64 : Math.min(128, Math.max(64, Math.ceil(blur * 1.5)));
}

export function shadowShapes(
  style: CSSStyleDeclaration,
  box: PptxRect,
  alpha: number,
  radii: number[],
  ellipse = false,
): { before: Decoration[]; after: Decoration[] } {
  const before: Decoration[] = [],
    after: Decoration[] = [];
  if (style.boxShadow === 'none') return { before, after };
  const silhouette = (w: number, h: number, values: number[]) => {
    if (ellipse) return { geometry: 'ellipse' as const };
    if (!values.some((radius) => radius > 0)) return { geometry: 'rect' as const };
    return { geometry: 'path' as const, path: roundPath(w, h, values) };
  };
  for (const value of splitCss(style.boxShadow).reverse()) {
    const parts = splitCss(value, ' ');
    const c = parts.find((p) => CSS.supports('color', p));
    if (!c) throw new Error(`Cannot parse box shadow: ${value}`);
    const lengths = parts.filter((p) => p !== c && p !== 'inset').map(px);
    const [dx = 0, dy = 0, blur = 0, spread = 0] = lengths;
    const fill = color(c, alpha);
    if (!fill.opacity) continue;
    if (parts.includes('inset')) {
      if (dx === 0 && dy === 0 && blur === 0) {
        const n = Math.max(0, spread);
        if (n)
          after.push({
            x: box.x + n / 2,
            y: box.y + n / 2,
            w: Math.max(0, box.w - n),
            h: Math.max(0, box.h - n),
            kind: 'shape',
            ...silhouette(
              Math.max(0, box.w - n),
              Math.max(0, box.h - n),
              radii.map((r) => Math.max(0, r - n / 2)),
            ),
            stroke: { ...fill, width: n },
          });
      } else
        after.push({
          ...box,
          kind: 'shape',
          ...silhouette(box.w, box.h, radii),
          fill: { color: 'FFFFFF', opacity: 0 },
          shadow: { ...fill, x: dx, y: dy, blur, inset: true },
        });
    } else {
      if (blur === 0) {
        const w = box.w + spread * 2;
        const h = box.h + spread * 2;
        if (w <= 0 || h <= 0) continue;
        const shape: Decoration = {
          x: box.x + dx - spread,
          y: box.y + dy - spread,
          w,
          h,
          kind: 'shape',
          ...silhouette(
            w,
            h,
            radii.map((r) => Math.max(0, r + spread)),
          ),
          fill,
        };
        if (
          (dx !== 0 || dy !== 0) &&
          fill.opacity === 1 &&
          color(style.backgroundColor, alpha).opacity === 1
        ) {
          before.push(shape);
          continue;
        }
        const clipped = subtractShape(shape, {
          ...box,
          kind: 'shape',
          ...silhouette(box.w, box.h, radii),
        });
        if (clipped) before.push(clipped);
        continue;
      }
      const sigma = blur / 2;
      const count = bandCount(blur, ellipse, radii);
      const samples: ShadowSample[] = Array.from({ length: count }, (_, i) => {
        const z = -3 + ((i + 0.5) * 6) / count;
        return { expansion: spread + z * sigma, weight: Math.exp((-z * z) / 2) };
      }).reverse();
      const total = samples.reduce((sum, sample) => sum + sample.weight, 0);
      const validSamples = samples.filter(
        ({ expansion }) => box.w + expansion * 2 > 0 && box.h + expansion * 2 > 0,
      );
      const borderBox: Decoration = {
        ...box,
        kind: 'shape',
        ...silhouette(box.w, box.h, radii),
      };
      let accumulatedWeight = 0;
      // CSS clips an outer shadow out of the border box, even when its fill is transparent.
      // Non-overlapping bands let each layer carry its direct cumulative Gaussian opacity.
      for (const [index, sample] of validSamples.entries()) {
        const expansion = sample.expansion;
        const w = box.w + expansion * 2;
        const h = box.h + expansion * 2;
        accumulatedWeight += sample.weight;
        const layerOpacity = (fill.opacity * accumulatedWeight) / total;
        const shape: Decoration = {
          x: box.x + dx - expansion,
          y: box.y + dy - expansion,
          w,
          h,
          kind: 'shape',
          ...silhouette(
            w,
            h,
            radii.map((r) => Math.max(0, r + expansion)),
          ),
          fill: { ...fill, opacity: Math.min(1, layerOpacity) },
        };
        const next = validSamples[index + 1];
        const inner: Decoration =
          next && (dx !== 0 || dy !== 0 || next.expansion > 0)
            ? {
                x: box.x + dx - next.expansion,
                y: box.y + dy - next.expansion,
                w: box.w + next.expansion * 2,
                h: box.h + next.expansion * 2,
                kind: 'shape',
                ...silhouette(
                  box.w + next.expansion * 2,
                  box.h + next.expansion * 2,
                  radii.map((r) => Math.max(0, r + next.expansion)),
                ),
              }
            : borderBox;
        const band = subtractShape(shape, inner);
        if (!band) continue;
        const clipped = next ? subtractCompound(band, borderBox) : band;
        if (clipped) before.push(clipped);
      }
    }
  }
  return { before, after };
}
