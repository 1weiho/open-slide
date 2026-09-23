import { describe, expect, it } from 'vitest';
import {
  alignRects,
  distributeRects,
  type Rect,
  rectContains,
  rectsIntersect,
  resizeRect,
  snapMove,
  solveResizeDimensions,
  thirdLines,
  unionRects,
} from './geometry.ts';

describe('unionRects', () => {
  it('finds group bounds across negative coordinates and nested objects', () => {
    expect(
      unionRects([
        { x: -20, y: 30, width: 100, height: 50 },
        { x: 0, y: -10, width: 20, height: 20 },
        { x: 5, y: 40, width: 10, height: 10 },
      ]),
    ).toEqual({ x: -20, y: -10, width: 100, height: 90 });
    expect(unionRects([])).toBeNull();
  });
});

describe('snapMove', () => {
  it('chooses the nearest target on each axis and spans the final snapped objects', () => {
    expect(
      snapMove(
        { x: 0, y: 0, width: 20, height: 20 },
        { x: 78, y: 79 },
        [
          { x: 104, y: 200, width: 40, height: 40 },
          { x: 100, y: 250, width: 40, height: 40 },
          { x: 300, y: 100, width: 20, height: 20 },
        ],
        6,
      ),
    ).toEqual({
      delta: { x: 80, y: 80 },
      guides: [
        { axis: 'x', position: 100, start: 80, end: 290 },
        { axis: 'y', position: 100, start: 80, end: 320 },
      ],
    });
  });

  it('snaps centers and includes candidates exactly at the threshold', () => {
    const result = snapMove(
      { x: 0, y: 0, width: 20, height: 20 },
      { x: 76, y: 50 },
      [{ x: 60, y: 200, width: 60, height: 20 }],
      4,
    );
    expect(result.delta).toEqual({ x: 80, y: 50 });
    expect(result.guides).toEqual([{ axis: 'x', position: 90, start: 50, end: 220 }]);
  });

  it('breaks equal-distance ties consistently regardless of target order', () => {
    const rect = { x: 0, y: 0, width: 20, height: 20 };
    const targets = [
      { x: 103, y: 200, width: 20, height: 20 },
      { x: 97, y: 200, width: 20, height: 20 },
    ];
    const result = snapMove(rect, { x: 80, y: 50 }, targets, 3);
    expect(result.delta).toEqual({ x: 77, y: 50 });
    expect(snapMove(rect, { x: 80, y: 50 }, [...targets].reverse(), 3)).toEqual(result);
  });

  it('preserves unsnapped movement when every target is outside the threshold', () => {
    expect(
      snapMove(
        { x: 0, y: 0, width: 20, height: 20 },
        { x: 10, y: 10 },
        [{ x: 100, y: 100, width: 20, height: 20 }],
        5,
      ),
    ).toEqual({ delta: { x: 10, y: 10 }, guides: [] });
  });
});

describe('thirdLines', () => {
  it('splits a canvas dimension into thirds', () => {
    expect(thirdLines(1920)).toEqual([640, 1280]);
    expect(thirdLines(1080)).toEqual([360, 720]);
  });
});

describe('snapMove with canvas anchors', () => {
  const canvas = { width: 1920, height: 1080 };
  const block: Rect = { x: 120, y: 160, width: 240, height: 160 };

  it('snaps an edge to a canvas third and draws a full-height guide', () => {
    expect(snapMove(block, { x: 523, y: 0 }, [], 6, { canvas, thirds: true })).toEqual({
      delta: { x: 520, y: 0 },
      guides: [{ axis: 'x', position: 640, start: 0, end: 1080, kind: 'third' }],
    });
  });

  it('snaps the centre to a horizontal third', () => {
    const result = snapMove(block, { x: 0, y: 124 }, [], 6, { canvas, thirds: true });
    expect(result.delta).toEqual({ x: 0, y: 120 });
    expect(result.guides).toEqual([
      { axis: 'y', position: 360, start: 0, end: 1920, kind: 'third' },
    ]);
  });

  it('ignores thirds unless enabled', () => {
    expect(snapMove(block, { x: 523, y: 0 }, [], 6, { canvas })).toEqual({
      delta: { x: 523, y: 0 },
      guides: [],
    });
  });

  it('prefers the nearer of an object anchor and a third', () => {
    const target: Rect = { x: 645, y: 600, width: 100, height: 100 };
    expect(snapMove(block, { x: 524, y: 0 }, [target], 6, { canvas, thirds: true }).delta).toEqual({
      x: 525,
      y: 0,
    });
    expect(snapMove(block, { x: 521, y: 0 }, [target], 6, { canvas, thirds: true }).delta).toEqual({
      x: 520,
      y: 0,
    });
  });

  it('rounds the leading edge to the grid when nothing else is in reach', () => {
    expect(snapMove(block, { x: 13, y: -5 }, [], 6, { canvas, grid: 8 })).toEqual({
      delta: { x: 16, y: -8 },
      guides: [
        { axis: 'x', position: 136, start: 0, end: 1080, kind: 'grid' },
        { axis: 'y', position: 152, start: 0, end: 1920, kind: 'grid' },
      ],
    });
  });

  it('lets objects and thirds win over the grid', () => {
    const target: Rect = { x: 400, y: 0, width: 50, height: 50 };
    const result = snapMove(block, { x: 38, y: 0 }, [target], 6, { canvas, grid: 8 });
    expect(result.delta.x).toBe(40);
    expect(result.guides.find((guide) => guide.axis === 'x')?.kind).toBeUndefined();
    expect(
      snapMove(block, { x: 518, y: 0 }, [], 6, { canvas, thirds: true, grid: 7 }).delta.x,
    ).toBe(520);
  });

  it('ignores a non-positive grid size', () => {
    expect(snapMove(block, { x: 13, y: 5 }, [], 6, { canvas, grid: 0 }).delta).toEqual({
      x: 13,
      y: 5,
    });
  });
});

