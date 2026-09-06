import { Crop, ImageIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findSlideSource } from '@/lib/inspector/fiber';
import {
  type Guide,
  type Point,
  type Rect,
  type ResizeHandle,
  resizeRect,
  snapMove,
  unionRects,
} from '@/lib/inspector/geometry';
import {
  isInspectableEventTarget,
  pickElement,
  pickInspectorTarget,
} from '@/lib/inspector/pick-target';
import type { VisualEdit } from '@/lib/inspector/use-visual-editor';
import {
  type Canvas,
  canTransform,
  captureTransform,
  editableTargets,
  independentTargets,
  moveOps,
  previewOps,
  readCanvas,
  readFrame,
  restoreTransform,
  round,
  sizeOps,
  styleOp,
  type TransformSnapshot,
} from '@/lib/inspector/visual-dom';
import { isTypingTarget } from '@/lib/keys';
import { format, useLocale } from '@/lib/use-locale';
import { type SelectedTarget, useInspector } from './inspector-provider';

type Gesture = {
  pointerId: number;
  start: Point;
  targets: SelectedTarget[];
  mode: 'move' | 'marquee' | 'rotate' | ResizeHandle;
  snapshots: TransformSnapshot[];
  canvas: Canvas;
  bounds: Rect | null;
  candidates: Rect[];
  moved: boolean;
  edits: VisualEdit[];
  previousSelection: SelectedTarget[];
  additive: boolean;
};

