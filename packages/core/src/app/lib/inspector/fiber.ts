import { parseSlideLoc } from './slide-loc.ts';

export type SlideSourceHit = {
  file: string | null;
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type FindSlideSourceOptions = {
  // Visual editor uses this: skip component-invocation JSX (`<MyComp/>`)
  // since most components don't forward `style`. Comments leave it off
  // so any JSX can be annotated.
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

function relUnderSlide(fileName: string, slideId: string): string | null {
  const norm = normalizeDebugFileName(fileName);
  const marker = `/slides/${slideId}/`;
  const idx = norm.lastIndexOf(marker);
  if (idx === -1) return null;
  const rel = norm.slice(idx + marker.length);
  if (!rel.endsWith('.tsx') || rel.endsWith('.d.ts') || rel.endsWith('.test.tsx')) return null;
  if (rel.includes('..') || rel.startsWith('/')) return null;
  return rel;
}

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Primary path: the `data-slide-loc` attribute injected by the
  // loc-tags Vite plugin. Immune to HMR-stale fiber state.
  const tagged = el.closest<HTMLElement>('[data-slide-loc]');
  if (tagged) {
    const loc = tagged.dataset.slideLoc;
    if (loc) {
      const parsed = parseSlideLoc(loc);
      if (parsed) return { ...parsed, anchor: tagged };
    }
  }

  // Fallback for JSX rendered from files the loc-tags plugin didn't
  // transform (library components, or a sibling the tag missed).
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    const rel = src?.fileName ? relUnderSlide(src.fileName, slideId) : null;
    if (rel && src?.lineNumber && (!opts?.hostOnly || isHost)) {
      return {
        file: rel === 'index.tsx' ? null : rel,
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
