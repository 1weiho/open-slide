import { Crop, ImageIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PANEL_TRANSITION_MS } from '@/components/panel/panel-shell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { findSlideSource, type SlideSourceHit } from '@/lib/inspector/fiber';
import { hasOnlyInlineTextChildren, INLINE_TEXT_TAGS } from '@/lib/inspector/inline-text';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { InlineTextLayer } from './inline-text-editor';
import { slideLocChildren, useInspector } from './inspector-provider';

type Highlight = { hit: SlideSourceHit };

type RelRect = { left: number; top: number; width: number; height: number };

const FRAME_FADE_MS = 150;
const FRAME_MORPH_MS = 180;
const LAYOUT_TRACK_MS = PANEL_TRANSITION_MS + FRAME_MORPH_MS;

const DRAG_THRESHOLD_PX = 6;
const DRAG_CROSS_TOLERANCE_PX = 80;

type DragSlot = { to: number; line: RelRect };
type DragState = {
  container: HTMLElement;
  from: number;
  slots: DragSlot[];
  horizontal: boolean;
  activeIndex: number | null;
};

export function InspectOverlay() {
  const {
    active,
    slideId,
    selected,
    setSelected,
    cancel,
    openCrop,
    inlineEdit,
    startInlineEdit,
    stopInlineEdit,
    moveElement,
  } = useInspector();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Highlight | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingDragRef = useRef<{ anchor: HTMLElement; x: number; y: number } | null>(null);
  const draggedDimRef = useRef<{ el: HTMLElement; opacity: string } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setHover(null);
      return;
    }

    const endDragVisuals = () => {
      const dimmed = draggedDimRef.current;
      if (dimmed) dimmed.el.style.opacity = dimmed.opacity;
      draggedDimRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    const cancelDrag = () => {
      endDragVisuals();
      dragRef.current = null;
      setDrag(null);
    };

    const beginDrag = (anchor: HTMLElement) => {
      const container = anchor.parentElement;
      const overlay = overlayRef.current;
      if (!container || !overlay) return;
      const kids = slideLocChildren(container);
      const from = kids.indexOf(anchor);
      if (from < 0 || kids.length < 2) return;

      const overlayRect = overlay.getBoundingClientRect();
      const rects = kids.map((kid) => {
        const r = kid.getBoundingClientRect();
        return {
          left: r.left - overlayRect.left,
          top: r.top - overlayRect.top,
          width: r.width,
          height: r.height,
        };
      });

      let dx = 0;
      let dy = 0;
      for (let i = 1; i < rects.length; i++) {
        dx += Math.abs(
          rects[i].left + rects[i].width / 2 - (rects[i - 1].left + rects[i - 1].width / 2),
        );
        dy += Math.abs(
          rects[i].top + rects[i].height / 2 - (rects[i - 1].top + rects[i - 1].height / 2),
        );
      }
      const horizontal = dx > dy;

      const slots: DragSlot[] = [];
      for (let k = 0; k <= rects.length; k++) {
        // Boundaries flanking the dragged element are no-ops — skip them.
        if (k === from || k === from + 1) continue;
        slots.push({ to: k < from ? k : k - 1, line: slotIndicatorLine(rects, k, horizontal) });
      }
      if (slots.length === 0) return;

      draggedDimRef.current = { el: anchor, opacity: anchor.style.opacity };
      anchor.style.opacity = '0.4';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      const state: DragState = { container, from, slots, horizontal, activeIndex: null };
      dragRef.current = state;
      setDrag(state);
    };

    const updateActiveSlot = (clientX: number, clientY: number) => {
      const state = dragRef.current;
      const overlay = overlayRef.current;
      if (!state || !overlay) return;
      const overlayRect = overlay.getBoundingClientRect();
      const px = clientX - overlayRect.left;
      const py = clientY - overlayRect.top;
      let best: number | null = null;
      let bestDist = Infinity;
      state.slots.forEach((slot, i) => {
        const { line } = slot;
        const crossOk = state.horizontal
          ? py >= line.top - DRAG_CROSS_TOLERANCE_PX &&
            py <= line.top + line.height + DRAG_CROSS_TOLERANCE_PX
          : px >= line.left - DRAG_CROSS_TOLERANCE_PX &&
            px <= line.left + line.width + DRAG_CROSS_TOLERANCE_PX;
        if (!crossOk) return;
        const dist = state.horizontal
          ? Math.abs(px - (line.left + line.width / 2))
          : Math.abs(py - (line.top + line.height / 2));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      if (best !== state.activeIndex) {
        const next = { ...state, activeIndex: best };
        dragRef.current = next;
        setDrag(next);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (dragRef.current) {
          pendingDragRef.current = null;
          cancelDrag();
          return;
        }
        if (inlineEdit) {
          stopInlineEdit();
          return;
        }
        cancel();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      if (!isInspectableEventTarget(e.target)) return;
      if (inlineEdit?.anchor.contains(e.target as Node)) return;
      const el = pickInspectorTarget(pickElement(e.clientX, e.clientY));
      if (!el) return;
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit?.anchor.dataset.slideLoc) return;
      const parent = hit.anchor.parentElement;
      if (!parent) return;
      const kids = slideLocChildren(parent);
      if (kids.length < 2 || !kids.includes(hit.anchor)) return;
      e.preventDefault();
      pendingDragRef.current = { anchor: hit.anchor, x: e.clientX, y: e.clientY };
    };

    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        e.preventDefault();
        updateActiveSlot(e.clientX, e.clientY);
        return;
      }
      const pending = pendingDragRef.current;
      if (
        pending &&
        (Math.abs(e.clientX - pending.x) > DRAG_THRESHOLD_PX ||
          Math.abs(e.clientY - pending.y) > DRAG_THRESHOLD_PX)
      ) {
        pendingDragRef.current = null;
        setHover(null);
        beginDrag(pending.anchor);
        if (dragRef.current) updateActiveSlot(e.clientX, e.clientY);
        return;
      }
      if (!isInspectableEventTarget(e.target)) return setHover(null);
      if (inlineEdit?.anchor.contains(e.target as Node)) return setHover(null);
      const el = pickInspectorTarget(pickElement(e.clientX, e.clientY));
      if (!el) return setHover(null);
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return setHover(null);
      setHover({ hit });
    };

    const onPointerUp = () => {
      pendingDragRef.current = null;
      const state = dragRef.current;
      if (!state) return;
      cancelDrag();
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      if (state.activeIndex !== null) {
        const slot = state.slots[state.activeIndex];
        moveElement(state.container, state.from, slot.to);
      }
    };

    const onPointerCancel = () => {
      pendingDragRef.current = null;
      if (dragRef.current) cancelDrag();
    };

    const onDragStart = (e: DragEvent) => {
      if (pendingDragRef.current || dragRef.current) e.preventDefault();
    };

    const onClick = (e: MouseEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!isInspectableEventTarget(e.target)) return;
      if (inlineEdit) {
        // Clicks inside the editing element move the caret natively;
        // clicks anywhere else end the inline session first.
        if (inlineEdit.anchor.contains(e.target as Node)) return;
        stopInlineEdit();
      }
      const el = pickInspectorTarget(pickElement(e.clientX, e.clientY));
      if (!el) return;
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
      setHover({ hit });
    };

    const onDblClick = (e: MouseEvent) => {
      if (!isInspectableEventTarget(e.target)) return;
      if (inlineEdit?.anchor.contains(e.target as Node)) return;
      const el = pickInspectorTarget(pickElement(e.clientX, e.clientY));
      if (!el) return;
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return;
      if (hit.anchor instanceof HTMLImageElement) {
        e.preventDefault();
        e.stopPropagation();
        setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
        openCrop(hit.anchor);
        return;
      }
      if (isEditableTextContainer(hit.anchor)) {
        e.preventDefault();
        e.stopPropagation();
        startInlineEdit({
          line: hit.line,
          column: hit.column,
          anchor: hit.anchor,
          point: { x: e.clientX, y: e.clientY },
        });
      }
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerCancel, true);
    window.addEventListener('dragstart', onDragStart, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('dblclick', onDblClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      window.removeEventListener('dragstart', onDragStart, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dblclick', onDblClick, true);
      window.removeEventListener('keydown', onKey, true);
      pendingDragRef.current = null;
      cancelDrag();
    };
  }, [
    active,
    slideId,
    setSelected,
    cancel,
    openCrop,
    inlineEdit,
    startInlineEdit,
    stopInlineEdit,
    moveElement,
  ]);

  const hoverAnchor = hover?.hit.anchor.isConnected ? hover.hit.anchor : null;
  const selectedAnchor = selected?.anchor.isConnected ? selected.anchor : null;
  const dedupedHover = !drag && hoverAnchor && hoverAnchor !== selectedAnchor ? hoverAnchor : null;
  const activeSlot = drag && drag.activeIndex !== null ? drag.slots[drag.activeIndex] : null;

  if (!active) return null;
  return (
    <div ref={overlayRef} data-inspector-ui className="pointer-events-none absolute inset-0 z-30">
      <Frame
        anchor={selectedAnchor}
        overlayRef={overlayRef}
        variant="selected"
        showImageActions
        editing={!!inlineEdit && inlineEdit.anchor === selectedAnchor}
      />
      <Frame anchor={dedupedHover} overlayRef={overlayRef} variant="hover" />
      {activeSlot && (
        <div
          className="absolute rounded-full bg-[#3b82f6] shadow-[0_0_0_1px_rgba(59,130,246,0.4)]"
          style={activeSlot.line}
        />
      )}
      <InlineTextLayer overlayRef={overlayRef} />
    </div>
  );
}

