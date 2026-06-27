import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Grid2x2, ListOrdered, type LucideIcon, Sparkles, Trash2 } from 'lucide-react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../lib/design';
import { SlidePageProvider } from '../lib/page-context';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import type { SlideTransition } from '../lib/transition';
import { SlideCanvas } from './slide-canvas';

type Orientation = 'vertical' | 'horizontal';

export type ThumbnailActions = {
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
};

type Props = {
  pages: Page[];
  design?: DesignSystem;
  current: number;
  onSelect: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
  actions?: ThumbnailActions;
  orientation?: Orientation;
  /** Vertical-only: total rail width in px. Thumbnails scale to fit. */
  width?: number;
  /** Deck-level transition default; used to flag pages that inherit a transition. */
  moduleTransition?: SlideTransition;
  /** When provided, the vertical rail header renders a button that opens the overview grid. */
  onOverview?: () => void;
};

const DEFAULT_VERTICAL_THUMB_WIDTH = 184;
const VERTICAL_RAIL_CHROME = 80;
const MIN_VERTICAL_THUMB_WIDTH = 120;
const HORIZONTAL_THUMB_HEIGHT = 64;
const HORIZONTAL_THUMB_GAP = 8;
const HORIZONTAL_RAIL_PADDING_X = 12;
const HORIZONTAL_RAIL_PADDING_Y = 10;
const HORIZONTAL_LABEL_HEIGHT = 12;
const HORIZONTAL_LABEL_GAP = 6;
const VERTICAL_THUMB_PADDING_Y = 12;
const VERTICAL_THUMB_GAP = 8;
const VIRTUAL_OVERSCAN = 4;

