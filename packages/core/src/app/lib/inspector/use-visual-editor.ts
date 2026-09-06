import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectedTarget } from '@/components/inspector/inspector-provider';
import { isTypingTarget } from '@/lib/keys';
import { type Alignment, alignRects, distributeRects, unionRects } from './geometry';
import type { EditOp } from './use-editor';
import {
  canTransform,
  captureTransform,
  editableTargets,
  independentTargets,
  moveOps,
  readCanvas,
  readFrame,
  restoreTransform,
  sizeOps,
  styleOp,
} from './visual-dom';

export type VisualEdit = SelectedTarget & { ops: EditOp[] };
export type FramePatch = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
};
export type ArrangeDirection = 'front' | 'back' | 'forward' | 'backward';

function isFlexOrGridItem(node: HTMLElement): boolean {
  const display = node.parentElement ? getComputedStyle(node.parentElement).display : '';
  return display.includes('flex') || display.includes('grid');
}

function stackLevel(node: HTMLElement): number {
  const style = getComputedStyle(node);
  return style.position !== 'static' || isFlexOrGridItem(node)
    ? Number.parseInt(style.zIndex, 10) || 0
    : 0;
}

function layerOps(node: HTMLElement, level: number): EditOp[] {
  const position = getComputedStyle(node).position;
  return [
    ...(position === 'static' && !isFlexOrGridItem(node) ? [styleOp('position', 'relative')] : []),
    styleOp('zIndex', String(level)),
  ];
}

type Options = {
  active: boolean;
  inlineEditing: boolean;
  committing: boolean;
  slideId: string;
  selection: SelectedTarget[];
  setSelection: (targets: SelectedTarget[]) => void;
  bufferBatch: (edits: VisualEdit[], coalesceKey?: string) => void;
};

