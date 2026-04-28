export type SlideSourceHit = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type FindSlideSourceOptions = {
  /**
   * If true, skip fibers whose `stateNode` isn't a host HTMLElement
   * (i.e., custom React components). Use this for the visual editor,
   * which needs to mutate inline `style` on a real element — adding
   * `style={...}` to a component-invocation JSX (`<MyComp/>`) usually
   * does nothing because most components don't forward `style`. For
   * comments, leave this off so the user can annotate any JSX,
   * including component invocations.
   */
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

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Primary: read the `data-slide-loc` attribute injected at compile
  // time by the loc-tags Vite plugin. This is unambiguous, immune to
  // HMR-stale fiber state, and lands directly on the host DOM element.
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

  // Fallback: walk fibers. Used for elements whose JSX wasn't
  // transformed (e.g., rendered by an imported component file) or
  // when the plugin isn't installed.
  const needle = `/slides/${slideId}/index.tsx`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    if (src?.fileName?.endsWith(needle) && src.lineNumber && (!opts?.hostOnly || isHost)) {
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