export function ThumbnailRail({
  pages,
  design,
  current,
  onSelect,
  onReorder,
  actions,
  orientation = 'vertical',
  width,
  moduleTransition,
  onOverview,
}: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const t = useLocale();

  // biome-ignore lint/correctness/useExhaustiveDependencies: `current` triggers re-scroll on selection change
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    activeRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [current]);

  const thumbWidth =
    width != null
      ? Math.max(MIN_VERTICAL_THUMB_WIDTH, width - VERTICAL_RAIL_CHROME)
      : DEFAULT_VERTICAL_THUMB_WIDTH;
  const scale = thumbWidth / CANVAS_WIDTH;
  const height = CANVAS_HEIGHT * scale;
  const rowHeight = height + VERTICAL_THUMB_PADDING_Y + VERTICAL_THUMB_GAP;

  const renderThumb = useCallback(
    (PageComp: Page, i: number) => {
      const active = i === current;
      const inner = (
        <ThumbContents
          index={i}
          total={pages.length}
          active={active}
          page={PageComp}
          design={design}
          scale={scale}
          thumbWidth={thumbWidth}
          height={height}
          moduleTransition={moduleTransition}
        />
      );

      const node = onReorder ? (
        <SortableThumb
          index={i}
          active={active}
          activeRef={active ? activeRef : undefined}
          onSelect={() => onSelect(i)}
          ariaLabel={format(t.thumbnailRail.goToPageAria, { n: i + 1 })}
        >
          {inner}
        </SortableThumb>
      ) : (
        <button
          type="button"
          ref={active ? activeRef : undefined}
          onClick={() => onSelect(i)}
          aria-label={format(t.thumbnailRail.goToPageAria, { n: i + 1 })}
          aria-current={active ? 'true' : undefined}
          className={thumbButtonClass(active)}
        >
          {inner}
        </button>
      );

      if (!actions) {
        return <Fragment key={i}>{node}</Fragment>;
      }
      return (
        <ThumbContextMenu
          key={i}
          index={i}
          actions={actions}
          pageCount={pages.length}
          ariaLabel={format(t.thumbnailRail.pageActionsAria, { n: i + 1 })}
        >
          {node}
        </ThumbContextMenu>
      );
    },
    [
      actions,
      current,
      design,
      height,
      moduleTransition,
      onReorder,
      onSelect,
      pages.length,
      scale,
      thumbWidth,
      t.thumbnailRail.goToPageAria,
      t.thumbnailRail.pageActionsAria,
    ],
  );

  if (orientation === 'horizontal') {
    const scale = HORIZONTAL_THUMB_HEIGHT / CANVAS_HEIGHT;
    const horizontalWidth = CANVAS_WIDTH * scale;
    return (
      <div className="bg-sidebar">
        <div className="overflow-x-auto overflow-y-hidden">
          <HorizontalVirtualThumbList
            pages={pages}
            design={design}
            current={current}
            actions={actions}
            activeRef={activeRef}
            onSelect={onSelect}
            scale={scale}
            thumbWidth={horizontalWidth}
          />
        </div>
      </div>
    );
  }

  const list = (
    <aside className="flex flex-col gap-2 px-3 pb-3">
      <div className="-mx-3 sticky top-0 z-10 bg-sidebar px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{t.thumbnailRail.pages}</span>
          <div className="flex items-center gap-1.5">
            <span className="folio">{pages.length.toString().padStart(2, '0')}</span>
            {onOverview && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOverview}
                    aria-label={t.thumbnailRail.overviewAria}
                    className={cn(
                      'flex size-5 items-center justify-center rounded-[3px] text-muted-foreground/70 outline-none',
                      'motion-safe:transition-colors hover:bg-muted hover:text-foreground',
                      'focus-visible:ring-1 focus-visible:ring-brand',
                    )}
                  >
                    <Grid2x2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {t.thumbnailRail.overviewAria}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      <VirtualThumbList
        pages={pages}
        current={current}
        rowHeight={rowHeight}
        activeRef={activeRef}
        renderThumb={renderThumb}
      />
    </aside>
  );

  if (!onReorder) {
    return (
      <TooltipProvider delayDuration={200}>
        <ScrollArea className="h-full border-r border-hairline bg-sidebar [&_[data-slot=scroll-area-scrollbar]]:z-20">
          {list}
        </ScrollArea>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <ScrollArea className="h-full border-r border-hairline bg-sidebar [&_[data-slot=scroll-area-scrollbar]]:z-20">
        <SortableRail pages={pages} onReorder={onReorder} onSelect={onSelect}>
          {list}
        </SortableRail>
      </ScrollArea>
    </TooltipProvider>
  );
}

function thumbButtonClass(active: boolean): string {
  return cn(
    'group/thumb flex w-full items-start gap-2.5 rounded-[6px] p-1.5 text-left motion-safe:transition-colors',
    'hover:bg-muted/60',
    active && 'bg-muted',
  );
}