function slotIndicatorLine(rects: RelRect[], boundary: number, horizontal: boolean): RelRect {
  const prev = rects[boundary - 1];
  const next = rects[boundary];
  if (horizontal) {
    const x =
      prev && next
        ? (prev.left + prev.width + next.left) / 2
        : prev
          ? prev.left + prev.width + 4
          : next.left - 4;
    const around = [prev, next].filter(Boolean) as RelRect[];
    const top = Math.min(...around.map((r) => r.top));
    const bottom = Math.max(...around.map((r) => r.top + r.height));
    return { left: x - 1, top, width: 2, height: bottom - top };
  }
  const y =
    prev && next
      ? (prev.top + prev.height + next.top) / 2
      : prev
        ? prev.top + prev.height + 4
        : next.top - 4;
  const around = [prev, next].filter(Boolean) as RelRect[];
  const left = Math.min(...around.map((r) => r.left));
  const right = Math.max(...around.map((r) => r.left + r.width));
  return { left, top: y - 1, width: right - left, height: 2 };
}

type FrameVariant = 'selected' | 'hover';

const FRAME_STYLES: Record<FrameVariant, React.CSSProperties> = {
  selected: { outline: '2px solid #3b82f6', background: 'rgba(59,130,246,0.1)' },
  hover: { outline: '1.5px dashed #3b82f6', background: 'rgba(59,130,246,0.05)' },
};

