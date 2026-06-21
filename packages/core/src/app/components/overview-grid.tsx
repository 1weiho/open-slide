import { ListOrdered, type LucideIcon, Sparkles, X } from 'lucide-react';
import { type Ref, useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../lib/design';
import { SlidePageProvider } from '../lib/page-context';
import type { Page } from '../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import type { SlideTransition } from '../lib/transition';
import { SlideCanvas } from './slide-canvas';

const THUMB_W = 320;
const THUMB_H = (THUMB_W * CANVAS_HEIGHT) / CANVAS_WIDTH;

export type OverviewVariant = 'present' | 'editor';

type Props = {
  pages: Page[];
  design?: DesignSystem;
  open: boolean;
  current: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  variant?: OverviewVariant;
  moduleTransition?: SlideTransition;
  tooltipContainer?: HTMLElement | null;
};

export function OverviewGrid({
  pages,
  design,
  open,
  current,
  onClose,
  onSelect,
  variant = 'present',
  moduleTransition,
  tooltipContainer,
}: Props) {
  const [focused, setFocused] = useState(current);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef<HTMLButtonElement | null>(null);
  const t = useLocale();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync on open transition
  useEffect(() => {
    if (open) setFocused(current);
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `focused` swaps which button holds the ref; we must re-run to focus the new node
  useEffect(() => {
    if (!open) return;
    focusedRef.current?.focus();
    focusedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focused, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      const cols = computeCols(gridRef.current);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        setFocused((i) => Math.min(pages.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setFocused((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setFocused((i) => Math.min(pages.length - 1, i + cols));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setFocused((i) => Math.max(0, i - cols));
      } else if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        setFocused(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        setFocused(pages.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(focused);
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, pages.length, focused, onClose, onSelect]);

  if (!open) return null;

  const styles = variant === 'present' ? presentStyles : editorStyles;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.present.overviewDialogAria}
      className={cn('absolute inset-0 z-50 flex flex-col backdrop-blur-sm', styles.surface)}
    >
      <div className="flex shrink-0 items-center justify-between px-8 pt-6 pb-3">
        <span className={cn('eyebrow', styles.eyebrow)}>{t.present.overviewEyebrow}</span>
        <div className="flex items-center gap-3">
          <span className={cn('font-mono text-[11px] tabular-nums', styles.eyebrow)}>
            {(focused + 1).toString().padStart(2, '0')} · {pages.length.toString().padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className={cn(
              'flex size-6 items-center justify-center rounded-[4px] outline-none transition-colors',
              styles.closeButton,
            )}
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div ref={gridRef} className="min-h-0 flex-1 overflow-auto px-8 pb-8">
        <TooltipProvider delayDuration={200}>
          <div
            className="grid justify-center gap-5"
            style={{
              gridTemplateColumns: `repeat(auto-fill, ${THUMB_W}px)`,
            }}
          >
            {pages.map((PageComp, i) => {
              const isFocused = i === focused;
              const isCurrent = i === current;
              return (
                <OverviewThumb
                  // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                  key={i}
                  buttonRef={isFocused ? focusedRef : undefined}
                  page={PageComp}
                  index={i}
                  total={pages.length}
                  design={design}
                  isFocused={isFocused}
                  isCurrent={isCurrent}
                  styles={styles}
                  moduleTransition={moduleTransition}
                  tooltipContainer={tooltipContainer}
                  onFocus={() => setFocused(i)}
                  onSelect={() => {
                    onSelect(i);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

function OverviewThumb({
  page: PageComp,
  index,
  total,
  design,
  isFocused,
  isCurrent,
  styles,
  moduleTransition,
  tooltipContainer,
  onFocus,
  onSelect,
  buttonRef,
}: {
  page: Page;
  index: number;
  total: number;
  design?: DesignSystem;
  isFocused: boolean;
  isCurrent: boolean;
  styles: OverviewStyles;
  moduleTransition?: SlideTransition;
  tooltipContainer?: HTMLElement | null;
  onFocus: () => void;
  onSelect: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const t = useLocale();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [hasSteps, setHasSteps] = useState(false);
  const hasTransition = Boolean(PageComp.transition ?? moduleTransition);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-detect when the page at this slot changes
  useEffect(() => {
    setHasSteps(boxRef.current?.querySelector('[data-osd-step]') != null);
  }, [PageComp]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      aria-label={format(t.present.overviewGoToAria, { n: index + 1 })}
      aria-current={isCurrent ? 'true' : undefined}
      className={cn(
        'group/thumb flex flex-col items-start gap-2 rounded-[6px] p-1.5 outline-none transition-colors',
        isFocused ? styles.thumbFocused : styles.thumbHover,
      )}
    >
      <div
        ref={boxRef}
        className={cn(
          'relative w-full overflow-hidden rounded-[4px] ring-1 transition-shadow',
          styles.thumbSurface,
          isFocused ? 'ring-2 ring-[var(--brand,#ef4444)]' : styles.thumbRing,
        )}
        style={{ height: THUMB_H }}
      >
        <SlideCanvas
          scale={THUMB_W / CANVAS_WIDTH}
          center={false}
          flat
          freezeMotion
          design={design}
        >
          <SlidePageProvider index={index} total={total}>
            <PageComp />
          </SlidePageProvider>
        </SlideCanvas>
        {isCurrent && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 right-1.5 rounded-[3px] bg-[var(--brand,#ef4444)] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.06em] uppercase text-white"
          >
            {t.present.nowBadge}
          </span>
        )}
      </div>
      <div className="flex h-4 w-full items-center justify-between gap-2">
        <span
          className={cn(
            'font-mono text-[10.5px] tracking-[0.08em] tabular-nums uppercase',
            isFocused || isCurrent ? styles.labelActive : styles.labelMuted,
          )}
        >
          {(index + 1).toString().padStart(2, '0')}
        </span>
        {(hasTransition || hasSteps) && (
          <span className="flex items-center gap-1">
            {hasTransition && (
              <OverviewIndicator
                icon={Sparkles}
                label={t.thumbnailRail.transitionIndicator}
                className={styles.indicator}
                tooltipContainer={tooltipContainer}
              />
            )}
            {hasSteps && (
              <OverviewIndicator
                icon={ListOrdered}
                label={t.thumbnailRail.stepsIndicator}
                className={styles.indicator}
                tooltipContainer={tooltipContainer}
              />
            )}
          </span>
        )}
      </div>
    </button>
  );
}

function OverviewIndicator({
  icon: Icon,
  label,
  className,
  tooltipContainer,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
  tooltipContainer?: HTMLElement | null;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className={cn('flex size-4 items-center justify-center', className)}
        >
          <Icon className="size-3.5" strokeWidth={1.9} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} container={tooltipContainer ?? undefined}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type OverviewStyles = {
  surface: string;
  eyebrow: string;
  thumbFocused: string;
  thumbHover: string;
  thumbSurface: string;
  thumbRing: string;
  labelActive: string;
  labelMuted: string;
  indicator: string;
  closeButton: string;
};

const presentStyles = {
  surface: 'bg-black/95',
  eyebrow: 'text-white/55',
  thumbFocused: 'bg-white/10',
  thumbHover: 'hover:bg-white/5',
  thumbSurface: 'bg-black',
  thumbRing: 'ring-white/10',
  labelActive: 'text-white/85',
  labelMuted: 'text-white/45',
  indicator: 'text-white/45 transition-colors group-hover/thumb:text-white/75',
  closeButton:
    'text-white/55 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40',
} as const;

const editorStyles = {
  surface: 'bg-background/95',
  eyebrow: 'text-muted-foreground',
  thumbFocused: 'bg-muted',
  thumbHover: 'hover:bg-muted/60',
  thumbSurface: 'bg-card',
  thumbRing: 'ring-hairline',
  labelActive: 'text-foreground',
  labelMuted: 'text-muted-foreground/60',
  indicator: 'text-muted-foreground/60 transition-colors group-hover/thumb:text-muted-foreground',
  closeButton:
    'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
} as const;

function computeCols(grid: HTMLDivElement | null) {
  if (!grid) return 4;
  const inner = grid.firstElementChild as HTMLElement | null;
  if (!inner) return 4;
  const cs = getComputedStyle(inner);
  const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
  return Math.max(1, cols);
}
