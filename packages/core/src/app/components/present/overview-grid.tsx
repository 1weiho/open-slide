import { useEffect, useRef, useState } from 'react';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../../lib/design';
import type { Page } from '../../lib/sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/sdk';
import { SlideCanvas } from '../slide-canvas';

const THUMB_W = 320;
const THUMB_H = (THUMB_W * CANVAS_HEIGHT) / CANVAS_WIDTH;

type Props = {
  pages: Page[];
  design?: DesignSystem;
  open: boolean;
  current: number;
  onClose: () => void;
  onSelect: (index: number) => void;
};

export function PresentOverviewGrid({ pages, design, open, current, onClose, onSelect }: Props) {
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
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.present.overviewDialogAria}
      className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-baseline justify-between px-8 pt-6 pb-3">
        <span className="eyebrow text-white/55">{t.present.overviewEyebrow}</span>
        <span className="font-mono text-[11px] text-white/55 tabular-nums">
          {(focused + 1).toString().padStart(2, '0')} · {pages.length.toString().padStart(2, '0')}
        </span>
      </div>
      <div ref={gridRef} className="min-h-0 flex-1 overflow-auto px-8 pb-8">
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${THUMB_W}px, 1fr))`,
          }}
        >
          {pages.map((PageComp, i) => {
            const isFocused = i === focused;
            const isCurrent = i === current;
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: pages list is render-stable
                key={i}
                ref={isFocused ? focusedRef : undefined}
                type="button"
                onClick={() => {
                  onSelect(i);
                  onClose();
                }}
                onMouseEnter={() => setFocused(i)}
                aria-label={format(t.present.overviewGoToAria, { n: i + 1 })}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'group/thumb flex flex-col items-start gap-2 rounded-[6px] p-1.5 outline-none transition-colors',
                  isFocused ? 'bg-white/10' : 'hover:bg-white/5',
                )}
              >
                <div
                  className={cn(
                    'relative w-full overflow-hidden rounded-[4px] bg-black ring-1 ring-white/10 transition-shadow',
                    isFocused && 'ring-2 ring-[var(--brand,#ef4444)]',
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
                    <PageComp />
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
                <span
                  className={cn(
                    'font-mono text-[10.5px] tracking-[0.08em] tabular-nums uppercase',
                    isFocused || isCurrent ? 'text-white/85' : 'text-white/45',
                  )}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function computeCols(grid: HTMLDivElement | null) {
  if (!grid) return 4;
  const inner = grid.firstElementChild as HTMLElement | null;
  if (!inner) return 4;
  const cs = getComputedStyle(inner);
  const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
  return Math.max(1, cols);
}
