import { describe, expect, it } from 'vitest';
import {
  alignRects,
  distributeRects,
  type Rect,
  resizeRect,
  snapMove,
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
