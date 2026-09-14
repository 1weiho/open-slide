import type { SelectedTarget } from '@/components/inspector/inspector-provider';
import { findSlideSource } from './fiber';
import type { Point, Rect } from './geometry';
import type { EditOp } from './use-editor';

export type Canvas = {
  root: HTMLElement;
  rect: DOMRect;
  scale: number;
  width: number;
  height: number;
};

export function readCanvas(): Canvas | null {
  const root = document.querySelector<HTMLElement>('[data-inspector-root] [data-osd-canvas]');
  if (!root) return null;
  const rect = root.getBoundingClientRect();
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  if (!width || !height || !rect.width) return null;
  return { root, rect, scale: rect.width / width, width, height };
}

export function readFrame(anchor: HTMLElement, canvas: Canvas): Rect {
  const rect = anchor.getBoundingClientRect();
  return {
    x: (rect.left - canvas.rect.left) / canvas.scale,
    y: (rect.top - canvas.rect.top) / canvas.scale,
    width: rect.width / canvas.scale,
    height: rect.height / canvas.scale,
  };
}

export function readRotation(anchor: HTMLElement): number {
  const value = getComputedStyle(anchor).rotate;
  if (value === 'none') return 0;
  const angle = value.split(' ').at(-1) ?? '0';
  const n = Number.parseFloat(angle) || 0;
  return angle.endsWith('grad')
    ? n * 0.9
    : angle.endsWith('rad')
      ? (n * 180) / Math.PI
      : angle.endsWith('turn')
        ? n * 360
        : n;
}

export function editableTargets(canvas: Canvas, slideId: string): SelectedTarget[] {
  const anchors = new Set<HTMLElement>();
  const targets: SelectedTarget[] = [];
  for (const element of canvas.root.querySelectorAll<HTMLElement>('[data-slide-loc]')) {
    const hit = findSlideSource(element, slideId, { hostOnly: true });
    if (!hit || anchors.has(hit.anchor) || hit.anchor.closest('[aria-hidden="true"]')) continue;
    const rect = hit.anchor.getBoundingClientRect();
    const style = getComputedStyle(hit.anchor);
    if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none')
      continue;
    anchors.add(hit.anchor);
    targets.push(hit);
  }
  return targets;
}

export function independentTargets(targets: SelectedTarget[]): SelectedTarget[] {
  return targets.filter(
    (target, index) =>
      targets.findIndex((other) => other.anchor === target.anchor) === index &&
      !targets.some(
        (other) => other.anchor !== target.anchor && other.anchor.contains(target.anchor),
      ),
  );
}

export function canTransform(target: SelectedTarget, canvas: Canvas): boolean {
  const style = getComputedStyle(target.anchor);
  const rect = target.anchor.getBoundingClientRect();
  return (
    target.anchor.isConnected &&
    canvas.root.contains(target.anchor) &&
    style.display !== 'contents' &&
    rect.width > 0 &&
    rect.height > 0 &&
    (style.display !== 'inline' || target.anchor instanceof HTMLImageElement) &&
    canvas.root.querySelectorAll(`[data-slide-loc="${target.line}:${target.column}"]`).length === 1
  );
}

export type TransformSnapshot = {
  target: SelectedTarget;
  frame: Rect;
  style: string | null;
  translate: Point;
  basis: { a: number; b: number; c: number; d: number };
  rotation: number;
  width: number;
  height: number;
};

export function captureTransform(target: SelectedTarget, canvas: Canvas): TransformSnapshot {
  const { anchor } = target;
  const style = anchor.getAttribute('style');
  const frame = readFrame(anchor, canvas);
  const rotation = readRotation(anchor);
  const computed = getComputedStyle(anchor);
  const width = Number.parseFloat(computed.width) || anchor.offsetWidth;
  const height = Number.parseFloat(computed.height) || anchor.offsetHeight;
  const before = anchor.getBoundingClientRect();
  // Probe the browser's coordinate basis so nested transforms and percentage translations survive.
  anchor.style.transition = 'none';
  anchor.style.translate = '0px 0px';
  const zero = anchor.getBoundingClientRect();
  anchor.style.translate = '100px 0px';
  const x = anchor.getBoundingClientRect();
  anchor.style.translate = '0px 100px';
  const y = anchor.getBoundingClientRect();
  restoreStyle(anchor, style);
  const basis = {
    a: (x.x - zero.x) / 100,
    b: (x.y - zero.y) / 100,
    c: (y.x - zero.x) / 100,
    d: (y.y - zero.y) / 100,
  };
  const translate = localDelta(basis, { x: before.x - zero.x, y: before.y - zero.y });
  return { target, frame, style, translate, basis, rotation, width, height };
}