function HorizontalVirtualThumbList({
  pages,
  design,
  current,
  actions,
  activeRef,
  onSelect,
  scale,
  thumbWidth,
}: {
  pages: Page[];
  design?: DesignSystem;
  current: number;
  actions?: ThumbnailActions;
  activeRef: React.MutableRefObject<HTMLButtonElement | null>;
  onSelect: (index: number) => void;
  scale: number;
  thumbWidth: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const t = useLocale();
  const itemWidth = thumbWidth + HORIZONTAL_THUMB_GAP;
  const listHeight =
    HORIZONTAL_RAIL_PADDING_Y * 2 +
    HORIZONTAL_LABEL_HEIGHT +
    HORIZONTAL_LABEL_GAP +
    HORIZONTAL_THUMB_HEIGHT;
  const [range, setRange] = useState(() => getInitialVisibleRange(current, pages.length));

  const updateRange = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scrollLeft = Math.max(0, viewport.scrollLeft - HORIZONTAL_RAIL_PADDING_X);
    setRange(getVisibleRange(scrollLeft, pages.length, viewport.clientWidth, itemWidth));
  }, [itemWidth, pages.length]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const viewport = root?.parentElement;
    if (!viewport) return;
    viewportRef.current = viewport;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateRange);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);

    viewport.addEventListener('scroll', scheduleUpdate, { passive: true });
    resizeObserver.observe(viewport);
    scheduleUpdate();

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', scheduleUpdate);
      resizeObserver.disconnect();
      if (viewportRef.current === viewport) viewportRef.current = null;
    };
  }, [updateRange]);

  useLayoutEffect(() => {
    if (pages.length <= 0) return;
    const viewport = viewportRef.current ?? rootRef.current?.parentElement;
    if (!viewport) return;
    viewportRef.current = viewport;

    const clampedCurrent = Math.min(Math.max(current, 0), pages.length - 1);
    const left = HORIZONTAL_RAIL_PADDING_X + clampedCurrent * itemWidth;
    const right = left + thumbWidth;
    const viewportLeft = viewport.scrollLeft;
    const viewportRight = viewportLeft + viewport.clientWidth;

    if (left < viewportLeft) {
      viewport.scrollLeft = left;
    } else if (right > viewportRight) {
      viewport.scrollLeft = right - viewport.clientWidth;
    }

    const scrollLeft = Math.max(0, viewport.scrollLeft - HORIZONTAL_RAIL_PADDING_X);
    setRange(getVisibleRange(scrollLeft, pages.length, viewport.clientWidth, itemWidth));
  }, [current, itemWidth, pages.length, thumbWidth]);

  const visibleRange = clampVisibleRange(range, current, pages.length);
  const visible = [];
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    const PageComp = pages[i];
    const active = i === current;
    const button = (
      <button
        type="button"
        ref={active ? activeRef : undefined}
        onClick={() => onSelect(i)}
        aria-label={format(t.thumbnailRail.goToPageAria, { n: i + 1 })}
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
            'relative shrink-0 overflow-hidden rounded-[4px] border bg-card motion-safe:transition-[border-color,box-shadow]',
            active
              ? 'border-brand shadow-[0_0_0_1px_var(--brand)]'
              : 'border-hairline group-hover/thumb:border-foreground/25',
          )}
          style={{ width: thumbWidth, height: HORIZONTAL_THUMB_HEIGHT }}
        >
          <SlideCanvas scale={scale} center={false} flat freezeMotion design={design}>
            <SlidePageProvider index={i} total={pages.length}>
              <PageComp />
            </SlidePageProvider>
          </SlideCanvas>
        </div>
      </button>
    );

    visible.push(
      <div
        key={i}
        className="absolute top-2.5"
        style={{ left: HORIZONTAL_RAIL_PADDING_X + i * itemWidth, width: thumbWidth }}
      >
        {actions ? (
          <ThumbContextMenu
            index={i}
            actions={actions}
            pageCount={pages.length}
            ariaLabel={format(t.thumbnailRail.pageActionsAria, { n: i + 1 })}
          >
            {button}
          </ThumbContextMenu>
        ) : (
          button
        )}
      </div>,
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{
        width: HORIZONTAL_RAIL_PADDING_X * 2 + pages.length * itemWidth - HORIZONTAL_THUMB_GAP,
        height: listHeight,
      }}
    >
      {visible}
    </div>
  );
}

