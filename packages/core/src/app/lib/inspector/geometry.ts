export type Point = { x: number; y: number };

export type Rect = Point & { width: number; height: number };

export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type Guide = {
  axis: 'x' | 'y';
  position: number;
  start: number;
  end: number;
};

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    width: Math.max(...rects.map((rect) => rect.x + rect.width)) - x,
    height: Math.max(...rects.map((rect) => rect.y + rect.height)) - y,
  };
}

function anchors(rect: Rect, axis: 'x' | 'y'): number[] {
  const size = axis === 'x' ? rect.width : rect.height;
  return [rect[axis], rect[axis] + size / 2, rect[axis] + size];
}

function nearestSnap(rect: Rect, targets: Rect[], axis: 'x' | 'y', threshold: number) {
  let best: { correction: number; position: number } | null = null;
  for (const target of targets) {
    for (const position of anchors(target, axis)) {
      for (const anchor of anchors(rect, axis)) {
        const correction = position - anchor;
        const distance = Math.abs(correction);
        if (distance > threshold) continue;
        if (
          !best ||
          distance < Math.abs(best.correction) ||
          (distance === Math.abs(best.correction) && correction < best.correction) ||
          (correction === best.correction && position < best.position)
        ) {
          best = { correction, position };
        }
      }
    }
  }
  return best;
}

export function snapMove(
  rect: Rect,
  delta: Point,
  targets: Rect[],
  threshold: number,
): { delta: Point; guides: Guide[] } {
  const moved = { ...rect, x: rect.x + delta.x, y: rect.y + delta.y };
  const xSnap = nearestSnap(moved, targets, 'x', threshold);
  const ySnap = nearestSnap(moved, targets, 'y', threshold);
  const snappedDelta = {
    x: delta.x + (xSnap?.correction ?? 0),
    y: delta.y + (ySnap?.correction ?? 0),
  };
  const snapped = { ...rect, x: rect.x + snappedDelta.x, y: rect.y + snappedDelta.y };
  const guides: Guide[] = [];
  for (const axis of ['x', 'y'] as const) {
    const snap = axis === 'x' ? xSnap : ySnap;
    if (!snap) continue;
    const aligned = targets.filter((target) =>
      anchors(target, axis).some((anchor) => Math.abs(anchor - snap.position) < 0.000001),
    );
    const bounds = unionRects([snapped, ...aligned]);
    if (!bounds) continue;
    guides.push({
      axis,
      position: snap.position,
      start: axis === 'x' ? bounds.y : bounds.x,
      end: axis === 'x' ? bounds.y + bounds.height : bounds.x + bounds.width,
    });
  }
  return { delta: snappedDelta, guides };
}

export function alignRects(rects: Rect[], alignment: Alignment, bounds?: Rect): Point[] {
  const target = bounds ?? unionRects(rects);
  if (!target) return [];
  return rects.map((rect) => {
    switch (alignment) {
      case 'left':
        return { x: target.x - rect.x, y: 0 };
      case 'center':
        return { x: target.x + target.width / 2 - rect.x - rect.width / 2, y: 0 };
      case 'right':
        return { x: target.x + target.width - rect.x - rect.width, y: 0 };
      case 'top':
        return { x: 0, y: target.y - rect.y };
      case 'middle':
        return { x: 0, y: target.y + target.height / 2 - rect.y - rect.height / 2 };
      default:
        return { x: 0, y: target.y + target.height - rect.y - rect.height };
    }
  });
}

export function distributeRects(rects: Rect[], axis: 'x' | 'y'): Point[] {
  const deltas = rects.map(() => ({ x: 0, y: 0 }));
  if (rects.length < 3) return deltas;
  const size = axis === 'x' ? 'width' : 'height';
  const sorted = rects
    .map((rect, index) => ({ rect, index }))
    .sort((a, b) => a.rect[axis] - b.rect[axis] || a.index - b.index);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSize = rects.reduce((sum, rect) => sum + rect[size], 0);
  const gap =
    (last.rect[axis] + last.rect[size] - first.rect[axis] - totalSize) / (rects.length - 1);
  let position = first.rect[axis];
  for (const { rect, index } of sorted) {
    deltas[index][axis] = position - rect[axis];
    position += rect[size] + gap;
  }
  return deltas;
}

export function resizeRect(
  rect: Rect,
  handle: ResizeHandle,
  delta: Point,
  lockAspect = false,
): Rect {
  const west = handle.includes('w');
  const east = handle.includes('e');
  const north = handle.includes('n');
  const south = handle.includes('s');
  const horizontal = west || east;
  const vertical = north || south;
  const requestedWidth = rect.width + (west ? -delta.x : east ? delta.x : 0);
  const requestedHeight = rect.height + (north ? -delta.y : south ? delta.y : 0);
  let width = Math.max(8, requestedWidth);
  let height = Math.max(8, requestedHeight);
  if (lockAspect && rect.width > 0 && rect.height > 0) {
    const widthScale = requestedWidth / rect.width;
    const heightScale = requestedHeight / rect.height;
    const scale = Math.max(
      8 / rect.width,
      8 / rect.height,
      horizontal && (!vertical || Math.abs(widthScale - 1) >= Math.abs(heightScale - 1))
        ? widthScale
        : heightScale,
    );
    width = rect.width * scale;
    height = rect.height * scale;
  }
  return {
    x: west ? rect.x + rect.width - width : horizontal ? rect.x : rect.x + (rect.width - width) / 2,
    y: north
      ? rect.y + rect.height - height
      : vertical
        ? rect.y
        : rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}