function localDelta(basis: TransformSnapshot['basis'], delta: Point): Point {
  const determinant = basis.a * basis.d - basis.b * basis.c;
  if (Math.abs(determinant) < 0.000001) return { x: 0, y: 0 };
  return {
    x: (basis.d * delta.x - basis.c * delta.y) / determinant,
    y: (basis.a * delta.y - basis.b * delta.x) / determinant,
  };
}

export function styleOp(key: string, value: string): EditOp {
  return { kind: 'set-style', key, value };
}

export function moveOps(snapshot: TransformSnapshot, delta: Point, canvas: Canvas): EditOp[] {
  const local = localDelta(snapshot.basis, {
    x: delta.x * canvas.scale,
    y: delta.y * canvas.scale,
  });
  return [
    styleOp(
      'translate',
      `${round(snapshot.translate.x + local.x)}px ${round(snapshot.translate.y + local.y)}px`,
    ),
  ];
}

export function sizeOps(snapshot: TransformSnapshot, frame: Rect, canvas: Canvas): EditOp[] {
  const anchor = snapshot.target.anchor;
  restoreTransform(snapshot);
  const constraints = [
    styleOp('minWidth', '0px'),
    styleOp('minHeight', '0px'),
    styleOp('maxWidth', 'none'),
    styleOp('maxHeight', 'none'),
    styleOp('flexShrink', '0'),
    styleOp('flexGrow', '0'),
    styleOp('flexBasis', 'auto'),
  ];
  const dimensions = (width: number, height: number) => [
    styleOp('width', `${round(Math.max(8, width))}px`),
    styleOp('height', `${round(Math.max(8, height))}px`),
  ];
  anchor.style.transition = 'none';
  previewOps(anchor, [
    ...constraints,
    ...dimensions(snapshot.width, snapshot.height),
    ...moveOps(snapshot, { x: 0, y: 0 }, canvas),
  ]);
  const base = readFrame(anchor, canvas);
  previewOps(anchor, dimensions(snapshot.width + 100, snapshot.height));
  const wider = readFrame(anchor, canvas);
  previewOps(anchor, dimensions(snapshot.width, snapshot.height + 100));
  const taller = readFrame(anchor, canvas);
  const basis = {
    a: (wider.width - base.width) / 100,
    b: (wider.height - base.height) / 100,
    c: (taller.width - base.width) / 100,
    d: (taller.height - base.height) / 100,
  };
  const determinant = basis.a * basis.d - basis.b * basis.c;
  const change = localDelta(basis, {
    x: frame.width - base.width,
    y: frame.height - base.height,
  });
  const scale =
    (base.width * frame.width + base.height * frame.height) /
    (base.width * base.width + base.height * base.height);
  // A 45-degree rotation makes both bounding-box dimensions depend on the same local sum.
  const ops = [
    ...constraints,
    ...dimensions(
      Math.abs(determinant) < 0.001 ? snapshot.width * scale : snapshot.width + change.x,
      Math.abs(determinant) < 0.001 ? snapshot.height * scale : snapshot.height + change.y,
    ),
  ];
  previewOps(anchor, ops);
  const measured = readFrame(anchor, canvas);
  const position = moveOps(snapshot, { x: frame.x - measured.x, y: frame.y - measured.y }, canvas);
  restoreTransform(snapshot);
  return [...ops, ...position];
}

export function previewOps(anchor: HTMLElement, ops: EditOp[]) {
  const style = anchor.style as unknown as Record<string, string>;
  for (const op of ops) if (op.kind === 'set-style') style[op.key] = op.value ?? '';
}

export function restoreTransform(snapshot: TransformSnapshot) {
  restoreStyle(snapshot.target.anchor, snapshot.style);
}

function restoreStyle(anchor: HTMLElement, style: string | null) {
  if (style === null) anchor.removeAttribute('style');
  else anchor.setAttribute('style', style);
  anchor.style.transition = 'none';
  anchor.getBoundingClientRect();
  if (style === null) anchor.removeAttribute('style');
  else anchor.setAttribute('style', style);
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}
