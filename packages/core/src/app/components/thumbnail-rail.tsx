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
import { Copy, Trash2 } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../lib/design';
import { SlidePageProvider } from '../lib/page-context';
import type { Page, SlideAspect } from '../lib/sdk';
import { getCanvasDims } from '../lib/sdk';
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
  aspect?: SlideAspect;
};

const DEFAULT_VERTICAL_THUMB_WIDTH = 184;
const VERTICAL_RAIL_CHROME = 80;
const MIN_VERTICAL_THUMB_WIDTH = 120;
const HORIZONTAL_THUMB_HEIGHT = 64;

export function ThumbnailRail({
  pages,
  design,
  current,
  onSelect,
  onReorder,
  actions,
  orientation = 'vertical',
  width,
  aspect,
}: Props) {
  const { width: canvasW, height: canvasH } = getCanvasDims(aspect);
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

  if (orientation === 'horizontal') {
    const scale = HORIZONTAL_THUMB_HEIGHT / canvasH;
    const width = canvasW * scale;
    return (
      <div className="bg-sidebar">
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            {pages.map((PageComp, i) => {
              const active = i === current;
              const button = (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                  key={i}
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
                    style={{ width, height: HORIZONTAL_THUMB_HEIGHT }}
                  >
                    <SlideCanvas
                      scale={scale}
                      center={false}
                      flat
                      freezeMotion
                      design={design}
                      aspect={aspect}
                    >
                      <SlidePageProvider index={i} total={pages.length}>
                        <PageComp />
                      </SlidePageProvider>
                    </SlideCanvas>
                  </div>
                </button>
              );
              if (!actions) return button;
              return (
                <ThumbContextMenu
                  // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                  key={i}
                  index={i}
                  actions={actions}
                  pageCount={pages.length}
                  ariaLabel={format(t.thumbnailRail.pageActionsAria, { n: i + 1 })}
                >
                  {button}
                </ThumbContextMenu>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const thumbWidth =
    width != null
      ? Math.max(MIN_VERTICAL_THUMB_WIDTH, width - VERTICAL_RAIL_CHROME)
      : DEFAULT_VERTICAL_THUMB_WIDTH;
  const scale = thumbWidth / canvasW;
  const height = canvasH * scale;

  const renderThumb = (PageComp: Page, i: number) => {
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
        aspect={aspect}
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
  };

  const list = (
    <aside className="flex flex-col gap-2 px-3 py-3">
      <div className="flex items-baseline justify-between px-1 pb-1">
        <span className="eyebrow">{t.thumbnailRail.pages}</span>
        <span className="folio">{pages.length.toString().padStart(2, '0')}</span>
      </div>
      {pages.map(renderThumb)}
    </aside>
  );

  if (!onReorder) {
    return <ScrollArea className="h-full border-r border-hairline bg-sidebar">{list}</ScrollArea>;
  }

  return (
    <ScrollArea className="h-full border-r border-hairline bg-sidebar">
      <SortableRail pages={pages} onReorder={onReorder} onSelect={onSelect}>
        {list}
      </SortableRail>
    </ScrollArea>
  );
}

function thumbButtonClass(active: boolean): string {
  return cn(
    'group/thumb flex w-full items-start gap-2.5 rounded-[6px] p-1.5 text-left motion-safe:transition-colors',
    'hover:bg-muted/60',
    active && 'bg-muted',
  );
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
  aspect,
}: {
  index: number;
  total: number;
  active: boolean;
  page: Page;
  design?: DesignSystem;
  scale: number;
  thumbWidth: number;
  height: number;
  aspect?: SlideAspect;
}) {
  return (
    <>
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
          'relative shrink-0 overflow-hidden rounded-[4px] border bg-card motion-safe:transition-[border-color,box-shadow]',
          active
            ? 'border-brand shadow-[0_0_0_1px_var(--brand)]'
            : 'border-hairline group-hover/thumb:border-foreground/25',
        )}
        style={{ width: thumbWidth, height }}
      >
        <SlideCanvas scale={scale} center={false} flat freezeMotion design={design} aspect={aspect}>
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