describe('alignRects', () => {
  const rects = [
    { x: 10, y: 20, width: 20, height: 40 },
    { x: 80, y: 100, width: 40, height: 20 },
  ];

  it.each([
    [
      'left',
      [
        { x: 0, y: 0 },
        { x: -70, y: 0 },
      ],
    ],
    [
      'center',
      [
        { x: 45, y: 0 },
        { x: -35, y: 0 },
      ],
    ],
    [
      'right',
      [
        { x: 90, y: 0 },
        { x: 0, y: 0 },
      ],
    ],
    [
      'top',
      [
        { x: 0, y: 0 },
        { x: 0, y: -80 },
      ],
    ],
    [
      'middle',
      [
        { x: 0, y: 30 },
        { x: 0, y: -40 },
      ],
    ],
    [
      'bottom',
      [
        { x: 0, y: 60 },
        { x: 0, y: 0 },
      ],
    ],
  ] as const)('aligns %s against group bounds', (alignment, expected) => {
    expect(alignRects(rects, alignment)).toEqual(expected);
  });

  it('aligns a single object against explicit slide bounds', () => {
    expect(alignRects([rects[0]], 'center', { x: 0, y: 0, width: 1280, height: 720 })).toEqual([
      { x: 620, y: 0 },
    ]);
    expect(alignRects([], 'left')).toEqual([]);
  });
});