export function useVisualEditor({
  active,
  inlineEditing,
  committing,
  slideId,
  selection,
  setSelection,
  bufferBatch,
}: Options) {
  const [snapping, setSnapping] = useState(true);
  const move = useCallback(
    (deltas: { x: number; y: number }[], coalesceKey?: string) => {
      const canvas = readCanvas();
      if (!canvas || committing || selection.some((target) => !canTransform(target, canvas)))
        return;
      const targets = independentTargets(selection);
      if (
        targets.some(
          (_, index) =>
            !deltas[index] ||
            !Number.isFinite(deltas[index].x) ||
            !Number.isFinite(deltas[index].y),
        )
      )
        return;
      const edits = targets.flatMap((target, index) => {
        const delta = deltas[index];
        if (!delta.x && !delta.y) return [];
        return [{ ...target, ops: moveOps(captureTransform(target, canvas), delta, canvas) }];
      });
      bufferBatch(edits, coalesceKey);
    },
    [selection, committing, bufferBatch],
  );

  const align = useCallback(
    (alignment: Alignment, toSlide: boolean) => {
      const canvas = readCanvas();
      if (!canvas) return;
      const rects = independentTargets(selection).map((target) => readFrame(target.anchor, canvas));
      move(
        alignRects(
          rects,
          alignment,
          toSlide || rects.length === 1
            ? { x: 0, y: 0, width: canvas.width, height: canvas.height }
            : undefined,
        ),
      );
    },
    [selection, move],
  );

  const distribute = useCallback(
    (axis: 'x' | 'y') => {
      const canvas = readCanvas();
      if (!canvas) return;
      move(
        distributeRects(
          independentTargets(selection).map((target) => readFrame(target.anchor, canvas)),
          axis,
        ),
      );
    },
    [selection, move],
  );

  const setFrame = useCallback(
    (patch: FramePatch) => {
      if (
        !Object.keys(patch).length ||
        Object.values(patch).some((value) => !Number.isFinite(value)) ||
        committing
      )
        return;
      const canvas = readCanvas();
      const targets = independentTargets(selection);
      if (!canvas || !targets.length || selection.some((target) => !canTransform(target, canvas)))
        return;
      const snapshots = targets.map((target) => captureTransform(target, canvas));
      const bounds = unionRects(snapshots.map((snapshot) => snapshot.frame));
      if (!bounds) return;
      if (snapshots.length > 1) {
        if (patch.width !== undefined || patch.height !== undefined || patch.rotation !== undefined)
          return;
        move(
          targets.map(() => ({
            x: (patch.x ?? bounds.x) - bounds.x,
            y: (patch.y ?? bounds.y) - bounds.y,
          })),
        );
      } else {
        const snapshot = snapshots[0];
        const ops =
          patch.width !== undefined || patch.height !== undefined
            ? sizeOps(
                snapshot,
                {
                  ...snapshot.frame,
                  x: patch.x ?? snapshot.frame.x,
                  y: patch.y ?? snapshot.frame.y,
                  width: Math.max(8, patch.width ?? snapshot.frame.width),
                  height: Math.max(8, patch.height ?? snapshot.frame.height),
                },
                canvas,
              )
            : patch.x !== undefined || patch.y !== undefined
              ? moveOps(
                  snapshot,
                  { x: (patch.x ?? bounds.x) - bounds.x, y: (patch.y ?? bounds.y) - bounds.y },
                  canvas,
                )
              : [];
        if (patch.rotation !== undefined) ops.push(styleOp('rotate', `${patch.rotation}deg`));
        restoreTransform(snapshot);
        bufferBatch([{ ...snapshot.target, ops }]);
      }
    },
    [selection, move, bufferBatch, committing],
  );

  const arrange = useCallback(
    (direction: ArrangeDirection) => {
      if (committing) return;
      const canvas = readCanvas();
      if (!canvas || selection.some((target) => !canTransform(target, canvas))) return;
      const targets = independentTargets(selection);
      const sourceTargets = new Map(
        editableTargets(canvas, slideId)
          .filter((target) => canTransform(target, canvas))
          .map((target) => [target.anchor, target]),
      );
      const selected = new Set(targets.map((target) => target.anchor));
      const parents = new Set(targets.map((target) => target.anchor.parentElement));
      const edits: VisualEdit[] = [];
      for (const parent of parents) {
        if (!parent) continue;
        const siblings = Array.from(parent.children).filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        );
        const ordered = siblings
          .map((node, index) => ({ node, index, level: stackLevel(node) }))
          .sort((a, b) => a.level - b.level || a.index - b.index);
        if (siblings.every((node) => sourceTargets.has(node))) {
          const next = ordered.map(({ node }) => node);
          if (direction === 'front' || direction === 'back') {
            next.sort(
              (a, b) =>
                (Number(selected.has(a)) - Number(selected.has(b))) *
                (direction === 'front' ? 1 : -1),
            );
          } else if (direction === 'forward') {
            for (let index = next.length - 2; index >= 0; index--) {
              if (selected.has(next[index]) && !selected.has(next[index + 1]))
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
            }
          } else {
            for (let index = 1; index < next.length; index++) {
              if (selected.has(next[index]) && !selected.has(next[index - 1]))
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
            }
          }
          if (next.every((node, index) => node === ordered[index].node)) continue;
          const base = Math.min(0, ...ordered.map(({ level }) => level));
          for (const [index, node] of next.entries()) {
            const target = sourceTargets.get(node);
            if (target) edits.push({ ...target, ops: layerOps(node, base + index) });
          }
        } else {
          for (const [index, { node, level }] of ordered.entries()) {
            const target = sourceTargets.get(node);
            if (!selected.has(node) || !target) continue;
            const nextLevel =
              direction === 'front'
                ? ordered[ordered.length - 1].level + 1
                : direction === 'back'
                  ? ordered[0].level - 1
                  : direction === 'forward'
                    ? (ordered[index + 1]?.level ?? level) + 1
                    : (ordered[index - 1]?.level ?? level) - 1;
            edits.push({ ...target, ops: layerOps(node, nextLevel) });
          }
        }
      }
      bufferBatch(edits);
    },
    [selection, committing, bufferBatch, slideId],
  );

  const selectParent = useCallback(() => {
    const canvas = readCanvas();
    const anchor = selection.at(-1)?.anchor.parentElement;
    if (!canvas || !anchor) return;
    const targets = editableTargets(canvas, slideId);
    for (
      let node: HTMLElement | null = anchor;
      node && node !== canvas.root;
      node = node.parentElement
    ) {
      const target = targets.find((target) => target.anchor === node);
      if (target) {
        setSelection([target]);
        return;
      }
    }
  }, [selection, slideId, setSelection]);

  const selectAll = useCallback(() => {
    const canvas = readCanvas();
    if (!canvas) return;
    const targets = editableTargets(canvas, slideId).filter((target) =>
      canTransform(target, canvas),
    );
    // Full-slide wrappers are layout scaffolding; select the first independent objects inside them.
    const objects = targets.filter((target) => {
      const frame = readFrame(target.anchor, canvas);
      return frame.width < canvas.width - 1 || frame.height < canvas.height - 1;
    });
    setSelection(independentTargets(objects));
  }, [slideId, setSelection]);

  useEffect(() => {
    if (!active || inlineEditing || committing) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.keyCode === 229 ||
        isTypingTarget(event.target) ||
        document.querySelector('[data-visual-gesture]')
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        (target.closest('[role="dialog"], [role="menu"], [role="listbox"]') ||
          target.closest('[data-inspector-ui]'))
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectAll();
        return;
      }
      if (!selection.length || event.metaKey || event.ctrlKey || event.altKey) return;
      const vectors: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
      };
      const vector = vectors[event.key];
      if (!vector) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const step = event.shiftKey ? 10 : 1;
      move(
        selection.map(() => ({ x: vector.x * step, y: vector.y * step })),
        `nudge:${selection.map((target) => `${target.line}:${target.column}`).join(',')}`,
      );
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, inlineEditing, committing, selection, move, selectAll]);

  return useMemo(
    () => ({
      snapping,
      setSnapping,
      align,
      distribute,
      setFrame,
      arrange,
      selectParent,
      selectAll,
    }),
    [snapping, align, distribute, setFrame, arrange, selectParent, selectAll],
  );
}
