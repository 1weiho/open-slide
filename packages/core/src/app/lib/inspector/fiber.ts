export type SlideSourceHit = {
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

type DebugSource = { fileName?: string; lineNumber?: number; columnNumber?: number };

type FiberLike = {
  return: FiberLike | null;
  stateNode?: unknown;
  _debugSource?: DebugSource;
  _debugOwner?: FiberLike | null;
  memoizedProps?: { __source?: DebugSource };
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
      const idx = loc.indexOf(':');
      if (idx > 0) {
        const line = Number(loc.slice(0, idx));
        const column = Number(loc.slice(idx + 1));
        if (Number.isFinite(line) && Number.isFinite(column)) {
          return { line, column, anchor: tagged };
        }
      }
    }
  }

  // Fallback for JSX rendered from imported component files (which the
  // loc-tags plugin doesn't transform).
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

// An element built from a component resolves to that component's own JSX, so a comment would annotate
// the primitive instead of the slide file's invocation of it. `_debugOwner` is the component that
// created an element; the outermost owner sourced from the slide file is that invocation. Elements the
// page wrote directly are owned by the page component, whose source is elsewhere, so this returns null
// and the caller keeps the host location.
//
// React records lines from the code the bundler handed it, which the dev transform's preamble shifts,
// so they don't match the file. The loc-tags plugin stamped the true line onto host elements, so
// comparing a tag with the same element's fiber gives the shift for this file.
export function findCommentSource(el: HTMLElement, slideId: string): SlideSourceHit | null {
  const needle = `/slides/${slideId}/index.tsx`;
  const shift = lineShift(el);
  let fiber = getFiber(el);
  let hit: SlideSourceHit | null = null;
  while (fiber) {
    const owner = fiber._debugOwner;
    const src = owner?._debugSource;
    if (src?.fileName && src.lineNumber && normalizeDebugFileName(src.fileName).endsWith(needle)) {
      hit = { line: src.lineNumber - shift, column: src.columnNumber ?? 0, anchor: el };
    } else if (owner && hit) {
      break;
    }
    fiber = fiber.return;
  }
  return hit;
}

function lineShift(el: HTMLElement): number {
  let node: HTMLElement | null = el;
  while (node) {
    const tag = node.dataset?.slideLoc;
    const line = getFiber(node)?._debugSource?.lineNumber;
    if (tag && line) {
      const tagged = Number(tag.split(':')[0]);
      if (Number.isFinite(tagged)) return line - tagged;
    }
    node = node.parentElement;
  }
  return 0;
}