function VirtualThumbList({
  pages,
  current,
  rowHeight,
  activeRef,
  renderThumb,
}: {
  pages: Page[];
  current: number;
  rowHeight: number;
  activeRef: React.MutableRefObject<HTMLButtonElement | null>;
  renderThumb: (page: Page, index: number) => React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const [range, setRange] = useState(() => getInitialVisibleRange(current, pages.length));

  const updateRange = useCallback(() => {
    const viewport = viewportRef.current;
    const root = rootRef.current;
    if (!viewport || !root) return;
    const scrollTop = Math.max(0, viewport.scrollTop - root.offsetTop);
    setRange(getVisibleRange(scrollTop, pages.length, viewport.clientHeight, rowHeight));
  }, [pages.length, rowHeight]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    if (!viewport) return;
    viewportRef.current = viewport;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateRange);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);

    viewport.addEventListener('scroll', scheduleUpdate, { passive: true });
    resizeObserver.observe(viewport);
    scheduleUpdate();

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', scheduleUpdate);
      resizeObserver.disconnect();
      if (viewportRef.current === viewport) viewportRef.current = null;
    };
  }, [updateRange]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const root = rootRef.current;
    if (!viewport || !root) return;

    const top = root.offsetTop + current * rowHeight;
    const bottom = top + rowHeight;
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewportTop + viewport.clientHeight;

    if (top < viewportTop) {
      viewport.scrollTo({ top, behavior: scrollBehavior() });
    } else if (bottom > viewportBottom) {
      viewport.scrollTo({ top: bottom - viewport.clientHeight, behavior: scrollBehavior() });
    } else {
      activeRef.current?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: scrollBehavior(),
      });
    }
  }, [activeRef, current, rowHeight]);

  const visibleRange = clampVisibleRange(range, current, pages.length);
  const visible = [];
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    visible.push(
      <div
        key={i}
        className="absolute right-0 left-0"
        style={{ top: i * rowHeight, height: rowHeight }}
      >
        {renderThumb(pages[i], i)}
      </div>,
    );
  }

  return (
    <div ref={rootRef} className="relative" style={{ height: pages.length * rowHeight }}>
      {visible}
    </div>
  );
}

type VisibleRange = { start: number; end: number };

function clampVisibleRange(range: VisibleRange, current: number, count: number): VisibleRange {
  if (count <= 0) return { start: 0, end: 0 };
  if (range.start >= 0 && range.start < count && range.start < range.end) {
    return { start: range.start, end: Math.min(range.end, count) };
  }
  const clampedCurrent = Math.min(Math.max(current, 0), count - 1);
  return getInitialVisibleRange(clampedCurrent, count);
}

function getVisibleRange(
  scrollTop: number,
  count: number,
  viewportHeight: number,
  rowHeight: number,
): VisibleRange {
  if (count <= 0) return { start: 0, end: 0 };
  const visibleRows = Math.max(1, Math.ceil(viewportHeight / rowHeight));
  const firstVisible = Math.min(count - 1, Math.max(0, Math.floor(scrollTop / rowHeight)));
  const start = Math.max(0, firstVisible - VIRTUAL_OVERSCAN);
  const end = Math.min(count, firstVisible + visibleRows + VIRTUAL_OVERSCAN + 1);
  return { start, end };
}

