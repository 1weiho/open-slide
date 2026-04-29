import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  pages: Page[];
  current: number;
  onSelect: (index: number) => void;
};

const THUMB_WIDTH = 200;
const THUMB_SCALE = THUMB_WIDTH / CANVAS_WIDTH;
const THUMB_HEIGHT = CANVAS_HEIGHT * THUMB_SCALE;

export function ThumbnailRail({ pages, current, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `current` triggers re-scroll on selection change
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  return (
    <ScrollArea className="h-full border-r bg-card">
      <aside className="flex flex-col gap-2.5 p-3">
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
                'flex items-center gap-2.5 rounded-lg border-2 border-transparent p-1.5 text-left transition-colors',
                'hover:bg-muted',
                active && 'border-primary bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground',
                  active && 'font-semibold text-primary',
                )}
              >
                {i + 1}
              </span>
              <div
                className="relative shrink-0 overflow-hidden rounded border bg-white shadow-sm"
                style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
              >
                <SlideCanvas scale={THUMB_SCALE} center={false} flat>
                  <PageComp />
                </SlideCanvas>
              </div>
            </button>
          );
        })}
      </aside>
    </ScrollArea>
  );
}
