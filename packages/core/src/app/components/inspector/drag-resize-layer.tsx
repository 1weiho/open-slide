import { useEffect, useRef } from 'react';
import type { EditOp } from '@/lib/inspector/use-editor';
import { CANVAS_WIDTH } from '@/lib/sdk';
import { useInspector } from './inspector-provider';

type RelRect = { left: number; top: number; width: number; height: number };

const DRAG_THRESHOLD_PX = 3;
const MIN_SIZE_PX = 8;
const HANDLE_SIZE_PX = 10;

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const CORNER_CURSOR: Record<Corner, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};

type InlineSnapshot = { translate: string; width: string; height: string };

/**
 * Movement uses the standalone `translate` property rather than `transform` so
 * it composes with whatever `transform` the slide already declares instead of
 * overwriting it.
 */
export function DragResizeLayer({
  anchor,
  rect,
  visible,
}: {
  anchor: HTMLElement;
  rect: RelRect;
  visible: boolean;
}) {
  const { selected, bufferOps } = useInspector();
  // A ref keeps the window handlers reading current props without re-binding on
  // every measure tick.
  const stateRef = useRef({ anchor, selected, bufferOps });
  stateRef.current = { anchor, selected, bufferOps };

  useEffect(() => {
    if (!visible) return;

    let drag: {
      startX: number;
      startY: number;
      baseX: number;
      baseY: number;
      scale: number;
      snapshot: InlineSnapshot;
      moved: boolean;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const { anchor: el } = stateRef.current;
      if (!el?.isConnected) return;
      if (!(e.target instanceof Element)) return;
      // Handles and every other overlay control carry this attribute; they run
      // their own gesture and must not also start a body drag.
      if (e.target.closest('[data-inspector-ui]')) return;
      if (!e.target.closest('[data-inspector-root]')) return;

      const box = el.getBoundingClientRect();
      const inside =
        e.clientX >= box.left &&
        e.clientX <= box.right &&
        e.clientY >= box.top &&
        e.clientY <= box.bottom;
      if (!inside) return;

      const base = readTranslate(el);
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: base.x,
        baseY: base.y,
        scale: canvasScale(el),
        snapshot: readInline(el),
        moved: false,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const { anchor: el } = stateRef.current;
      if (!el?.isConnected) {
        drag = null;
        return;
      }

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

      if (!drag.moved) {
        drag.moved = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      e.preventDefault();
      const x = Math.round(drag.baseX + dx / drag.scale);
      const y = Math.round(drag.baseY + dy / drag.scale);
      el.style.translate = `${x}px ${y}px`;
    };

    const onPointerUp = () => {
      const current = drag;
      drag = null;
      if (!current?.moved) return;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const { anchor: el, selected: sel, bufferOps: buffer } = stateRef.current;
      if (!el?.isConnected || !sel) return;
      const finalTranslate = el.style.translate;
      // Hand the DOM back exactly as we found it: `bufferOps` snapshots the
      // current inline value for undo, so it has to see the pre-drag state.
      restoreInline(el, current.snapshot);
      buffer(sel.line, sel.column, el, [
        { kind: 'set-style', key: 'translate', value: normaliseTranslate(finalTranslate) },
      ]);
      suppressNextClick();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      if (drag?.moved) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
        <ResizeHandle key={corner} corner={corner} rect={rect} stateRef={stateRef} />
      ))}
    </>
  );
}