function Frame({
  anchor,
  overlayRef,
  variant,
  showImageActions = false,
  editing = false,
}: {
  anchor: HTMLElement | null;
  overlayRef: React.RefObject<HTMLDivElement>;
  variant: FrameVariant;
  showImageActions?: boolean;
  editing?: boolean;
}) {
  const [rect, setRect] = useState<RelRect | null>(null);
  const [hasTarget, setHasTarget] = useState(false);

  const measure = useCallback(() => {
    const overlay = overlayRef.current;
    if (!anchor?.isConnected || !overlay) {
      setHasTarget(false);
      return;
    }

    const targetRect = anchor.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const next = {
      left: targetRect.left - overlayRect.left,
      top: targetRect.top - overlayRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };

    setHasTarget(true);
    setRect((prev) => (sameRect(prev, next) ? prev : next));
  }, [overlayRef, anchor]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!anchor) {
      setHasTarget(false);
      return;
    }

    let scheduled = 0;
    let tracking = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (root) resizeObserver.observe(root);
    if (overlayRef.current) resizeObserver.observe(overlayRef.current);
    resizeObserver.observe(anchor);

    const stopAt = performance.now() + LAYOUT_TRACK_MS;
    const trackPanelTransition = () => {
      measure();
      if (performance.now() < stopAt) tracking = requestAnimationFrame(trackPanelTransition);
    };
    tracking = requestAnimationFrame(trackPanelTransition);

    window.addEventListener('resize', scheduleMeasure, true);
    window.addEventListener('scroll', scheduleMeasure, true);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(scheduled);
      cancelAnimationFrame(tracking);
      window.removeEventListener('resize', scheduleMeasure, true);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [measure, overlayRef, anchor]);

  const visible = !!(hasTarget && rect);

  // First render after appearing: snap to the new rect (no transition).
  // Subsequent rect changes in the same visible session: animate.
  const [morph, setMorph] = useState(false);
  useLayoutEffect(() => {
    if (visible) {
      setMorph(true);
      return;
    }
    const t = setTimeout(() => setMorph(false), FRAME_FADE_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!rect) return null;
  const morphEase = 'var(--ease-swift)';
  const transition = morph
    ? `left ${FRAME_MORPH_MS}ms ${morphEase}, top ${FRAME_MORPH_MS}ms ${morphEase}, ` +
      `width ${FRAME_MORPH_MS}ms ${morphEase}, height ${FRAME_MORPH_MS}ms ${morphEase}, ` +
      `opacity ${FRAME_FADE_MS}ms ease-out`
    : `opacity ${FRAME_FADE_MS}ms ease-out`;

  const imageAnchor = anchor instanceof HTMLImageElement ? anchor : null;
  const actionsVisible = showImageActions && visible && !!imageAnchor;

  // While a text run is being edited inline, drop the tint so the text
  // underneath stays fully readable.
  const frameStyle = editing
    ? { ...FRAME_STYLES[variant], background: 'transparent' }
    : FRAME_STYLES[variant];

  return (
    <>
      <div
        className="absolute"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: visible ? 1 : 0,
          transition,
          ...frameStyle,
        }}
      />
      {showImageActions && imageAnchor && (
        <ImageActionPanel
          anchor={imageAnchor}
          rect={rect}
          visible={actionsVisible}
          transition={transition}
        />
      )}
    </>
  );
}

