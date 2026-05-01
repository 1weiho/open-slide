import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../../design';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  pages: Page[];
  design?: DesignSystem;
  current: number;
  onSelect: (index: number) => void;
};

const THUMB_WIDTH = 200;
const THUMB_SCALE = THUMB_WIDTH / CANVAS_WIDTH;
const THUMB_HEIGHT = CANVAS_HEIGHT * THUMB_SCALE;

export function ThumbnailRail({ pages, design, current, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `current` triggers re-scroll on selection change
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  return (
    <aside className="flex h-full flex-col border-r bg-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Pages
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {pages.length}
        </span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-2.5">
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
                  'group relative flex items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition-[background-color,box-shadow,transform]',
                  'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50',
                  active && 'bg-primary/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'w-5 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground/80 transition-colors',
                    active && 'font-semibold text-primary',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div
                  className={cn(
                    'relative shrink-0 overflow-hidden rounded-md bg-white shadow-sm transition-shadow',
                    'ring-1 ring-black/[0.06] group-hover:shadow-md',
                    active &&
                      'shadow-md ring-2 ring-primary/80 ring-offset-2 ring-offset-card',
                  )}
                  style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
                >
                  <SlideCanvas scale={THUMB_SCALE} center={false} flat design={design}>
                    <PageComp />
                  </SlideCanvas>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
