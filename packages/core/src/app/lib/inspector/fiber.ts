export type SlideSourceHit = {
  line: number;
  column: number;
  sourceFile?: string;
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

function slideSourceFileName(fileName: string, slideId: string): string | null {
  const normalized = normalizeDebugFileName(fileName);
  const needle = `/${slideId}/`;
  const idx = normalized.lastIndexOf(needle);
  if (idx === -1) return null;
  const sourceFile = normalized.slice(idx + needle.length);
  if (!sourceFile.endsWith('.tsx')) return null;
  if (sourceFile.endsWith('.d.ts') || sourceFile.endsWith('.test.tsx')) return null;
  return sourceFile;
}

function findTaggedSource(el: HTMLElement): SlideSourceHit | null {
  const tagged = el.closest<HTMLElement>('[data-slide-loc]');
  if (!tagged) return null;
  const loc = tagged.dataset.slideLoc;
  if (!loc) return null;
  const idx = loc.indexOf(':');
  if (idx <= 0) return null;
  const line = Number(loc.slice(0, idx));
  const column = Number(loc.slice(idx + 1));
  if (!Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { line, column, sourceFile: tagged.dataset.slideFile, anchor: tagged };
}

function findFiberSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions & { componentOnly?: boolean; outermost?: boolean },
): SlideSourceHit | null {
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  let hit: SlideSourceHit | null = null;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    const sourceFile = src?.fileName ? slideSourceFileName(src.fileName, slideId) : null;
    const lineNumber = src?.lineNumber;
    const columnNumber = src?.columnNumber ?? 0;
    if (
      sourceFile &&
      lineNumber &&
      (!opts?.hostOnly || isHost) &&
      (!opts?.componentOnly || !isHost)
    ) {
      const nextHit = {
        line: lineNumber,
        column: columnNumber,
        sourceFile,
        anchor: isHost ? (fiber.stateNode as HTMLElement) : anchor,
      };
      if (!opts?.outermost) return nextHit;
      hit = nextHit;
    }
    if (isHost) {
      anchor = fiber.stateNode as HTMLElement;
    }
    fiber = fiber.return;
  }
  return hit;
}

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Primary path: the `data-slide-loc` attribute injected by the
  // loc-tags Vite plugin. Immune to HMR-stale fiber state.
  const tagged = findTaggedSource(el);
  if (tagged) return tagged;

  // Fallback for JSX rendered from imported component files (which the
  // loc-tags plugin doesn't transform).
  return findFiberSource(el, slideId, opts);
}

export function findCommentSource(el: HTMLElement, slideId: string): SlideSourceHit | null {
  return (
    findFiberSource(el, slideId, { componentOnly: true, outermost: true }) ??
    findSlideSource(el, slideId)
  );
}
