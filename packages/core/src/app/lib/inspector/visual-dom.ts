import type { SelectedTarget } from '@/components/inspector/inspector-provider';
import { findSlideSource } from './fiber';
import {
  type Point,
  type Rect,
  rectContains,
  rectsIntersect,
  solveResizeDimensions,
} from './geometry';
import type { EditOp } from './use-editor';

export const TRANSLATE_STYLE_KEY = 'translate';
export const ROTATE_STYLE_KEY = 'rotate';
export const TRANSFORM_STYLE_KEYS = [TRANSLATE_STYLE_KEY, ROTATE_STYLE_KEY] as const;
export const SIZE_STYLE_KEYS = ['width', 'height'] as const;
export const SIZE_BOUNDS_STYLES = {
  minWidth: '0px',
  minHeight: '0px',
  maxWidth: 'none',
  maxHeight: 'none',
} as const;
export const FLEX_SIZE_STYLES = { flexShrink: '0', flexGrow: '0', flexBasis: 'auto' } as const;
export const SIZE_CONSTRAINT_STYLES = { ...SIZE_BOUNDS_STYLES, ...FLEX_SIZE_STYLES } as const;
export const LAYER_POSITION_STYLE = { position: 'relative' } as const;
export const LAYER_INSET_KEYS = [
  'inset',
  'insetInline',
  'insetBlock',
  'insetInlineStart',
  'insetInlineEnd',
  'insetBlockStart',
  'insetBlockEnd',
  'top',
  'right',
  'bottom',
  'left',
] as const;
export const LAYER_INSET_VALUE = 'auto';
export const Z_INDEX_KEY = 'zIndex';

export const GESTURE_STYLE_KEYS: readonly string[] = [
  ...TRANSFORM_STYLE_KEYS,
  ...SIZE_STYLE_KEYS,
  ...Object.keys(SIZE_CONSTRAINT_STYLES),
  ...Object.keys(LAYER_POSITION_STYLE),
  ...LAYER_INSET_KEYS,
  Z_INDEX_KEY,
];

export type ResetGestureScope = 'transform' | 'all';

type InlineLayout = Readonly<Record<string, string | undefined>>;

const inlineValue = (inline: InlineLayout, key: string) => inline[key]?.trim() ?? '';

// Size and layer keys are cleared only alongside the signature the editor writes with them, so an
// authored `width: 240`, `flexShrink: 0` or `position: 'relative'` is not mistaken for a gesture.
function holds(inline: InlineLayout, styles: Readonly<Record<string, string>>): boolean {
  return Object.entries(styles).every(([key, value]) => inlineValue(inline, key) === value);
}

const LAYER_GROUP_SIGNATURE = {
  ...LAYER_POSITION_STYLE,
  ...Object.fromEntries(['top', 'right', 'bottom', 'left'].map((key) => [key, LAYER_INSET_VALUE])),
};

export function resetGestureOps(inline: InlineLayout, scope: ResetGestureScope): EditOp[] {
  const keys: string[] = [...TRANSFORM_STYLE_KEYS];
  if (scope === 'all') {
    if (holds(inline, SIZE_BOUNDS_STYLES))
      keys.push(
        ...SIZE_STYLE_KEYS,
        ...Object.keys(SIZE_BOUNDS_STYLES),
        ...Object.entries(FLEX_SIZE_STYLES)
          .filter(([key, value]) => inlineValue(inline, key) === value)
          .map(([key]) => key),
      );
    if (holds(inline, LAYER_GROUP_SIGNATURE))
      keys.push(
        ...Object.keys(LAYER_POSITION_STYLE),
        ...LAYER_INSET_KEYS.filter((key) => inlineValue(inline, key) === LAYER_INSET_VALUE),
      );
    keys.push(Z_INDEX_KEY);
  }
  return keys
    .filter((key) => inlineValue(inline, key))
    .map((key) => ({ kind: 'set-style', key, value: null }));
}

export function readInlineLayout(anchor: HTMLElement): Record<string, string> {
  const style = anchor.style as unknown as Record<string, string>;
  return Object.fromEntries(GESTURE_STYLE_KEYS.map((key) => [key, style[key] ?? '']));
}

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

// A partially covered ancestor yields to the children the marquee also
// touches, so sweeping across a few cards picks the cards, not their wrapper.
export function marqueeTargets(
  rect: Rect,
  candidates: Array<{ target: SelectedTarget; frame: Rect }>,
): SelectedTarget[] {
  const hits = candidates.filter(({ frame }) => rectsIntersect(rect, frame));
  return hits
    .filter(
      ({ target, frame }) =>
        rectContains(rect, frame) ||
        !hits.some(
          (other) =>
            other.target.anchor !== target.anchor && target.anchor.contains(other.target.anchor),
        ),
    )
    .map(({ target }) => target);
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
      TRANSLATE_STYLE_KEY,
      `${round(snapshot.translate.x + local.x)}px ${round(snapshot.translate.y + local.y)}px`,
    ),
  ];
}

export function sizeOps(
  snapshot: TransformSnapshot,
  frame: Rect,
  canvas: Canvas,
  fixedPoint: Point = { x: 0, y: 0 },
): EditOp[] {
  const anchor = snapshot.target.anchor;
  restoreTransform(snapshot);
  const constraints = Object.entries(SIZE_CONSTRAINT_STYLES).map(([key, value]) =>
    styleOp(key, value),
  );
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
  const size = solveResizeDimensions(snapshot, basis, {
    x: frame.width - base.width,
    y: frame.height - base.height,
  });
  const ops = [...constraints, ...dimensions(size.width, size.height)];
  previewOps(anchor, ops);
  const measured = readFrame(anchor, canvas);
  const position = moveOps(
    snapshot,
    {
      x: frame.x + (frame.width - measured.width) * fixedPoint.x - measured.x,
      y: frame.y + (frame.height - measured.height) * fixedPoint.y - measured.y,
    },
    canvas,
  );
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
