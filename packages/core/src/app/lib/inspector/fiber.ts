export type SlideSourceHit = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type FindSlideSourceOptions = {
  // When true, only match host DOM fibers (`div`, `p`, …). Component
  // call-site fibers (`<MyComp/>`) are skipped. Prefer leaving this off so
  // imported/shared components remain selectable; their host children are
  // authored outside `slides/` and never get `data-slide-loc`.
  hostOnly?: boolean;
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

// `_debugSource.fileName` may carry Vite's HMR query (`?t=…`) and, on
// Windows, backslash separators. Both break the naive `endsWith` match.
function normalizeDebugFileName(fileName: string): string {
  return fileName.split(/[?#]/)[0].replace(/\\/g, '/');
}

function parseSlideLoc(el: HTMLElement): { line: number; column: number } | null {
  const loc = el.dataset.slideLoc;
  if (!loc) return null;
  const idx = loc.indexOf(':');
  if (idx <= 0) return null;
  const line = Number(loc.slice(0, idx));
  const column = Number(loc.slice(idx + 1));
  if (!Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { line, column };
}

function findViaFiber(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  const needle = `/slides/${slideId}/index.tsx`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    if (
      src?.fileName &&
      normalizeDebugFileName(src.fileName).endsWith(needle) &&
      src.lineNumber &&
      (!opts?.hostOnly || isHost)
    ) {
      return {
        line: src.lineNumber,
        column: src.columnNumber ?? 0,
        anchor: isHost ? (fiber.stateNode as HTMLElement) : anchor,
      };
    }
    if (isHost) {
      anchor = fiber.stateNode as HTMLElement;
    }
    fiber = fiber.return;
  }
  return null;
}

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Exact tag on the clicked element (slide-authored host JSX). Immune to
  // HMR-stale fiber state.
  const own = parseSlideLoc(el);
  if (own) {
    return { ...own, anchor: el };
  }

  // Fiber walk resolves imported/shared component call sites. Host children
  // rendered from another file are never tagged by loc-tags, and must win
  // over a tagged slide ancestor (otherwise a wrapper steals the click).
  const fiberHit = findViaFiber(el, slideId, opts);
  if (fiberHit) return fiberHit;

  // Ancestor tag: last-resort mapping when fiber debug source is missing.
  const tagged = el.closest<HTMLElement>('[data-slide-loc]');
  if (tagged) {
    const loc = parseSlideLoc(tagged);
    if (loc) return { ...loc, anchor: tagged };
  }

  return null;
}
