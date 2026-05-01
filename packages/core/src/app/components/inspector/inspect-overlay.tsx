import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findSlideSource, type SlideSourceHit } from '@/lib/inspector/fiber';
import { useInspector } from './inspector-provider';

type Highlight = { rect: DOMRect; hit: SlideSourceHit };

type RelRect = { left: number; top: number; width: number; height: number };

const FRAME_FADE_MS = 150;
const FRAME_MORPH_MS = 180;

export function InspectOverlay() {
  const { active, slideId, selected, setSelected, cancel } = useInspector();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!active) {
      setHover(null);
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    };

    const onMove = (e: PointerEvent) => {
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return setHover(null);
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return setHover(null);
      setHover({ rect: hit.anchor.getBoundingClientRect(), hit });
    };

    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-inspector-ui]')) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return;
      const hit = findSlideSource(el, slideId, { hostOnly: true });
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
      setHover({ rect: hit.anchor.getBoundingClientRect(), hit });
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, slideId, setSelected, cancel]);

  return (
    <FrameOverlay
      active={active}
      overlayRef={overlayRef}
      // Pin to the selection so the highlight tracks what the panel
      // is editing even after the cursor moves away.
      targetRect={selected?.anchor.getBoundingClientRect() ?? hover?.rect ?? null}
    />
  );
}

function FrameOverlay({
  active,
  overlayRef,
  targetRect,
}: {
  active: boolean;
  overlayRef: React.RefObject<HTMLDivElement>;
  targetRect: DOMRect | null;
}) {
  const overlayRect = overlayRef.current?.getBoundingClientRect();
  const visible = !!(active && targetRect && overlayRect);

  // Hold the last rect so the frame stays put during fade-out, when
  // `targetRect` has already gone null.
  const lastRectRef = useRef<RelRect | null>(null);
  if (visible && targetRect && overlayRect) {
    lastRectRef.current = {
      left: targetRect.left - overlayRect.left,
      top: targetRect.top - overlayRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
  }

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

  if (!active) return null;
  const rect = lastRectRef.current;
  const transition = morph
    ? `left ${FRAME_MORPH_MS}ms ease-out, top ${FRAME_MORPH_MS}ms ease-out, ` +
      `width ${FRAME_MORPH_MS}ms ease-out, height ${FRAME_MORPH_MS}ms ease-out, ` +
      `opacity ${FRAME_FADE_MS}ms ease-out`
    : `opacity ${FRAME_FADE_MS}ms ease-out`;

  return (
    <div ref={overlayRef} data-inspector-ui className="pointer-events-none absolute inset-0 z-30">
      {rect && (
        <div
          className="absolute"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            opacity: visible ? 1 : 0,
            transition,
            outline: '2px solid #3b82f6',
            background: 'rgba(59,130,246,0.1)',
          }}
        />
      )}
    </div>
  );
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
