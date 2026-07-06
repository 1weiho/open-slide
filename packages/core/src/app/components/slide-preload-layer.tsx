import { useEffect, useRef, useState } from 'react';
import { type DesignSystem, designToCssVars } from '../lib/design';
import { SlidePageProvider } from '../lib/page-context';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Page } from '../lib/sdk';
import { type StepController, StepHost } from '../lib/step-context';

const PAGES_PER_FRAME = 2;
const SETTLE_TIMEOUT_MS = 15_000;

type Props = {
  pages: Page[];
  index: number;
  design?: DesignSystem;
  /** Also warm the page at `index` — for use while no page is live yet. */
  includeCurrent?: boolean;
  onDone?: () => void;
};

// Per-document registry so a deck gates the UI on its first open only —
// revisits within the same tab skip straight to the slides.
const warmedDecks = new Set<string>();

export function isDeckWarmed(slideId: string): boolean {
  return warmedDecks.has(slideId);
}

export function markDeckWarmed(slideId: string): void {
  warmedDecks.add(slideId);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForImages(root: HTMLElement): Promise<unknown> {
  const pending = Array.from(root.querySelectorAll('img'))
    .filter((img) => !img.complete)
    .map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    );
  return Promise.all(pending);
}

function saveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

// Nearest upcoming pages first, wrapping around.
function computeWarmupOrder(pages: Page[], index: number, includeCurrent: boolean): number[] {
  if (saveDataEnabled()) return [];
  const start = Math.max(0, Math.min(pages.length - 1, index));
  const result: number[] = [];
  for (let step = includeCurrent ? 0 : 1; step < pages.length; step++) {
    result.push((start + step) % pages.length);
  }
  return result;
}

/**
 * Mounts every non-visible page of the deck in a hidden layer so the browser
 * fetches their images and font faces before the audience navigates to them —
 * without this, each page's assets only start downloading on entry, which
 * shows up as font flashes and image pop-in mid-presentation.
 *
 * Pages mount a few per frame to keep the first slide's paint smooth, stay
 * `visibility: hidden` (layout still runs, so text triggers font loads and
 * boxes trigger background-image loads), and the whole layer unmounts once
 * fonts and images have settled — by then everything sits in the HTTP cache.
 */
export function SlidePreloadLayer({ pages, index, design, includeCurrent = false, onDone }: Props) {
  // Warm-up order is captured on mount, not on every index change — later
  // navigation must not restart the sequence. But the deck itself can change
  // under a reused component instance (a client-side slide switch keeps this
  // route mounted, and the editor mutates `pages` on reorder/add/delete), so
  // recompute from scratch whenever the `pages` identity changes.
  const [deck, setDeck] = useState(pages);
  const [order, setOrder] = useState<number[]>(() =>
    computeWarmupOrder(pages, index, includeCurrent),
  );
  const [mountedCount, setMountedCount] = useState(0);
  const [done, setDone] = useState(order.length === 0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<StepController | null>(null);

  if (deck !== pages) {
    const nextOrder = computeWarmupOrder(pages, index, includeCurrent);
    setDeck(pages);
    setOrder(nextOrder);
    setMountedCount(0);
    setDone(nextOrder.length === 0);
  }

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  useEffect(() => {
    if (done || mountedCount >= order.length) return;
    const raf = requestAnimationFrame(() => {
      setMountedCount((n) => Math.min(order.length, n + PAGES_PER_FRAME));
    });
    return () => cancelAnimationFrame(raf);
  }, [done, mountedCount, order.length]);

  useEffect(() => {
    if (done || mountedCount < order.length) return;
    let cancelled = false;
    const settle = async () => {
      // Two frames of layout so newly mounted text has kicked off its font
      // requests before `document.fonts.ready` takes a snapshot.
      await nextFrame();
      await nextFrame();
      const root = rootRef.current;
      await Promise.all([
        'fonts' in document ? document.fonts.ready : Promise.resolve(),
        root ? waitForImages(root) : Promise.resolve(),
      ]);
    };
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, SETTLE_TIMEOUT_MS));
    Promise.race([settle(), timeout]).then(() => {
      if (!cancelled) setDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [done, mountedCount, order.length]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-osd-freeze-motion=""
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        visibility: 'hidden',
        pointerEvents: 'none',
        ...(design ? designToCssVars(design) : {}),
      }}
    >
      {order.slice(0, mountedCount).map((pageIndex) => {
        const PageComponent = pages[pageIndex];
        if (!PageComponent) return null;
        return (
          <div
            key={pageIndex}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
          >
            <SlidePageProvider index={pageIndex} total={pages.length}>
              <StepHost
                isActivePage={false}
                entryDirection="backward"
                controllerRef={controllerRef}
              >
                <PageComponent />
              </StepHost>
            </SlidePageProvider>
          </div>
        );
      })}
    </div>
  );
}
