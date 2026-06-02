import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export const PANEL_W = 320;
const MIN_PANEL_W = 280;
const MAX_PANEL_W = 560;
export const PANEL_TRANSITION_MS = 240;

function panelWidthStorageKey(uiAttr: 'inspector' | 'design'): string {
  return `open-slide:panel-width:${uiAttr}`;
}

function readStoredPanelWidth(uiAttr: 'inspector' | 'design'): number {
  if (typeof window === 'undefined') return PANEL_W;
  const raw = window.localStorage.getItem(panelWidthStorageKey(uiAttr));
  const parsed = raw == null ? Number.NaN : Number(raw);
  if (!Number.isFinite(parsed)) return PANEL_W;
  return Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, parsed));
}

// Defer the width expansion to the next frame so the browser paints once
// at width=0 first; otherwise the transition has no starting frame.
export function useAnimatedOpen(open: boolean): boolean {
  const [animVisible, setAnimVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setAnimVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setAnimVisible(false);
  }, [open]);
  return animVisible;
}

// Stay mounted through the close-out width transition so the panel
// visibly collapses instead of vanishing.
export function usePanelMount(open: boolean): { mounted: boolean; animVisible: boolean } {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), PANEL_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);
  const animVisible = useAnimatedOpen(open && mounted);
  return { mounted, animVisible };
}

type PanelShellProps = {
  animVisible: boolean;
  uiAttr: 'inspector' | 'design';
  header: React.ReactNode;
  banner?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function PanelShell({
  animVisible,
  uiAttr,
  header,
  banner,
  footer,
  children,
}: PanelShellProps) {
  const t = useLocale();
  const dataAttrs = uiAttr === 'inspector' ? { 'data-inspector-ui': '' } : { 'data-design-ui': '' };

  const [width, setWidth] = useState(() => readStoredPanelWidth(uiAttr));
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(panelWidthStorageKey(uiAttr), String(width));
  }, [uiAttr, width]);

  useEffect(() => {
    if (!resizing) return;
    const prev = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prev.cursor;
      document.body.style.userSelect = prev.userSelect;
    };
  }, [resizing]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: width };
    setResizing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    // Panel is docked to the right edge, so dragging the left handle leftward widens it.
    const delta = dragRef.current.startX - e.clientX;
    const next = Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, dragRef.current.startWidth + delta));
    setWidth(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setResizing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.min(MAX_PANEL_W, w + step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.max(MIN_PANEL_W, w - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      setWidth(PANEL_W);
    }
  };

  return (
    <aside
      {...dataAttrs}
      className="flex h-full shrink-0 justify-end overflow-hidden bg-sidebar transition-[width,border-left-width] ease-out"
      style={{
        width: animVisible ? width : 0,
        borderLeftWidth: animVisible ? 1 : 0,
        borderLeftColor: 'var(--hairline)',
        transitionDuration: resizing ? '0ms' : `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      <div style={{ width }} className="relative flex h-full shrink-0 flex-col">
        {/* biome-ignore lint/a11y/useSemanticElements: focusable resize handle (splitter pattern), not a static <hr> */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t.common.resizePanel}
          aria-valuenow={width}
          aria-valuemin={MIN_PANEL_W}
          aria-valuemax={MAX_PANEL_W}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setWidth(PANEL_W)}
          className={cn(
            'group/resize absolute inset-y-0 left-0 z-20 w-1.5 cursor-col-resize touch-none outline-none',
            'focus-visible:bg-brand/20',
          )}
        >
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 w-px bg-brand opacity-0 transition-opacity',
              'group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100',
              resizing && 'opacity-100',
            )}
          />
        </div>
        <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3">
          {header}
        </header>
        {banner}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-full flex-col">
            {children}
            {footer && <div className="mt-auto border-t border-hairline">{footer}</div>}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
