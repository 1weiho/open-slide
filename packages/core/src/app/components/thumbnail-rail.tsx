import { memo, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../../design';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import { LazyThumbnail } from './lazy-thumbnail';
import { SlideCanvas } from './slide-canvas';

type Orientation = 'vertical' | 'horizontal';

type Props = {
  pages: Page[];
  design?: DesignSystem;
  current: number;
  onSelect: (index: number) => void;
  orientation?: Orientation;
};

const VERTICAL_THUMB_WIDTH = 184;
const HORIZONTAL_THUMB_HEIGHT = 64;

/**
 * Memoized so changing `current` in the parent only re-renders the outer
 * button (border, page-number colour). The expensive SlideCanvas subtree
 * stays put as long as its inputs are referentially stable.
 */
const ThumbnailContent = memo(function ThumbnailContent({
  PageComp,
  scale,
  design,
}: {
  PageComp: Page;
  scale: number;
  design?: DesignSystem;
}) {
  return (
    <SlideCanvas scale={scale} center={false} flat thumbnail design={design}>
      <PageComp />
    </SlideCanvas>
  );
});

export function ThumbnailRail({
  pages,
  design,
  current,
  onSelect,
  orientation = 'vertical',
}: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `current` triggers re-scroll on selection change
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [current]);

  if (orientation === 'horizontal') {
    const scale = HORIZONTAL_THUMB_HEIGHT / CANVAS_HEIGHT;
    const width = CANVAS_WIDTH * scale;
    return (
      <div className="bg-sidebar">
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            {pages.map((PageComp, i) => {
              const active = i === current;
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                  key={i}
                  type="button"
                  ref={active ? activeRef : undefined}
                  onClick={() => onSelect(i)}
                  aria-label={`Go to page ${i + 1}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn('group/thumb relative flex shrink-0 flex-col items-center gap-1.5')}
                >
                  <span
                    className={cn(
                      'font-mono text-[9.5px] font-medium tracking-[0.06em] tabular-nums uppercase',
                      active ? 'text-brand' : 'text-muted-foreground/70',
                    )}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <div
                    className={cn(
                      'relative shrink-0 overflow-hidden rounded-[4px] border bg-card transition-all',
                      active
                        ? 'border-brand shadow-[0_0_0_1px_var(--brand)]'
                        : 'border-hairline group-hover/thumb:border-foreground/25',
                    )}
                    style={{ width, height: HORIZONTAL_THUMB_HEIGHT }}
                  >
                    <LazyThumbnail sticky={false} forceMount={active}>
                      <ThumbnailContent PageComp={PageComp} scale={scale} design={design} />
                    </LazyThumbnail>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const scale = VERTICAL_THUMB_WIDTH / CANVAS_WIDTH;
  const height = CANVAS_HEIGHT * scale;
  return (
    <ScrollArea className="h-full border-r border-hairline bg-sidebar">
      <aside className="flex flex-col gap-2 px-3 py-3">
        <div className="flex items-baseline justify-between px-1 pb-1">
          <span className="eyebrow">Pages</span>
          <span className="folio">{pages.length.toString().padStart(2, '0')}</span>
        </div>
        {pages.map((PageComp, i) => {
          const active = i === current;
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
              key={i}
              type="button"
              ref={active ? activeRef : undefined}
              onClick={() => onSelect(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'group/thumb flex items-start gap-2.5 rounded-[6px] p-1.5 text-left transition-colors',
                'hover:bg-muted/60',
                active && 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'mt-1.5 w-7 shrink-0 text-right font-mono text-[10px] font-medium tracking-[0.06em] tabular-nums uppercase',
                  active ? 'text-brand' : 'text-muted-foreground/70',
                )}
              >
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div
                className={cn(
                  'relative shrink-0 overflow-hidden rounded-[4px] border bg-card transition-all',
                  active
                    ? 'border-brand shadow-[0_0_0_1px_var(--brand)]'
                    : 'border-hairline group-hover/thumb:border-foreground/25',
                )}
                style={{ width: VERTICAL_THUMB_WIDTH, height }}
              >
                <LazyThumbnail sticky={false} forceMount={active}>
                  <ThumbnailContent PageComp={PageComp} scale={scale} design={design} />
                </LazyThumbnail>
                {active && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-brand"
                  />
                )}
              </div>
            </button>
          );
        })}
      </aside>
    </ScrollArea>
  );
}