function ResizeHandle({
  corner,
  rect,
  stateRef,
}: {
  corner: Corner;
  rect: RelRect;
  stateRef: React.MutableRefObject<{
    anchor: HTMLElement;
    selected: ReturnType<typeof useInspector>['selected'];
    bufferOps: ReturnType<typeof useInspector>['bufferOps'];
  }>;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const { anchor: el } = stateRef.current;
    if (!el?.isConnected) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const scale = canvasScale(el);
    const box = el.getBoundingClientRect();
    const snapshot = readInline(el);
    const base = readTranslate(el);
    const startW = box.width / scale;
    const startH = box.height / scale;
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD_PX) {
        return;
      }
      moved = true;

      // Dragging a top or left corner keeps the opposite edge pinned: the size
      // change is mirrored by an equal translate so the anchor edge stays put.
      const west = corner === 'nw' || corner === 'sw';
      const north = corner === 'nw' || corner === 'ne';
      const w = Math.max(MIN_SIZE_PX, Math.round(west ? startW - dx : startW + dx));
      const h = Math.max(MIN_SIZE_PX, Math.round(north ? startH - dy : startH + dy));
      const x = Math.round(west ? base.x + (startW - w) : base.x);
      const y = Math.round(north ? base.y + (startH - h) : base.y);

      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.translate = `${x}px ${y}px`;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      if (!moved) return;

      const { anchor: live, selected: sel, bufferOps: buffer } = stateRef.current;
      if (!live?.isConnected || !sel) return;
      const ops: EditOp[] = [
        { kind: 'set-style', key: 'width', value: live.style.width },
        { kind: 'set-style', key: 'height', value: live.style.height },
        { kind: 'set-style', key: 'translate', value: normaliseTranslate(live.style.translate) },
      ];
      restoreInline(live, snapshot);
      buffer(sel.line, sel.column, live, ops);
      suppressNextClick();
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
  };

  const top = corner === 'nw' || corner === 'ne' ? rect.top : rect.top + rect.height;
  const left = corner === 'nw' || corner === 'sw' ? rect.left : rect.left + rect.width;

  return (
    <div
      data-inspector-ui
      data-drag-resize-handle={corner}
      role="presentation"
      aria-label={`Resize ${corner}`}
      onPointerDown={onPointerDown}
      className="pointer-events-auto absolute rounded-full border border-white bg-[#3b82f6] shadow-sm"
      style={{
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        top,
        left,
        transform: 'translate(-50%, -50%)',
        cursor: CORNER_CURSOR[corner],
      }}
    />
  );
}

/**
 * Live scale of the 1920px canvas holding `el`, so screen deltas become canvas
 * pixels. Must be resolved from the element itself: the page also renders the
 * same slide into the thumbnail rail and the overview grid, each at its own
 * (much smaller) scale, and picking the wrong one multiplies every drag.
 */
function canvasScale(el: HTMLElement): number {
  const canvas = el.closest<HTMLElement>('[data-osd-canvas]');
  if (!canvas) return 1;
  const w = canvas.getBoundingClientRect().width;
  return w > 0 ? w / CANVAS_WIDTH : 1;
}

function readTranslate(el: HTMLElement): { x: number; y: number } {
  const raw = getComputedStyle(el).translate;
  if (!raw || raw === 'none') return { x: 0, y: 0 };
  const [x, y] = raw.split(' ');
  return { x: Number.parseFloat(x ?? '0') || 0, y: Number.parseFloat(y ?? '0') || 0 };
}

function readInline(el: HTMLElement): InlineSnapshot {
  return { translate: el.style.translate, width: el.style.width, height: el.style.height };
}

function restoreInline(el: HTMLElement, snap: InlineSnapshot): void {
  el.style.translate = snap.translate;
  el.style.width = snap.width;
  el.style.height = snap.height;
}

/** `0px 0px` is the default; drop it so we don't litter the source. */
function normaliseTranslate(value: string): string | null {
  const { x, y } = {
    x: Number.parseFloat(value) || 0,
    y: Number.parseFloat(value.split(' ')[1] ?? '0') || 0,
  };
  if (x === 0 && y === 0) return null;
  return `${x}px ${y}px`;
}

/**
 * A drag ends with a click event the overlay would read as "select whatever is
 * under the pointer". Swallow exactly one.
 */
function suppressNextClick(): void {
  const swallow = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('click', swallow, true);
  };
  window.addEventListener('click', swallow, true);
  // If no click follows (pointer left the window, gesture cancelled), don't
  // leave the listener armed for the user's next real click.
  setTimeout(() => window.removeEventListener('click', swallow, true), 300);
}