describe('distributeRects', () => {
  it('creates equal horizontal gaps for unequal sizes and preserves the input order', () => {
    const rects = [
      { x: 200, y: 20, width: 40, height: 20 },
      { x: 60, y: 30, width: 20, height: 30 },
      { x: 0, y: 10, width: 60, height: 40 },
    ];
    expect(distributeRects(rects, 'x')).toEqual([
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it('distributes vertical spacing while keeping the first and last objects fixed', () => {
    expect(
      distributeRects(
        [
          { x: 10, y: 0, width: 10, height: 30 },
          { x: 30, y: 40, width: 10, height: 10 },
          { x: 50, y: 150, width: 10, height: 20 },
          { x: 70, y: 210, width: 10, height: 30 },
        ],
        'y',
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 40 },
      { x: 0, y: -10 },
      { x: 0, y: 0 },
    ]);
  });

  it('leaves fewer than three objects in place', () => {
    expect(distributeRects([], 'x')).toEqual([]);
    expect(distributeRects([{ x: 10, y: 20, width: 30, height: 40 }], 'y')).toEqual([
      { x: 0, y: 0 },
    ]);
  });
});

describe('resizeRect', () => {
  const rect: Rect = { x: 100, y: 200, width: 80, height: 40 };

  it('clamps crossed edges to a minimum size while keeping the opposite corner anchored', () => {
    expect(resizeRect(rect, 'nw', { x: 200, y: 200 })).toEqual({
      x: 172,
      y: 232,
      width: 8,
      height: 8,
    });
    expect(resizeRect(rect, 'se', { x: -200, y: -200 })).toEqual({
      x: 100,
      y: 200,
      width: 8,
      height: 8,
    });
  });

  it('locks corner aspect ratio using the dominant relative movement', () => {
    expect(resizeRect(rect, 'nw', { x: -20, y: -40 }, true)).toEqual({
      x: 20,
      y: 160,
      width: 160,
      height: 80,
    });
    expect(resizeRect(rect, 'sw', { x: -80, y: 10 }, true)).toEqual({
      x: 20,
      y: 200,
      width: 160,
      height: 80,
    });
  });

  it('keeps both minimum size and aspect ratio when shrinking', () => {
    expect(resizeRect(rect, 'ne', { x: -100, y: 100 }, true)).toEqual({
      x: 100,
      y: 232,
      width: 16,
      height: 8,
    });
  });

  it('keeps the opposite edge midpoint fixed for aspect-locked side handles', () => {
    expect(resizeRect(rect, 'e', { x: 40, y: 100 }, true)).toEqual({
      x: 100,
      y: 190,
      width: 120,
      height: 60,
    });
    expect(resizeRect(rect, 'n', { x: 100, y: -20 }, true)).toEqual({
      x: 80,
      y: 180,
      width: 120,
      height: 60,
    });
  });

  it('ignores perpendicular movement for an unlocked side handle', () => {
    expect(resizeRect(rect, 'w', { x: 20, y: 100 })).toEqual({
      x: 120,
      y: 200,
      width: 60,
      height: 40,
    });
  });
});

describe('solveResizeDimensions', () => {
  const size = { width: 200, height: 100 };
  const rotatedBasis = (degrees: number, scale = 1) => {
    const angle = (degrees * Math.PI) / 180;
    return {
      a: Math.cos(angle) * scale,
      b: Math.sin(angle) * scale,
      c: Math.sin(angle) * scale,
      d: Math.cos(angle) * scale,
    };
  };

  it('resizes independent axes exactly for an unrotated element', () => {
    expect(solveResizeDimensions(size, { a: 1, b: 0, c: 0, d: 1 }, { x: 50, y: -20 })).toEqual({
      width: 250,
      height: 80,
    });
  });

  it('solves feasible rotated sizes without forcing an aspect lock', () => {
    const basis = rotatedBasis(30);
    const result = solveResizeDimensions(size, basis, {
      x: 40 * basis.a - 20 * basis.c,
      y: 40 * basis.b - 20 * basis.d,
    });
    expect(result.width).toBeCloseTo(240);
    expect(result.height).toBeCloseTo(80);
  });

  it.each([44, 45, 46])('preserves proportions instead of distorting at %s degrees', (angle) => {
    const result = solveResizeDimensions(size, rotatedBasis(angle), { x: 50, y: 0 });
    expect(result.width).toBeGreaterThan(200);
    expect(result.width).toBeLessThan(250);
    expect(result.height).toBeGreaterThan(100);
    expect(result.width / result.height).toBeCloseTo(2);
  });

  it('uses the same safe result under a scaled parent', () => {
    const normal = solveResizeDimensions(size, rotatedBasis(44), { x: 50, y: 0 });
    const scaled = solveResizeDimensions(size, rotatedBasis(44, 0.2), { x: 10, y: 0 });
    expect(scaled.width).toBeCloseTo(normal.width);
    expect(scaled.height).toBeCloseTo(normal.height);
  });

  it('preserves proportions when the requested bounds require a negative local size', () => {
    const result = solveResizeDimensions(size, rotatedBasis(30), { x: 200, y: 0 });
    expect(result.width).toBeLessThan(400);
    expect(result.width / result.height).toBeCloseTo(2);
  });

  it('keeps both local dimensions above the minimum when fitting a smaller box', () => {
    const result = solveResizeDimensions(size, rotatedBasis(45), { x: -1000, y: -1000 });
    expect(result).toEqual({ width: 16, height: 8 });
  });
});

describe('rectsIntersect', () => {
  it('detects overlap but not edges that only touch', () => {
    const marquee: Rect = { x: 90, y: 130, width: 510, height: 270 };
    expect(rectsIntersect(marquee, { x: 520, y: 360, width: 240, height: 160 })).toBe(true);
    expect(rectsIntersect(marquee, { x: 600, y: 360, width: 240, height: 160 })).toBe(false);
    expect(rectsIntersect(marquee, { x: 1120, y: 660, width: 240, height: 160 })).toBe(false);
  });
});

describe('rectContains', () => {
  it('requires the inner rect to sit fully inside the outer rect', () => {
    const outer: Rect = { x: 0, y: 0, width: 100, height: 100 };
    expect(rectContains(outer, { x: 10, y: 10, width: 80, height: 80 })).toBe(true);
    expect(rectContains(outer, { x: 0, y: 0, width: 100, height: 100 })).toBe(true);
    expect(rectContains(outer, { x: 50, y: 50, width: 60, height: 20 })).toBe(false);
  });
});
