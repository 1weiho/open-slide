import { Crop, ImageIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PANEL_TRANSITION_MS } from '@/components/panel/panel-shell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { findSlideSource, type SlideSourceHit } from '@/lib/inspector/fiber';
import {
  isInspectableEventTarget,
  pickElement,
  pickInspectorTarget,
} from '@/lib/inspector/pick-target';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { useInspector } from './inspector-provider';

type Highlight = { hit: SlideSourceHit };

type RelRect = { left: number; top: number; width: number; height: number };

const FRAME_FADE_MS = 150;
const FRAME_MORPH_MS = 180;
const LAYOUT_TRACK_MS = PANEL_TRANSITION_MS + FRAME_MORPH_MS;

export function InspectOverlay() {
  const { active, slideId, selected, setSelected, cancel, openCrop, inlineEdit } = useInspector();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!active) {
      setHover(null);
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // The inline edit layer owns Escape while a text run is being edited.
        if (inlineEdit) return;
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!isInspectableEventTarget(e.target)) return setHover(null);
      if (inlineEdit?.anchor.contains(e.target as Node)) return setHover(null);
      const el = pickInspectorTarget(pickElement(e.clientX, e.clientY));
      if (!el) return setHover(null);
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return setHover(null);
      setHover({ hit });
    };

    const onClick = (e: MouseEvent) => {
      if (!isInspectableEventTarget(e.target)) return;
      // Clicks inside the inline-editing element move the caret natively.
      if (inlineEdit?.anchor.contains(e.target as Node)) return;
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
      if (!(hit.anchor instanceof HTMLImageElement)) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
      openCrop(hit.anchor);
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('dblclick', onDblClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dblclick', onDblClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, slideId, setSelected, cancel, openCrop, inlineEdit]);

  const hoverAnchor = hover?.hit.anchor.isConnected ? hover.hit.anchor : null;
  const selectedAnchor = selected?.anchor.isConnected ? selected.anchor : null;
  const dedupedHover = hoverAnchor && hoverAnchor !== selectedAnchor ? hoverAnchor : null;

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
    </div>
  );
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
