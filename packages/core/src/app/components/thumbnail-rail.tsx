import { type MutableRefObject, memo, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInViewport } from '@/lib/use-in-viewport';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../../design';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
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
const ACTIVE_PREVIEW_RADIUS = 2;

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
            {pages.map((PageComp, i) => (
              <HorizontalThumbnailItem
                // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                key={i}
                PageComp={PageComp}
                design={design}
                index={i}
                active={i === current}
                nearActive={Math.abs(i - current) <= ACTIVE_PREVIEW_RADIUS}
                activeRef={activeRef}
                onSelect={onSelect}
                scale={scale}
                width={width}
              />
            ))}
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
        {pages.map((PageComp, i) => (
          <VerticalThumbnailItem
            // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
            key={i}
            PageComp={PageComp}
            design={design}
            index={i}
            active={i === current}
            nearActive={Math.abs(i - current) <= ACTIVE_PREVIEW_RADIUS}
            activeRef={activeRef}
            onSelect={onSelect}
            scale={scale}
            height={height}
          />
        ))}
      </aside>
    </ScrollArea>
  );
}

type ThumbnailItemProps = {
  PageComp: Page;
  design?: DesignSystem;
  index: number;
  active: boolean;
  nearActive: boolean;
  activeRef: MutableRefObject<HTMLButtonElement | null>;
  onSelect: (index: number) => void;
};

const HorizontalThumbnailItem = memo(function HorizontalThumbnailItem({
  PageComp,
  design,
  index,
  active,
  nearActive,
  activeRef,
  onSelect,
  scale,
  width,
}: ThumbnailItemProps & {
  scale: number;
  width: number;
}) {
  const [itemRef, nearViewport] = useInViewport<HTMLButtonElement>({
    rootMargin: '0px 320px',
    once: false,
  });
  const renderPreview = nearActive || nearViewport;

  return (
    <button
      type="button"
      ref={(node) => {
        itemRef.current = node;
        if (active) activeRef.current = node;
      }}
      onClick={() => onSelect(index)}
      aria-label={`Go to page ${index + 1}`}
      aria-current={active ? 'true' : undefined}
      className={cn('group/thumb relative flex shrink-0 flex-col items-center gap-1.5')}
    >
      <span
        className={cn(
          'font-mono text-[9.5px] font-medium tracking-[0.06em] tabular-nums uppercase',
          active ? 'text-brand' : 'text-muted-foreground/70',
        )}
      >
        {(index + 1).toString().padStart(2, '0')}
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
        <ThumbnailPreview
          PageComp={PageComp}
          design={design}
          renderPreview={renderPreview}
          scale={scale}
          label={index + 1}
        />
      </div>
    </button>
  );
});

const VerticalThumbnailItem = memo(function VerticalThumbnailItem({
  PageComp,
  design,
  index,
  active,
  nearActive,
  activeRef,
  onSelect,
  scale,
  height,
}: ThumbnailItemProps & {
  scale: number;
  height: number;
}) {
  const [itemRef, nearViewport] = useInViewport<HTMLButtonElement>({
    rootMargin: '320px 0px',
    once: false,
  });
  const renderPreview = nearActive || nearViewport;

  return (
    <button
      type="button"
      ref={(node) => {
        itemRef.current = node;
        if (active) activeRef.current = node;
      }}
      onClick={() => onSelect(index)}
      aria-label={`Go to page ${index + 1}`}
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
        {(index + 1).toString().padStart(2, '0')}
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
        <ThumbnailPreview
          PageComp={PageComp}
          design={design}
          renderPreview={renderPreview}
          scale={scale}
          label={index + 1}
        />
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-brand"
          />
        )}
      </div>
    </button>
  );
});

function ThumbnailPreview({
  PageComp,
  design,
  renderPreview,
  scale,
  label,
}: {
  PageComp: Page;
  design?: DesignSystem;
  renderPreview: boolean;
  scale: number;
  label: number;
}) {
  if (!renderPreview) {
    return (
      <div className="grid h-full w-full place-items-center bg-muted/40 font-mono text-[10px] tabular-nums text-muted-foreground/50">
        {label.toString().padStart(2, '0')}
      </div>
    );
  }

  return (
    <SlideCanvas scale={scale} center={false} flat design={design}>
      <PageComp />
    </SlideCanvas>
  );
}