function getInitialVisibleRange(current: number, count: number): VisibleRange {
  if (count <= 0) return { start: 0, end: 0 };
  const start = Math.max(0, current - VIRTUAL_OVERSCAN);
  const end = Math.min(count, current + VIRTUAL_OVERSCAN + 1);
  return { start, end };
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function ThumbContents({
  index,
  total,
  active,
  page: PageComp,
  design,
  scale,
  thumbWidth,
  height,
  moduleTransition,
}: {
  index: number;
  total: number;
  active: boolean;
  page: Page;
  design?: DesignSystem;
  scale: number;
  thumbWidth: number;
  height: number;
  moduleTransition?: SlideTransition;
}) {
  const t = useLocale();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [hasSteps, setHasSteps] = useState(false);

  // Steps live in JSX and can't be introspected statically — detect them from
  // the already-rendered thumbnail DOM, where each Step emits `data-osd-step`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-detect when the page at this slot changes (reorder/edit reuses the index)
  useEffect(() => {
    setHasSteps(boxRef.current?.querySelector('[data-osd-step]') != null);
  }, [PageComp]);

  const hasTransition = Boolean(PageComp.transition ?? moduleTransition);

  return (
    <>
      <div className="mt-1.5 flex w-7 shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'font-mono text-[10px] font-medium tracking-[0.06em] tabular-nums uppercase',
            active ? 'text-brand' : 'text-muted-foreground/70',
          )}
        >
          {(index + 1).toString().padStart(2, '0')}
        </span>
        {(hasTransition || hasSteps) && (
          <div className="flex flex-col items-end gap-0.5">
            {hasTransition && (
              <ThumbIndicator icon={Sparkles} label={t.thumbnailRail.transitionIndicator} />
            )}
            {hasSteps && (
              <ThumbIndicator icon={ListOrdered} label={t.thumbnailRail.stepsIndicator} />
            )}
          </div>
        )}
      </div>
      <div
        ref={boxRef}
        className={cn(
          'relative shrink-0 overflow-hidden rounded-[4px] border bg-card motion-safe:transition-[border-color,box-shadow]',
          active
            ? 'border-brand shadow-[0_0_0_1px_var(--brand)]'
            : 'border-hairline group-hover/thumb:border-foreground/25',
        )}
        style={{ width: thumbWidth, height }}
      >
        <SlideCanvas scale={scale} center={false} flat freezeMotion design={design}>
          <SlidePageProvider index={index} total={total}>
            <PageComp />
          </SlidePageProvider>
        </SlideCanvas>
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-brand"
          />
        )}
      </div>
    </>
  );
}

function ThumbIndicator({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className={cn(
            'flex size-3.5 items-center justify-center text-muted-foreground/55',
            'motion-safe:transition-colors group-hover/thumb:text-muted-foreground/80',
          )}
        >
          <Icon className="size-3" strokeWidth={2} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function ThumbContextMenu({
  index,
  actions,
  pageCount,
  ariaLabel,
  children,
}: {
  index: number;
  actions: ThumbnailActions;
  pageCount: number;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const t = useLocale();
  const canDelete = pageCount > 1;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild aria-label={ariaLabel}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[180px]">
        <ContextMenuItem onSelect={() => actions.onDuplicate(index)}>
          <Copy />
          {t.thumbnailRail.duplicatePage}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          disabled={!canDelete}
          onSelect={() => {
            if (canDelete) actions.onDelete(index);
          }}
        >
          <Trash2 />
          {t.thumbnailRail.deletePage}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SortableRail({
  pages,
  onReorder,
  onSelect,
  children,
}: {
  pages: Page[];
  onReorder: (from: number, to: number) => void;
  onSelect: (index: number) => void;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = pages.map((_, i) => i + 1);

  const handleDragStart = (event: DragStartEvent) => {
    const i = (event.active.id as number) - 1;
    if (i >= 0) onSelect(i);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = (active.id as number) - 1;
    const to = (over.id as number) - 1;
    if (from < 0 || to < 0 || from === to) return;
    onReorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

function SortableThumb({
  index,
  active,
  activeRef,
  onSelect,
  ariaLabel,
  children,
  ...rest
}: {
  index: number;
  active: boolean;
  activeRef: React.MutableRefObject<HTMLButtonElement | null> | undefined;
  onSelect: () => void;
  ariaLabel: string;
  children: React.ReactNode;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-label' | 'aria-current' | 'type' | 'style' | 'className' | 'ref' | 'children'
>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index + 1,
  });

  const setRef = (node: HTMLButtonElement | null) => {
    setNodeRef(node);
    if (activeRef) activeRef.current = node;
  };

  const yOnlyTransform = transform ? { ...transform, x: 0 } : transform;

  return (
    <button
      {...rest}
      ref={setRef}
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-current={active ? 'true' : undefined}
      style={{
        transform: CSS.Transform.toString(yOnlyTransform),
        transition,
        touchAction: 'none',
      }}
      className={cn(
        thumbButtonClass(active),
        isDragging && 'z-10 cursor-grabbing opacity-60 shadow-edge ring-1 ring-brand',
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </button>
  );
}