const FLOATING_PANEL_GAP = 8;

function ImageActionPanel({
  anchor,
  rect,
  visible,
  transition,
}: {
  anchor: HTMLElement;
  rect: RelRect;
  visible: boolean;
  transition: string;
}) {
  const { openCrop, openReplace } = useInspector();
  const t = useLocale();
  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          'absolute flex items-center gap-0.5 rounded-[8px] border border-border bg-popover p-1 text-popover-foreground shadow-floating',
          visible ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        style={{
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height + FLOATING_PANEL_GAP,
          transform: 'translateX(-50%)',
          opacity: visible ? 1 : 0,
          transition,
        }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={t.inspector.replace}
                onClick={(e) => {
                  e.stopPropagation();
                  openReplace(anchor);
                }}
                className="inline-flex size-7 items-center justify-center rounded-[5px] text-foreground/85 transition-[background-color,color,scale] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <ImageIcon className="size-3.5" />
              </button>
            }
          />
          <TooltipContent side="bottom" data-inspector-ui>
            {t.inspector.replace}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={t.inspector.crop}
                onClick={(e) => {
                  e.stopPropagation();
                  openCrop(anchor as HTMLImageElement);
                }}
                className="inline-flex size-7 items-center justify-center rounded-[5px] text-foreground/85 transition-[background-color,color,scale] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Crop className="size-3.5" />
              </button>
            }
          />
          <TooltipContent side="bottom" data-inspector-ui>
            {t.inspector.crop}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function sameRect(a: RelRect | null, b: RelRect): boolean {
  return (
    !!a &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

// Only inspect events that originate inside the slide root. Portaled UI
// (dialogs, tooltips, toasts) mounts on `document.body`, outside the root;
// without this guard the capture-phase window listeners swallow clicks
// meant for a dialog and select the slide element behind it instead.
function isInspectableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('[data-inspector-ui]')) return false;
  return !!target.closest('[data-inspector-root]');
}

function pickElement(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest('[data-inspector-ui]')) continue;
    if (!el.closest('[data-inspector-root]')) continue;
    return el;
  }
  return null;
}

function pickInspectorTarget(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const root = el.closest('[data-inspector-root]');
  const startedOnInlineText = INLINE_TEXT_TAGS.has(el.tagName);
  for (let cur: HTMLElement | null = el; cur && root?.contains(cur); cur = cur.parentElement) {
    if (startedOnInlineText && INLINE_TEXT_TAGS.has(cur.tagName)) continue;
    if (isEditableTextContainer(cur)) return cur;
  }
  return el;
}

function isEditableTextContainer(el: HTMLElement): boolean {
  if (!el.textContent?.trim()) return false;
  return hasOnlyInlineTextChildren(el);
}
