export type ThumbnailOffscreenDirection = 'above' | 'below' | null;

export function getThumbnailOffscreenDirection({
  itemTop,
  itemBottom,
  visibleTop,
  visibleBottom,
}: {
  itemTop: number;
  itemBottom: number;
  visibleTop: number;
  visibleBottom: number;
}): ThumbnailOffscreenDirection {
  if (itemBottom <= visibleTop) return 'above';
  if (itemTop >= visibleBottom) return 'below';
  return null;
}

export function getCenteredThumbnailScrollTop({
  itemTop,
  itemHeight,
  viewportHeight,
  topInset,
}: {
  itemTop: number;
  itemHeight: number;
  viewportHeight: number;
  topInset: number;
}): number {
  const visibleHeight = Math.max(0, viewportHeight - topInset);
  const centerOffset = Math.max(0, (visibleHeight - itemHeight) / 2);
  return Math.max(0, itemTop - topInset - centerOffset);
}
