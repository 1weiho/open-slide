// Pure shape classifier — pass it a list of {x,y} points (already in screen
// space) and it decides whether they collapse to ONE pptx primitive (line or
// axis-aligned rect) or stay as a multi-vertex polyline.
//
// All inputs are assumed to be browser-resolved coordinates (via
// getScreenCTM / getPointAtLength upstream). The classifier itself does no
// geometry recompute — it only inspects relative positions.

export type Point = { x: number; y: number };

export type ShapeClassResult =
  | { kind: 'line'; a: Point; b: Point }
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'polyline'; points: Point[] };

const EPSILON_PX = 0.5;

function near(a: number, b: number, eps = EPSILON_PX): boolean {
  return Math.abs(a - b) <= eps;
}

function samePoint(a: Point, b: Point, eps = EPSILON_PX): boolean {
  return near(a.x, b.x, eps) && near(a.y, b.y, eps);
}

// Are p0, p1, p2 colinear within EPSILON_PX of the p0→p2 segment?
// 2D cross product of (p1-p0, p2-p0). If |cross| <= eps * |p2-p0|, colinear.
function colinear3(p0: Point, p1: Point, p2: Point, eps = EPSILON_PX): boolean {
  const vx = p2.x - p0.x;
  const vy = p2.y - p0.y;
  const wx = p1.x - p0.x;
  const wy = p1.y - p0.y;
  const cross = Math.abs(vx * wy - vy * wx);
  const len = Math.hypot(vx, vy);
  // If p0 == p2, treat as colinear if p1 is also at that point (degenerate).
  if (len <= eps) return samePoint(p0, p1, eps);
  return cross <= eps * len;
}

function farthestPair(points: Point[]): { a: Point; b: Point } {
  let a = points[0];
  let b = points[0];
  let maxDist = 0;
  for (const p of points) {
    for (const q of points) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d > maxDist) {
        maxDist = d;
        a = p;
        b = q;
      }
    }
  }
  return { a, b };
}

function allColinear(points: Point[]): boolean {
  if (points.length <= 2) return true;
  const first = points[0];
  const last = points[points.length - 1];
  // Degenerate closed chain: first == last collapses the reference segment.
  // Fall back to the two farthest-apart vertices as the colinearity reference;
  // every other point must lie on that segment within tolerance.
  if (samePoint(first, last)) {
    const { a, b } = farthestPair(points);
    if (samePoint(a, b)) return true; // every point coincides
    for (const p of points) {
      if (!colinear3(a, p, b)) return false;
    }
    return true;
  }
  for (let i = 1; i < points.length - 1; i++) {
    if (!colinear3(first, points[i], last)) return false;
  }
  return true;
}

function tryRect(points: Point[]): ShapeClassResult | null {
  // points must be closed (first ≈ last) AND, after dropping the closing
  // duplicate, have exactly 4 distinct points forming an axis-aligned rect.
  if (points.length < 4) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (!samePoint(first, last)) return null;
  const open = points.slice(0, -1); // drop the closing duplicate
  if (open.length !== 4) return null;

  // Collect the two unique x-values and two unique y-values.
  const xs = Array.from(new Set(open.map((p) => Math.round(p.x / EPSILON_PX) * EPSILON_PX)));
  const ys = Array.from(new Set(open.map((p) => Math.round(p.y / EPSILON_PX) * EPSILON_PX)));
  if (xs.length !== 2 || ys.length !== 2) return null;

  // Each x value must appear in exactly two corners, same for y.
  const xCounts = new Map<number, number>();
  const yCounts = new Map<number, number>();
  for (const p of open) {
    const xKey = Math.round(p.x / EPSILON_PX) * EPSILON_PX;
    const yKey = Math.round(p.y / EPSILON_PX) * EPSILON_PX;
    xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
    yCounts.set(yKey, (yCounts.get(yKey) || 0) + 1);
  }
  for (const c of xCounts.values()) if (c !== 2) return null;
  for (const c of yCounts.values()) if (c !== 2) return null;

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { kind: 'rect', x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// Collapse runs of points that are colinear with their immediate neighbors
// down to just the run endpoints. Lets a high-density-sampled axis-aligned
// rect (hundreds of points along four edges) reduce to its 4 corners + close
// duplicate, so the downstream rect / colinearity checks can fire.
//
// Preserves the first and last point exactly so a closed path stays closed.
function simplifyColinearRuns(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const next = points[i + 1];
    // Drop cur if it lies on the segment prev→next within tolerance AND is
    // not a duplicate of prev (degenerate moves like M x y M x y stay).
    if (samePoint(prev, cur)) continue;
    if (colinear3(prev, cur, next)) continue;
    out.push(cur);
  }
  // Always preserve the final point (the closure vertex for closed paths).
  const last = points[points.length - 1];
  if (!samePoint(out[out.length - 1], last)) out.push(last);
  return out;
}

export function classifyPoints(points: Point[]): ShapeClassResult {
  if (points.length < 2) return { kind: 'polyline', points };
  if (points.length === 2) {
    return { kind: 'line', a: points[0], b: points[1] };
  }

  // Pre-simplify: drop intermediate points that lie on the segment between
  // their neighbors. This turns a high-density-sampled rectangle into its
  // 4 corners + closing duplicate, which the rect detector can then accept.
  // Cheap (O(n)) and idempotent — already-simplified input is unchanged.
  const simplified = simplifyColinearRuns(points);
  if (simplified.length < points.length) {
    // Re-classify on the simplified list (which may now be a 2-point line, a
    // 5-point closed rect, or a smaller polyline).
    return classifyPoints(simplified);
  }

  // All-colinear case (works for both open and closed paths — a closed
  // path whose vertices are all on one line collapses to that line).
  if (allColinear(points)) {
    // For an open colinear chain, line goes from first to last.
    // For a closed colinear chain (first ≈ last, all middle points on that
    // collapsed segment), use the bounding extent.
    const first = points[0];
    const last = points[points.length - 1];
    if (samePoint(first, last)) {
      // Closed degenerate: pick the two points furthest apart along the chain.
      const { a, b } = farthestPair(points);
      return { kind: 'line', a, b };
    }
    return { kind: 'line', a: first, b: last };
  }

  // Axis-aligned closed rect?
  const rectResult = tryRect(points);
  if (rectResult) return rectResult;

  return { kind: 'polyline', points };
}
