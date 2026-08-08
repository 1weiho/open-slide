import { describe, expect, it } from 'vitest';
import {
  getCenteredThumbnailScrollTop,
  getThumbnailOffscreenDirection,
} from './thumbnail-rail-scroll';

describe('getThumbnailOffscreenDirection', () => {
  const visibleBounds = { visibleTop: 40, visibleBottom: 540 };

  it('reports a thumbnail fully above the visible area', () => {
    expect(getThumbnailOffscreenDirection({ itemTop: -80, itemBottom: 40, ...visibleBounds })).toBe(
      'above',
    );
  });

  it('reports a thumbnail fully below the visible area', () => {
    expect(
      getThumbnailOffscreenDirection({ itemTop: 540, itemBottom: 660, ...visibleBounds }),
    ).toBe('below');
  });

  it('keeps the control hidden while a thumbnail is fully visible', () => {
    expect(
      getThumbnailOffscreenDirection({ itemTop: 120, itemBottom: 240, ...visibleBounds }),
    ).toBeNull();
  });

  it('keeps the control hidden while either edge remains visible', () => {
    expect(
      getThumbnailOffscreenDirection({ itemTop: 20, itemBottom: 80, ...visibleBounds }),
    ).toBeNull();
    expect(
      getThumbnailOffscreenDirection({ itemTop: 500, itemBottom: 580, ...visibleBounds }),
    ).toBeNull();
  });
});

describe('getCenteredThumbnailScrollTop', () => {
  it('centers the thumbnail inside the unobscured viewport', () => {
    expect(
      getCenteredThumbnailScrollTop({
        itemTop: 1040,
        itemHeight: 120,
        viewportHeight: 600,
        topInset: 40,
      }),
    ).toBe(780);
  });

  it('does not scroll before the start of the list', () => {
    expect(
      getCenteredThumbnailScrollTop({
        itemTop: 40,
        itemHeight: 120,
        viewportHeight: 600,
        topInset: 40,
      }),
    ).toBe(0);
  });
});
