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

/**
 * Read the `line:column` pair that the loc-tags Vite plugin writes into
 * `data-slide-loc`.
 *
 * Every rejection path matters more than it looks: callers treat a returned
 * object as an authoritative source position, so a malformed attribute has to
 * degrade to "untagged" and let the fiber walk take over. Handing back a `NaN`
 * line instead would point the inspector at a source location that does not
 * exist. Returns null for a missing attribute, a missing or leading separator,
 * or a non-finite half.
 */
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

/**
 * Resolve a source position by walking the React fiber chain up from `el`.
 *
 * This exists because the loc-tags plugin only transforms files under
 * `slides/`. JSX rendered from an imported or shared component carries no
 * `data-slide-loc`, so the only record of where it was invoked lives in the
 * fiber's debug source. The walk stops at the first ancestor whose debug file
 * is the slide's own `index.tsx`, which is the call site the author can
 * actually edit.
 *
 * `anchor` tracks the nearest host element seen so far rather than the matched
 * fiber, because a component-invocation fiber has no DOM node of its own; the
 * inspector still needs something on screen to outline and measure.
 */
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

/**
 * Map a clicked DOM element back to the JSX that produced it.
 *
 * The three strategies are ordered by how specific their answer is, not by how
 * cheap they are. An exact tag on the element itself is unambiguous, so it
 * wins outright. The fiber walk comes second because it is the only strategy
 * that can see an imported or shared component's call site, and it has to
 * outrank the tagged-ancestor lookup: a shared component nested inside tagged
 * slide markup would otherwise resolve to its wrapper, and clicking the
 * component would silently select the container around it (#327). The ancestor
 * tag is the last resort for the case the fiber walk cannot cover, which is
 * an HMR-stale or absent debug source.
 */
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