type ScreenRect = { left: number; top: number; width: number; height: number };
const HANDLES: { handle: ResizeHandle; x: number; y: number; cursor: string }[] = [
  { handle: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { handle: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
  { handle: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
  { handle: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
  { handle: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
  { handle: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
  { handle: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
  { handle: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
];

export function InspectOverlay() {
  const {
    active,
    slideId,
    selection,
    selected,
    setSelection,
    cancel,
    openCrop,
    openReplace,
    inlineEdit,
    committing,
    bufferBatch,
    visual,
    opsVersion,
  } = useInspector();
  const t = useLocale();
  const overlayRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<(() => void) | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [hover, setHover] = useState<HTMLElement | null>(null);
  const [localTargets, setLocalTargets] = useState<SelectedTarget[] | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const frameIds = useRef(new WeakMap<HTMLElement, number>());
  const nextFrameId = useRef(0);
  const [frames, setFrames] = useState<(ScreenRect & { id: number })[]>([]);
  const [hoverFrame, setHoverFrame] = useState<ScreenRect | null>(null);
  const [canvasFrame, setCanvasFrame] = useState<ScreenRect | null>(null);
  const [scale, setScale] = useState(1);
  const displayed = localTargets ?? selection;

  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const style = document.createElement('style');
    style.textContent = EDITING_FREEZE_CSS;
    document.head.appendChild(style);
    root.dataset.inspectorEditing = 'true';
    return () => {
      style.remove();
      delete root.dataset.inspectorEditing;
    };
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    void opsVersion;
    let raf = 0;
    const stopAt = performance.now() + 420;
    const measure = () => {
      const overlay = overlayRef.current;
      const canvas = readCanvas();
      if (!overlay || !canvas) return;
      const origin = overlay.getBoundingClientRect();
      const rect = (anchor: HTMLElement): ScreenRect => {
        const box = anchor.getBoundingClientRect();
        return {
          left: box.left - origin.left,
          top: box.top - origin.top,
          width: box.width,
          height: box.height,
        };
      };
      const next = displayed
        .filter((target) => target.anchor.isConnected)
        .map((target) => {
          let id = frameIds.current.get(target.anchor);
          if (id === undefined) {
            id = ++nextFrameId.current;
            frameIds.current.set(target.anchor, id);
          }
          return { ...rect(target.anchor), id };
        });
      setFrames((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      const nextHover =
        hover?.isConnected && !displayed.some((target) => target.anchor === hover)
          ? rect(hover)
          : null;
      setHoverFrame((previous) =>
        JSON.stringify(previous) === JSON.stringify(nextHover) ? previous : nextHover,
      );
      const nextCanvas = rect(canvas.root);
      setCanvasFrame((previous) =>
        JSON.stringify(previous) === JSON.stringify(nextCanvas) ? previous : nextCanvas,
      );
      setScale(canvas.scale);
    };
    const track = () => {
      measure();
      if (performance.now() < stopAt) raf = requestAnimationFrame(track);
    };
    measureRef.current = measure;
    track();
    const observer = new ResizeObserver(measure);
    if (overlayRef.current) observer.observe(overlayRef.current);
    for (const target of displayed) if (target.anchor.isConnected) observer.observe(target.anchor);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      measureRef.current = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, displayed, hover, opsVersion]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let pendingMove: PointerEvent | null = null;
    const clearGesture = (restore: boolean) => {
      const gesture = gestureRef.current;
      if (restore) for (const snapshot of gesture?.snapshots ?? []) restoreTransform(snapshot);
      if (gesture) delete gesture.canvas.root.dataset.visualGesture;
      gestureRef.current = null;
      setLocalTargets(null);
      setGuides([]);
      setMarquee(null);
      measureRef.current?.();
      document.documentElement.style.removeProperty('cursor');
      document.documentElement.style.removeProperty('--osd-gesture-cursor');
    };
    const targetAt = (event: PointerEvent): SelectedTarget | null => {
      const element = pickInspectorTarget(pickElement(event.clientX, event.clientY));
      return element ? findSlideSource(element, slideId, { hostOnly: true }) : null;
    };
    const point = (event: PointerEvent, canvas: Canvas): Point => ({
      x: (event.clientX - canvas.rect.left) / canvas.scale,
      y: (event.clientY - canvas.rect.top) / canvas.scale,
    });
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || committing || gestureRef.current) return;
      const element = event.target instanceof Element ? event.target : null;
      const handle = element?.closest<HTMLElement>('[data-resize-handle], [data-rotate-handle]');
      if (!handle && !isInspectableEventTarget(event.target)) return;
      if (!handle && inlineEdit?.anchor.contains(event.target as Node)) return;
      const canvas = readCanvas();
      if (!canvas) return;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      let hit = handle ? selected : targetAt(event);
      if (hit && !handle && !event.metaKey && !event.ctrlKey) {
        const hitAnchor = hit.anchor;
        const ancestor = selection.find((target) => target.anchor.contains(hitAnchor));
        if (ancestor && !event.shiftKey) hit = ancestor;
        const frame = readFrame(hit.anchor, canvas);
        const background =
          Math.abs(frame.x) < 1 &&
          Math.abs(frame.y) < 1 &&
          frame.width >= canvas.width - 1 &&
          frame.height >= canvas.height - 1;
        if (background && !selection.some((target) => target.anchor === hit?.anchor)) hit = null;
      }
      let targets = selection;
      if (hit && !handle) {
        if (event.shiftKey) {
          targets = selection.some((target) => target.anchor === hit.anchor)
            ? selection.filter((target) => target.anchor !== hit.anchor)
            : [
                ...selection.filter(
                  (target) =>
                    !target.anchor.contains(hit.anchor) && !hit.anchor.contains(target.anchor),
                ),
                hit,
              ];
        } else if (!selection.some((target) => target.anchor === hit.anchor)) targets = [hit];
      } else if (!hit) targets = event.shiftKey ? selection : [];
      const mode = handle?.hasAttribute('data-rotate-handle')
        ? 'rotate'
        : (handle?.dataset.resizeHandle as ResizeHandle | undefined);
      const chosen = independentTargets(targets);
      const transformable =
        chosen.length > 0 && chosen.every((target) => canTransform(target, canvas));
      const snapshots = transformable
        ? chosen.map((target) => captureTransform(target, canvas))
        : [];
      const bounds = unionRects(snapshots.map((snapshot) => snapshot.frame));
      const candidates = editableTargets(canvas, slideId)
        .filter(
          (target) =>
            !chosen.some(
              (selectedTarget) =>
                selectedTarget.anchor.contains(target.anchor) ||
                target.anchor.contains(selectedTarget.anchor),
            ),
        )
        .map((target) => readFrame(target.anchor, canvas));
      candidates.push({ x: 0, y: 0, width: canvas.width, height: canvas.height });
      gestureRef.current = {
        pointerId: event.pointerId,
        start: point(event, canvas),
        targets: chosen,
        mode: hit ? (mode ?? 'move') : 'marquee',
        snapshots,
        canvas,
        bounds,
        candidates,
        moved: false,
        edits: [],
        previousSelection: selection,
        additive: event.shiftKey,
      };
      canvas.root.dataset.visualGesture = 'true';
      setLocalTargets(chosen);
      suppressClick.current = true;
      event.preventDefault();
      event.stopPropagation();
    };
    const update = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const current = point(event, gesture.canvas);
      let delta = { x: current.x - gesture.start.x, y: current.y - gesture.start.y };
      if (!gesture.moved && Math.hypot(delta.x, delta.y) * gesture.canvas.scale < 3) return;
      gesture.moved = true;
      if (gesture.mode === 'marquee') {
        const rect = {
          x: Math.min(gesture.start.x, current.x),
          y: Math.min(gesture.start.y, current.y),
          width: Math.abs(delta.x),
          height: Math.abs(delta.y),
        };
        setMarquee(rect);
        const targets = editableTargets(gesture.canvas, slideId).filter((target) => {
          if (!canTransform(target, gesture.canvas)) return false;
          const frame = readFrame(target.anchor, gesture.canvas);
          if (
            Math.abs(frame.x) < 1 &&
            Math.abs(frame.y) < 1 &&
            frame.width >= gesture.canvas.width - 1 &&
            frame.height >= gesture.canvas.height - 1
          )
            return false;
          return (
            frame.x >= rect.x &&
            frame.y >= rect.y &&
            frame.x + frame.width <= rect.x + rect.width &&
            frame.y + frame.height <= rect.y + rect.height
          );
        });
        gesture.targets = independentTargets(
          [...(gesture.additive ? gesture.previousSelection : []), ...targets].filter(
            (target, index, all) =>
              all.findIndex((other) => other.anchor === target.anchor) === index,
          ),
        );
        setLocalTargets(gesture.targets);
        return;
      }
      if (!gesture.bounds || !gesture.snapshots.length) return;
      const cursor =
        gesture.mode === 'move'
          ? 'grabbing'
          : gesture.mode === 'rotate'
            ? 'crosshair'
            : `${gesture.mode}-resize`;
      document.documentElement.style.cursor = cursor;
      document.documentElement.style.setProperty('--osd-gesture-cursor', cursor);
      let nextGuides: Guide[] = [];
      if (gesture.mode === 'move') {
        const horizontal = event.shiftKey && Math.abs(delta.x) >= Math.abs(delta.y);
        const vertical = event.shiftKey && !horizontal;
        if (horizontal) delta.y = 0;
        if (vertical) delta.x = 0;
        if (visual.snapping && !event.altKey) {
          const snapped = snapMove(
            gesture.bounds,
            delta,
            gesture.candidates,
            6 / gesture.canvas.scale,
          );
          delta = { x: vertical ? 0 : snapped.delta.x, y: horizontal ? 0 : snapped.delta.y };
          nextGuides = snapped.guides.filter(
            (guide) => !(horizontal && guide.axis === 'y') && !(vertical && guide.axis === 'x'),
          );
        }
        gesture.edits = gesture.snapshots.map((snapshot) => ({
          ...snapshot.target,
          ops: moveOps(snapshot, delta, gesture.canvas),
        }));
      } else if (gesture.mode === 'rotate') {
        const center = {
          x: gesture.bounds.x + gesture.bounds.width / 2,
          y: gesture.bounds.y + gesture.bounds.height / 2,
        };
        const startAngle = Math.atan2(gesture.start.y - center.y, gesture.start.x - center.x);
        const angle = Math.atan2(current.y - center.y, current.x - center.x);
        const snapshot = gesture.snapshots[0];
        let rotation = snapshot.rotation + ((angle - startAngle) * 180) / Math.PI;
        if (event.shiftKey) rotation = Math.round(rotation / 15) * 15;
        gesture.edits = [{ ...snapshot.target, ops: [styleOp('rotate', `${round(rotation)}deg`)] }];
      } else {
        const snapshot = gesture.snapshots[0];
        const frame = resizeRect(snapshot.frame, gesture.mode, delta, event.shiftKey);
        gesture.edits = [{ ...snapshot.target, ops: sizeOps(snapshot, frame, gesture.canvas) }];
      }
      for (const edit of gesture.edits) previewOps(edit.anchor, edit.ops);
      setGuides(nextGuides);
      measureRef.current?.();
    };
    const onMove = (event: PointerEvent) => {
      if (gestureRef.current) {
        pendingMove = event;
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            if (pendingMove) update(pendingMove);
            pendingMove = null;
          });
        return;
      }
      if (
        !isInspectableEventTarget(event.target) ||
        inlineEdit?.anchor.contains(event.target as Node)
      ) {
        setHover(null);
        return;
      }
      setHover(targetAt(event)?.anchor ?? null);
    };
    const onUp = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      cancelAnimationFrame(raf);
      raf = 0;
      pendingMove = null;
      if (gesture.snapshots.some((snapshot) => !snapshot.target.anchor.isConnected)) {
        clearGesture(true);
        return;
      }
      update(event);
      for (const snapshot of gesture.snapshots) restoreTransform(snapshot);
      if (gesture.moved && gesture.edits.length) bufferBatch(gesture.edits);
      setSelection(gesture.targets);
      clearGesture(false);
    };
    const onCancel = (event: Event) => {
      if (event instanceof PointerEvent && event.pointerId !== gestureRef.current?.pointerId)
        return;
      cancelAnimationFrame(raf);
      raf = 0;
      pendingMove = null;
      clearGesture(true);
    };
    const onClick = (event: MouseEvent) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        if (
          isInspectableEventTarget(event.target) ||
          (event.target instanceof Element &&
            event.target.closest('[data-resize-handle], [data-rotate-handle]'))
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }
      if (
        !isInspectableEventTarget(event.target) ||
        inlineEdit?.anchor.contains(event.target as Node)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onDoubleClick = (event: MouseEvent) => {
      if (!isInspectableEventTarget(event.target)) return;
      const element = pickInspectorTarget(pickElement(event.clientX, event.clientY));
      const hit = element ? findSlideSource(element, slideId, { hostOnly: true }) : null;
      if (!(hit?.anchor instanceof HTMLImageElement)) return;
      event.preventDefault();
      event.stopPropagation();
      setSelection([hit]);
      openCrop(hit.anchor);
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.isComposing ||
        event.keyCode === 229 ||
        inlineEdit ||
        isTypingTarget(event.target)
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (gestureRef.current) {
        cancelAnimationFrame(raf);
        raf = 0;
        pendingMove = null;
        clearGesture(true);
      } else if (selection.length) setSelection([]);
      else cancel();
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onCancel, true);
    window.addEventListener('blur', onCancel);
    window.addEventListener('click', onClick, true);
    window.addEventListener('dblclick', onDoubleClick, true);
    window.addEventListener('keydown', onKey, true);
    const overlay = overlayRef.current;
    overlay?.setAttribute('data-inspector-ready', 'true');
    return () => {
      overlay?.removeAttribute('data-inspector-ready');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onCancel, true);
      window.removeEventListener('blur', onCancel);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dblclick', onDoubleClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [
    active,
    selection,
    selected,
    slideId,
    setSelection,
    inlineEdit,
    committing,
    bufferBatch,
    visual.snapping,
    cancel,
    openCrop,
  ]);

  useEffect(() => {
    const reset = () => {
      for (const snapshot of gestureRef.current?.snapshots ?? []) restoreTransform(snapshot);
      if (gestureRef.current) delete gestureRef.current.canvas.root.dataset.visualGesture;
      gestureRef.current = null;
      document.documentElement.style.removeProperty('cursor');
      document.documentElement.style.removeProperty('--osd-gesture-cursor');
    };
    if (!active) {
      reset();
      setLocalTargets(null);
      setGuides([]);
      setMarquee(null);
      setHover(null);
    }
    return reset;
  }, [active]);

  if (!active) return null;
  const bounds = unionRects(
    frames.map((frame) => ({
      x: frame.left,
      y: frame.top,
      width: frame.width,
      height: frame.height,
    })),
  );
  const canvas = readCanvas();
  const transformable =
    !!canvas && displayed.length > 0 && displayed.every((target) => canTransform(target, canvas));
  const editing = !!inlineEdit;
  const single = displayed.length === 1;
  const imageAnchor = selected?.anchor instanceof HTMLImageElement ? selected.anchor : null;
  const toScreen = (rect: Rect) => ({
    left: (canvasFrame?.left ?? 0) + rect.x * scale,
    top: (canvasFrame?.top ?? 0) + rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  });
  return (
    <div
      ref={overlayRef}
      data-inspector-ui
      className="pointer-events-none absolute inset-0 z-30 select-none"
    >
      {hoverFrame && !gestureRef.current && (
        <div className="absolute border border-dashed border-blue-500/70" style={hoverFrame} />
      )}
      {frames.length > 1 &&
        frames.map(({ id, ...frame }) => (
          <div key={id} className="absolute border border-blue-500/60" style={frame} />
        ))}
      {bounds && (
        <div
          data-selection-frame="true"
          className="absolute border border-blue-500"
          style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }}
        >
          {!editing && transformable && single && !committing && (
            <>
              <div className="absolute -top-6 left-1/2 h-6 w-px bg-blue-500" />
              <button
                type="button"
                data-rotate-handle
                aria-label={t.inspector.rotateHandle}
                className="pointer-events-auto absolute -top-7 left-1/2 size-3 -translate-x-1/2 cursor-crosshair rounded-full border border-blue-500 bg-background shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
              />
              {HANDLES.map(({ handle, x, y, cursor }) => (
                <button
                  key={handle}
                  type="button"
                  data-resize-handle={handle}
                  aria-label={format(t.inspector.resizeHandle, { handle })}
                  className="pointer-events-auto absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-blue-500 bg-background shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                  style={{ left: `${x * 100}%`, top: `${y * 100}%`, cursor, touchAction: 'none' }}
                />
              ))}
            </>
          )}
          {gestureRef.current?.moved && (
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 font-mono text-[10px] text-background">
              {round(bounds.width / scale)} × {round(bounds.height / scale)}
            </span>
          )}
        </div>
      )}
      {canvasFrame &&
        guides.map((guide) => (
          <div
            key={`${guide.axis}:${guide.position}`}
            data-alignment-guide={guide.axis}
            className="absolute bg-cyan-500"
            style={
              guide.axis === 'x'
                ? {
                    left: canvasFrame.left + guide.position * scale,
                    top: canvasFrame.top + guide.start * scale,
                    width: 1,
                    height: (guide.end - guide.start) * scale,
                  }
                : {
                    left: canvasFrame.left + guide.start * scale,
                    top: canvasFrame.top + guide.position * scale,
                    width: (guide.end - guide.start) * scale,
                    height: 1,
                  }
            }
          />
        ))}
      {marquee && (
        <div className="absolute border border-blue-500 bg-blue-500/10" style={toScreen(marquee)} />
      )}
      {imageAnchor && single && bounds && !gestureRef.current && (
        <div
          className="pointer-events-auto absolute flex gap-1 rounded-md border bg-popover p-1 shadow-floating"
          style={{
            left: bounds.x + bounds.width / 2,
            top: bounds.y + bounds.height + 10,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            type="button"
            aria-label={t.inspector.replace}
            title={t.inspector.replace}
            onClick={() => openReplace(imageAnchor)}
            className="flex size-7 items-center justify-center rounded hover:bg-muted focus-visible:outline-2"
          >
            <ImageIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={t.inspector.crop}
            title={t.inspector.crop}
            onClick={() => openCrop(imageAnchor)}
            className="flex size-7 items-center justify-center rounded hover:bg-muted focus-visible:outline-2"
          >
            <Crop className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const EDITING_FREEZE_CSS = `
[data-inspector-editing] { touch-action: none; }
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::after {
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  transition: none !important;
  view-transition-name: none !important;
  user-select: none;
}
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *)::after {
  cursor: default !important;
}
[data-inspector-editing] [data-visual-gesture],
[data-inspector-editing] [data-visual-gesture] *,
[data-inspector-editing] [data-visual-gesture] *::before,
[data-inspector-editing] [data-visual-gesture] *::after {
  cursor: var(--osd-gesture-cursor, default) !important;
}
`;
