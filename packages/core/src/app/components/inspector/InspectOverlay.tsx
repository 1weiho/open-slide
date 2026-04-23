import { useEffect, useRef, useState } from 'react';
import { findSlideSource, type SlideSourceHit } from '@/lib/inspector/fiber';
import { CommentPopover } from './CommentPopover';
import { useInspector } from './InspectorProvider';

type Highlight = { rect: DOMRect; hit: SlideSourceHit };

export function InspectOverlay() {
  const { active, slideId, pending, setPending, cancel } = useInspector();
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
      if (pending) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return setHover(null);
      const hit = findSlideSource(el, slideId);
      if (!hit) return setHover(null);
      setHover({ rect: hit.anchor.getBoundingClientRect(), hit });
    };

    const onClick = (e: MouseEvent) => {
      if (pending) return;
      if (e.target instanceof Element && e.target.closest('[data-inspector-ui]')) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return;
      const hit = findSlideSource(el, slideId);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      const anchorRect = hit.anchor.getBoundingClientRect();
      setPending({
        line: hit.line,
        column: hit.column,
        anchorRect,
        clickX: e.clientX,
        clickY: e.clientY,
      });
      setHover({ rect: anchorRect, hit });
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, slideId, pending, setPending, cancel]);

  if (!active) return null;

  const overlayRect = overlayRef.current?.getBoundingClientRect();
  const show = hover && overlayRect;

  return (
    <>
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-30"
        style={{ cursor: 'crosshair' }}
      >
        {show && (
          <div
            className="absolute"
            style={{
              left: hover.rect.left - overlayRect.left,
              top: hover.rect.top - overlayRect.top,
              width: hover.rect.width,
              height: hover.rect.height,
              outline: '2px solid #3b82f6',
              background: 'rgba(59,130,246,0.1)',
            }}
          />
        )}
      </div>
      {pending && <CommentPopover />}
    </>
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
