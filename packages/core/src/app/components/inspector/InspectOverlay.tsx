import { useEffect, useRef, useState } from 'react';
import { findSlideSource, type SlideSourceHit } from '@/lib/inspector/fiber';
import { CommentPopover } from './CommentPopover';
import { useInspector } from './InspectorProvider';

type Highlight = { rect: DOMRect; hit: SlideSourceHit };

export function InspectOverlay() {
  const { active, slideId, mode, pending, setPending, selected, setSelected, cancel } =
    useInspector();
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

    const findOpts = mode === 'edit' ? { hostOnly: true } : undefined;

    const onMove = (e: PointerEvent) => {
      if (pending) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return setHover(null);
      const hit = findSlideSource(el, slideId, findOpts);
      if (!hit) return setHover(null);
      setHover({ rect: hit.anchor.getBoundingClientRect(), hit });
    };

    const onClick = (e: MouseEvent) => {
      if (pending) return;
      if (e.target instanceof Element && e.target.closest('[data-inspector-ui]')) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return;
      const hit = findSlideSource(el, slideId, findOpts);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      const anchorRect = hit.anchor.getBoundingClientRect();
      if (mode === 'comment') {
        setPending({
          line: hit.line,
          column: hit.column,
          anchorRect,
          clickX: e.clientX,
          clickY: e.clientY,
        });
      } else {
        setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
      }
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
  }, [active, slideId, mode, pending, setPending, setSelected, cancel]);

  if (!active) return null;

  const overlayRect = overlayRef.current?.getBoundingClientRect();
  // In edit mode keep the highlight on the selected element so the user
  // sees what the right-side panel is editing even after the cursor moves.
  const persistentRect =
    mode === 'edit' && selected ? selected.anchor.getBoundingClientRect() : null;
  const displayRect = persistentRect ?? hover?.rect ?? null;
  const show = displayRect && overlayRect;

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
              left: displayRect.left - overlayRect.left,
              top: displayRect.top - overlayRect.top,
              width: displayRect.width,
              height: displayRect.height,
              outline: '2px solid #3b82f6',
              background: 'rgba(59,130,246,0.1)',
            }}
          />
        )}
      </div>
      {mode === 'comment' && pending && <CommentPopover />}
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
