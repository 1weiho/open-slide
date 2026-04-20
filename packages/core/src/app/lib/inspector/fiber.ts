export type SlideSourceHit = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type FiberLike = {
  return: FiberLike | null;
  stateNode?: unknown;
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number };
  memoizedProps?: { __source?: { fileName?: string; lineNumber?: number; columnNumber?: number } };
};

function getFiber(el: Element): FiberLike | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  if (!key) return null;
  return (el as unknown as Record<string, FiberLike>)[key] ?? null;
}

function getSource(fiber: FiberLike) {
  return fiber._debugSource ?? fiber.memoizedProps?.__source;
}

export function findSlideSource(el: HTMLElement, slideId: string): SlideSourceHit | null {
  const needle = `/slides/${slideId}/index.tsx`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    if (src?.fileName?.endsWith(needle) && src.lineNumber) {
      return { line: src.lineNumber, column: src.columnNumber ?? 0, anchor };
    }
    if (fiber.stateNode instanceof HTMLElement) {
      anchor = fiber.stateNode;
    }
    fiber = fiber.return;
  }
  return null;
}
