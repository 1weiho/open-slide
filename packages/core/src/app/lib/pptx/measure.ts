import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../sdk';
import {
  applyTextTransform,
  applyToPoint,
  type ColorParser,
  decompose,
  geometryFor,
  IDENTITY,
  isIdentity,
  isVisibleColor,
  type Mat,
  multiply,
  normalizeRadii,
  parseAngleDeg,
  parseBlurPx,
  parseCornerRadius,
  parseLinearGradient,
  parsePx,
  parseShadows,
  parseTransform,
  type Radii,
  type Rgba,
  rotationDeg,
  type Shadow,
  scaling,
  splitTopLevel,
  transformedBounds,
  translation,
  withAlpha,
} from './css';
import { resolveFontFamily } from './fonts';
import type { ImageStore, LoadedImage } from './images';
import {
  clampToSlide,
  expandRect,
  type Rasterizer,
  type RasterMode,
  type RasterRequest,
} from './raster';
import type {
  Bullet,
  Crop,
  Fill,
  Geometry,
  Outline,
  Paragraph,
  PictureNode,
  Rect,
  RunStyle,
  SceneNode,
  ShadowEffect,
  ShapeNode,
  SlideScene,
  TextLine,
  TextNode,
  TextShadow,
} from './scene';
import { type Atom, fillEmptyLines, groupAtomsIntoLines, lineToRuns } from './text-lines';

const MEASURE_CLASS = 'os-pptx-measure';
const MIN_SIZE = 0.25;
const PITCH_TOLERANCE = 0.6;
const MEDIA_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE']);
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'LINK', 'META']);

type Decoration = { underline: boolean; strike: boolean };

type Inherited = {
  world: Mat;
  opacity: number;
  clip: Rect | null;
  decoration: Decoration;
};

type Slot = { node: SceneNode | null };

type Measured = {
  el: Element;
  cs: CSSStyleDeclaration;
  rect: Rect;
  world: Mat;
  opacity: number;
  clip: Rect | null;
};

type Ctx = {
  frame: HTMLElement;
  frameRect: DOMRect;
  transforms: Map<Element, Mat>;
  slots: Slot[];
  rasters: { slot: Slot; request: RasterRequest; svg: Uint8Array | null }[];
  pending: Promise<void>[];
  images: ImageStore;
  color: ColorParser;
  segmenter: Intl.Segmenter | null;
  measureCanvas: CanvasRenderingContext2D | null;
};

export type MeasurePageOptions = {
  frame: HTMLElement;
  notes: string | null;
  images: ImageStore;
  rasterizer: Rasterizer;
  color: ColorParser;
};

export async function measurePage(options: MeasurePageOptions): Promise<SlideScene> {
  const { frame } = options;
  const ctx: Ctx = {
    frame,
    frameRect: frame.getBoundingClientRect(),
    transforms: snapshotTransforms(frame),
    slots: [],
    rasters: [],
    pending: [],
    images: options.images,
    color: options.color,
    segmenter: typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : null,
    measureCanvas: document.createElement('canvas').getContext('2d'),
  };

  const style = document.createElement('style');
  style.textContent = `.${MEASURE_CLASS}, .${MEASURE_CLASS} * { transform: none !important; translate: none !important; rotate: none !important; scale: none !important; }`;
  document.head.appendChild(style);
  frame.classList.add(MEASURE_CLASS);
  let background: Fill | null = null;
  try {
    const hostBg = ctx.color(getComputedStyle(frame).backgroundColor);
    background = isVisibleColor(hostBg) ? { kind: 'solid', color: hostBg } : null;
    const slideClip: Rect = { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT };
    for (const child of Array.from(frame.children)) {
      paintBlock(ctx, child, {
        world: IDENTITY,
        opacity: 1,
        clip: slideClip,
        decoration: { underline: false, strike: false },
      });
    }
  } finally {
    frame.classList.remove(MEASURE_CLASS);
    style.remove();
  }

  await Promise.all(ctx.pending);
  if (ctx.rasters.length > 0) {
    const results = await options.rasterizer.rasterize(ctx.rasters.map((r) => r.request));
    ctx.rasters.forEach((entry, i) => {
      const result = results[i];
      if (!result) return;
      const svg = result.format === 'png' ? (entry.svg ?? undefined) : undefined;
      const id = ctx.images.add(result.bytes, result.format, svg);
      entry.slot.node = {
        kind: 'picture',
        name: entry.request.target instanceof SVGElement ? 'Graphic' : 'Rendered image',
        box: result.rect,
        rotationDeg: 0,
        flipV: false,
        imageId: id,
        crop: null,
        alpha: 1,
        geometry: { kind: 'rect' },
        outline: null,
        shadow: null,
      };
    });
  }

  const nodes = ctx.slots.map((s) => s.node).filter((n): n is SceneNode => n !== null);
  const first = nodes[0];
  if (
    first &&
    coversSlide(first) &&
    first.kind === 'shape' &&
    first.fill &&
    !first.outline &&
    !first.shadow &&
    first.geometry.kind === 'rect' &&
    first.rotationDeg === 0
  ) {
    background = first.fill;
    nodes.shift();
  }
  return { background, nodes, notes: options.notes };
}

function coversSlide(node: SceneNode): boolean {
  const b = node.box;
  return (
    b.x <= 0.5 && b.y <= 0.5 && b.x + b.w >= CANVAS_WIDTH - 0.5 && b.y + b.h >= CANVAS_HEIGHT - 0.5
  );
}

function snapshotTransforms(frame: HTMLElement): Map<Element, Mat> {
  const out = new Map<Element, Mat>();
  const all = [frame, ...Array.from(frame.querySelectorAll('*'))];
  for (const el of all) {
    const cs = getComputedStyle(el);
    const local = composeLocalTransform(cs);
    if (local) out.set(el, local);
  }
  return out;
}

function composeLocalTransform(cs: CSSStyleDeclaration): Mat | null {
  let m: Mat = IDENTITY;
  const translate = cs.translate;
  if (translate && translate !== 'none') {
    const parts = translate.split(/\s+/);
    m = multiply(m, translation(parsePx(parts[0]), parsePx(parts[1] ?? '0')));
  }
  const rotate = cs.rotate;
  if (rotate && rotate !== 'none') {
    const tokens = rotate.split(/\s+/);
    const angle = parseAngleDeg(tokens[tokens.length - 1]);
    if (angle === null) return null;
    if (tokens.length > 1) {
      const axis = tokens.slice(0, -1).join(' ');
      if (axis !== 'z' && axis !== '0 0 1') return null;
    }
    m = multiply(m, rotationDeg(angle));
  }
  const scale = cs.scale;
  if (scale && scale !== 'none') {
    const parts = scale.split(/\s+/).map(Number);
    if (parts.length > 2 && Math.abs(parts[2] - 1) > 1e-6) return null;
    m = multiply(m, scaling(parts[0], parts[1] ?? parts[0]));
  }
  const t = parseTransform(cs.transform);
  if (!t) return null;
  m = multiply(m, t);
  return m;
}

function rel(
  ctx: Ctx,
  r: DOMRect | { left: number; top: number; width: number; height: number },
): Rect {
  return {
    x: r.left - ctx.frameRect.left,
    y: r.top - ctx.frameRect.top,
    w: r.width,
    h: r.height,
  };
}

function isHidden(cs: CSSStyleDeclaration): boolean {
  return (
    cs.display === 'none' || cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) <= 0.001
  );
}

function isInlineDisplay(display: string): boolean {
  return display === 'inline';
}

function isAtomicInline(display: string): boolean {
  return display.startsWith('inline-');
}

function measureElement(
  ctx: Ctx,
  el: Element,
  cs: CSSStyleDeclaration,
  parent: Inherited,
): Measured | null {
  const rect = rel(ctx, el.getBoundingClientRect());
  const local = ctx.transforms.get(el);
  if (!local) return null;
  let world = parent.world;
  if (!isIdentity(local)) {
    const origin = cs.transformOrigin.split(/\s+/);
    const ox = rect.x + parsePx(origin[0]);
    const oy = rect.y + parsePx(origin[1]);
    world = multiply(world, multiply(translation(ox, oy), multiply(local, translation(-ox, -oy))));
  }
  const opacity = parent.opacity * Number.parseFloat(cs.opacity);
  let clip = parent.clip;
  const overflow = cs.overflow;
  const clips =
    overflow.includes('hidden') ||
    overflow.includes('clip') ||
    overflow.includes('auto') ||
    overflow.includes('scroll');
  if (clips && isIdentity(world)) {
    const padding = paddingBox(rect, cs);
    clip = clip ? intersect(clip, padding) : padding;
  } else if (clips) {
    clip = null;
  }
  return { el, cs, rect, world, opacity, clip };
}

function paddingBox(rect: Rect, cs: CSSStyleDeclaration): Rect {
  const l = parsePx(cs.borderLeftWidth);
  const t = parsePx(cs.borderTopWidth);
  const r = parsePx(cs.borderRightWidth);
  const b = parsePx(cs.borderBottomWidth);
  return {
    x: rect.x + l,
    y: rect.y + t,
    w: Math.max(0, rect.w - l - r),
    h: Math.max(0, rect.h - t - b),
  };
}

function intersect(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

function needsSubtreeRaster(m: Measured): boolean {
  const { cs, el } = m;
  if (MEDIA_TAGS.has(el.tagName.toUpperCase()) && el.tagName.toUpperCase() !== 'IMG') return true;
  if (cs.filter !== 'none') return true;
  const backdrop =
    cs.backdropFilter || (cs as unknown as Record<string, string>).webkitBackdropFilter;
  if (backdrop && backdrop !== 'none') return true;
  if (cs.mixBlendMode !== 'normal') return true;
  if (cs.clipPath !== 'none' && !/^inset\(0(px)?\)$/.test(cs.clipPath)) return true;
  const mask = cs.maskImage || (cs as unknown as Record<string, string>).webkitMaskImage;
  if (mask && mask !== 'none') return true;
  const bgClip =
    cs.backgroundClip || (cs as unknown as Record<string, string>).webkitBackgroundClip;
  if (bgClip === 'text' && cs.backgroundImage !== 'none') return true;
  if (cs.writingMode && cs.writingMode !== 'horizontal-tb') return true;
  const d = decompose(m.world);
  if (!d || d.skewed) return true;
  if (Math.abs(d.scaleX - d.scaleY) > 0.01 * Math.max(d.scaleX, d.scaleY) && el.textContent?.trim())
    return true;
  return false;
}

function paintsBackgroundSeparately(
  cs: CSSStyleDeclaration,
  w: number,
  h: number,
  color: ColorParser,
): boolean {
  if (cs.backgroundImage === 'none') return false;
  const layers = splitTopLevel(cs.backgroundImage);
  if (layers.length !== 1) return true;
  const layer = layers[0];
  if (layer.startsWith('url(')) return false;
  return parseLinearGradient(layer, w, h, color) === null;
}

function pushSlot(ctx: Ctx, node: SceneNode | null): Slot {
  const slot: Slot = { node };
  ctx.slots.push(slot);
  return slot;
}

function requestRaster(ctx: Ctx, m: Measured, mode: RasterMode): void {
  const shadows = parseShadows(m.cs.boxShadow, ctx.color);
  const shadowExtent = shadows.reduce(
    (max, s) => Math.max(max, Math.hypot(s.x, s.y) + s.blur + Math.max(0, s.spread)),
    0,
  );
  const bounds = transformedBounds(m.world, m.rect.x, m.rect.y, m.rect.w, m.rect.h);
  const svg = vectorCompanion(m);
  const bleed = svg ? 0 : 3 * parseBlurPx(m.cs.filter) + shadowExtent + 8;
  let region = clampToSlide(expandRect(bounds, bleed));
  if (m.clip && isIdentity(m.world) && mode === 'self') {
    region = intersect(region, expandRect(m.clip, shadowExtent));
  }
  if (region.w <= 0 || region.h <= 0) return;
  const slot = pushSlot(ctx, null);
  ctx.rasters.push({ slot, request: { target: m.el, mode, region, trim: !svg }, svg });
}

const SVG_UNSUPPORTED =
  'filter, pattern, mask, foreignObject, use, style, image, text, textPath, switch, script, [class]';
const SVG_PAINT_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'] as const;

/**
 * PowerPoint 2016+ renders an SVG companion instead of the PNG fallback, keeping
 * icons and diagrams vector and editable. Only plain, fully inside-the-slide,
 * untransformed SVGs qualify: anything else would draw differently from the raster.
 */
function vectorCompanion(m: Measured): Uint8Array | null {
  const { el, rect, world, opacity } = m;
  if (!(el instanceof SVGSVGElement)) return null;
  if (!isIdentity(world) || opacity < 0.999) return null;
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > CANVAS_WIDTH || rect.y + rect.h > CANVAS_HEIGHT)
    return null;
  if (rect.w < 1 || rect.h < 1) return null;
  if (el.hasAttribute('class') || el.querySelector(SVG_UNSUPPORTED)) return null;
  const origs = [el, ...Array.from(el.querySelectorAll('*'))];
  const clone = el.cloneNode(true) as SVGSVGElement;
  const clones = [clone, ...Array.from(clone.querySelectorAll('*'))];
  if (origs.length !== clones.length) return null;
  for (let i = 0; i < origs.length; i++) {
    const orig = origs[i];
    const target = clones[i];
    if (/currentcolor|var\(/i.test(orig.getAttribute('style') ?? '')) return null;
    const cs = getComputedStyle(orig);
    for (const prop of SVG_PAINT_PROPS) {
      const attr = orig.getAttribute(prop) ?? '';
      if (!/currentcolor|var\(/i.test(attr)) continue;
      const resolved = cs.getPropertyValue(prop);
      if (!resolved) return null;
      target.setAttribute(prop, resolved);
    }
  }
  clone.removeAttribute('style');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(rect.w));
  clone.setAttribute('height', String(rect.h));
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${rect.w} ${rect.h}`);
  clone.setAttribute('color', getComputedStyle(el).color);
  try {
    return new TextEncoder().encode(new XMLSerializer().serializeToString(clone));
  } catch {
    return null;
  }
}

function paintBlock(ctx: Ctx, el: Element, inherited: Inherited): void {
  if (SKIPPED_TAGS.has(el.tagName.toUpperCase())) return;
  const cs = getComputedStyle(el);
  if (isHidden(cs)) return;
  if (cs.display === 'contents') {
    for (const child of Array.from(el.children)) paintBlock(ctx, child, inherited);
    return;
  }
  const m = measureElement(ctx, el, cs, inherited);
  if (!m) return;
  const tag = el.tagName.toUpperCase();

  if (tag === 'IMG') {
    paintImage(ctx, m as Measured & { el: HTMLImageElement });
    return;
  }
  if (needsSubtreeRaster(m)) {
    requestRaster(ctx, m, 'subtree');
    return;
  }

  const decoration = mergeDecoration(inherited.decoration, cs);
  const childInherited: Inherited = {
    world: m.world,
    opacity: m.opacity,
    clip: m.clip,
    decoration,
  };

  if (paintsBackgroundSeparately(cs, m.rect.w, m.rect.h, ctx.color)) {
    requestRaster(ctx, m, 'self');
  } else {
    paintBox(ctx, m);
  }

  const atoms: Atom[] = [];
  const blockChildren: Element[] = [];
  const inlineItems: Measured[] = [];
  collectInline(ctx, el, childInherited, atoms, blockChildren, inlineItems);

  for (const item of inlineItems) paintBox(ctx, item);
  paintText(ctx, m, atoms);
  paintChildren(ctx, blockChildren, childInherited);
}

function mergeDecoration(parent: Decoration, cs: CSSStyleDeclaration): Decoration {
  const line = cs.textDecorationLine;
  return {
    underline: parent.underline || line.includes('underline'),
    strike: parent.strike || line.includes('line-through'),
  };
}

function paintChildren(ctx: Ctx, children: Element[], inherited: Inherited): void {
  type Entry = { el: Element; z: number; order: number; positioned: boolean };
  const entries: Entry[] = children.map((child, order) => {
    const cs = getComputedStyle(child);
    const positioned =
      cs.position !== 'static' ||
      !isIdentity(ctx.transforms.get(child) ?? IDENTITY) ||
      Number.parseFloat(cs.opacity) < 1 ||
      cs.filter !== 'none' ||
      cs.mixBlendMode !== 'normal' ||
      cs.isolation === 'isolate';
    const z = cs.zIndex === 'auto' ? 0 : Number.parseInt(cs.zIndex, 10) || 0;
    return { el: child, z: positioned ? z : 0, order, positioned };
  });
  const negative = entries
    .filter((e) => e.positioned && e.z < 0)
    .sort((a, b) => a.z - b.z || a.order - b.order);
  const flow = entries.filter((e) => !e.positioned);
  const positive = entries
    .filter((e) => e.positioned && e.z >= 0)
    .sort((a, b) => a.z - b.z || a.order - b.order);
  for (const e of [...negative, ...flow, ...positive]) paintBlock(ctx, e.el, inherited);
}

/**
 * Walks the inline formatting context of a block: text nodes become atoms, inline
 * elements contribute their own painted fragments, and any block-level descendant is
 * deferred so it paints after this block's text.
 */
function collectInline(
  ctx: Ctx,
  el: Element,
  inherited: Inherited,
  atoms: Atom[],
  blockChildren: Element[],
  inlineItems: Measured[],
): void {
  const parentCs = getComputedStyle(el);
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      collectTextAtoms(ctx, node as Text, parentCs, inherited, atoms);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const child = node as Element;
    const tag = child.tagName.toUpperCase();
    if (SKIPPED_TAGS.has(tag) || tag === 'BR') continue;
    const cs = getComputedStyle(child);
    if (isHidden(cs)) continue;
    if (cs.display === 'contents') {
      collectInline(ctx, child, inherited, atoms, blockChildren, inlineItems);
      continue;
    }
    const inline =
      isInlineDisplay(cs.display) || (isAtomicInline(cs.display) && isPlainInline(ctx, child, cs));
    const local = ctx.transforms.get(child);
    if (
      !inline ||
      MEDIA_TAGS.has(tag) ||
      !local ||
      !isIdentity(local) ||
      cs.position !== 'static'
    ) {
      blockChildren.push(child);
      continue;
    }
    const m = measureElement(ctx, child, cs, inherited);
    if (!m) continue;
    if (paintsAnything(cs, ctx.color)) inlineItems.push(m);
    const decoration = mergeDecoration(inherited.decoration, cs);
    collectInline(
      ctx,
      child,
      { ...inherited, opacity: m.opacity, decoration },
      atoms,
      blockChildren,
      inlineItems,
    );
  }
}

function isPlainInline(ctx: Ctx, el: Element, cs: CSSStyleDeclaration): boolean {
  if (paintsAnything(cs, ctx.color)) return false;
  if (cs.overflow !== 'visible') return false;
  for (const child of Array.from(el.children)) {
    const ccs = getComputedStyle(child);
    if (
      !isInlineDisplay(ccs.display) &&
      !isAtomicInline(ccs.display) &&
      ccs.display !== 'contents' &&
      ccs.display !== 'none'
    )
      return false;
    if (MEDIA_TAGS.has(child.tagName.toUpperCase())) return false;
  }
  return true;
}

function paintsAnything(cs: CSSStyleDeclaration, color: ColorParser): boolean {
  if (cs.backgroundImage !== 'none') return true;
  if (cs.boxShadow !== 'none') return true;
  if (isVisibleColor(color(cs.backgroundColor))) return true;
  return borderSides(cs, color).some((s) => s.visible);
}

type BorderSide = { width: number; color: Rgba | null; style: string; visible: boolean };

function borderSides(cs: CSSStyleDeclaration, color: ColorParser): BorderSide[] {
  const sides: [string, string, string][] = [
    [cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor],
    [cs.borderRightWidth, cs.borderRightStyle, cs.borderRightColor],
    [cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor],
    [cs.borderLeftWidth, cs.borderLeftStyle, cs.borderLeftColor],
  ];
  return sides.map(([w, style, c]) => {
    const width = style === 'none' || style === 'hidden' ? 0 : parsePx(w);
    const parsed = color(c);
    return { width, color: parsed, style, visible: width > 0 && isVisibleColor(parsed) };
  });
}

function radiiOf(cs: CSSStyleDeclaration, w: number, h: number): Radii {
  return normalizeRadii(
    [
      parseCornerRadius(cs.borderTopLeftRadius, w, h),
      parseCornerRadius(cs.borderTopRightRadius, w, h),
      parseCornerRadius(cs.borderBottomRightRadius, w, h),
      parseCornerRadius(cs.borderBottomLeftRadius, w, h),
    ],
    w,
    h,
  );
}

function shrinkRadii(radii: Radii, by: number): Radii {
  return radii.map((c) => ({ x: Math.max(0, c.x - by), y: Math.max(0, c.y - by) })) as Radii;
}

function toShadowEffect(shadow: Shadow, opacity: number): ShadowEffect {
  return {
    blur: shadow.blur,
    dist: Math.hypot(shadow.x, shadow.y),
    dirDeg: (Math.atan2(shadow.y, shadow.x) * 180) / Math.PI,
    color: withAlpha(shadow.color, opacity),
    spread: shadow.spread,
    inner: shadow.inset,
  };
}

function placed(
  box: Rect,
  world: Mat,
): { box: Rect; rotationDeg: number; flipV: boolean; scale: number } {
  if (isIdentity(world)) return { box, rotationDeg: 0, flipV: false, scale: 1 };
  const d = decompose(world);
  if (!d) return { box, rotationDeg: 0, flipV: false, scale: 1 };
  const center = applyToPoint(world, box.x + box.w / 2, box.y + box.h / 2);
  const w = box.w * d.scaleX;
  const h = box.h * d.scaleY;
  return {
    box: { x: center.x - w / 2, y: center.y - h / 2, w, h },
    rotationDeg: d.rotationDeg,
    flipV: d.flipV,
    scale: (d.scaleX + d.scaleY) / 2,
  };
}

function clipRect(box: Rect, clip: Rect | null, world: Mat): Rect {
  if (!clip || !isIdentity(world)) return box;
  return intersect(box, clip);
}

function shapeName(el: Element, geometry: Geometry): string {
  const base =
    geometry.kind === 'ellipse'
      ? 'Ellipse'
      : geometry.kind === 'rect'
        ? 'Rectangle'
        : 'Rounded Rectangle';
  const id = el.id ? ` #${el.id}` : '';
  return `${base}${id}`;
}

function paintBox(ctx: Ctx, m: Measured): void {
  const { cs, el } = m;
  const rects = isInlineDisplay(cs.display)
    ? Array.from(el.getClientRects()).map((r) => rel(ctx, r))
    : [m.rect];
  for (const rect of rects) {
    if (rect.w < MIN_SIZE && rect.h < MIN_SIZE) continue;
    paintBoxRect(ctx, m, rect);
  }
}

function paintBoxRect(ctx: Ctx, m: Measured, rect: Rect): void {
  const { cs, el, world, opacity } = m;
  const bg = ctx.color(cs.backgroundColor);
  const sides = borderSides(cs, ctx.color);
  const shadows = parseShadows(cs.boxShadow, ctx.color);
  const outer = shadows.find((s) => !s.inset);
  const inner = shadows.find((s) => s.inset);
  const layers = cs.backgroundImage === 'none' ? [] : splitTopLevel(cs.backgroundImage);
  const gradient =
    layers[0] && !layers[0].startsWith('url(')
      ? parseLinearGradient(layers[0], rect.w, rect.h, ctx.color)
      : null;
  const imageLayer = layers[0]?.startsWith('url(') ? layers[0] : null;
  const radii = radiiOf(cs, rect.w, rect.h);

  const uniform =
    sides.every((s) => s.visible) &&
    sides.every((s) => Math.abs(s.width - sides[0].width) < 0.01 && s.style === sides[0].style) &&
    sides.every((s) => s.color && sides[0].color && sameColor(s.color, sides[0].color));
  const anyBorder = sides.some((s) => s.visible);

  const fills: Fill[] = [];
  if (isVisibleColor(bg)) fills.push({ kind: 'solid', color: withAlpha(bg, opacity) });
  if (gradient) {
    fills.push({
      kind: 'gradient',
      angleDeg: gradient.angleDeg,
      stops: gradient.stops.map((s) => ({ pos: s.pos, color: withAlpha(s.color, opacity) })),
    });
  }

  const hasShape = fills.length > 0 || anyBorder || outer;
  if (!hasShape && !imageLayer) return;

  let outline: Outline | null = null;
  let shapeRect = rect;
  let shapeRadii = radii;
  if (uniform) {
    const w = sides[0].width;
    const c = sides[0].color as Rgba;
    outline = {
      width: w,
      color: withAlpha(c, opacity),
      dash: sides[0].style === 'dashed' ? 'dash' : sides[0].style === 'dotted' ? 'dot' : 'solid',
    };
    shapeRect = {
      x: rect.x + w / 2,
      y: rect.y + w / 2,
      w: Math.max(0, rect.w - w),
      h: Math.max(0, rect.h - w),
    };
    shapeRadii = shrinkRadii(radii, w / 2);
  }
  const geometry = geometryFor(shapeRadii, shapeRect.w, shapeRect.h);
  const canClip = geometry.kind === 'rect' && !outline;
  const finalRect = canClip ? clipRect(shapeRect, m.clip, world) : shapeRect;
  if (finalRect.w < MIN_SIZE && finalRect.h < MIN_SIZE) return;
  if (finalRect.w <= 0 || finalRect.h <= 0) return;

  const nodes: ShapeNode[] = [];
  const baseName = shapeName(el, geometry);
  if (fills.length === 0 && ((anyBorder && uniform) || outer)) {
    nodes.push(
      makeShape(
        baseName,
        finalRect,
        world,
        geometry,
        null,
        uniform ? outline : null,
        outer ? toShadowEffect(outer, opacity) : null,
      ),
    );
  }
  fills.forEach((fill, i) => {
    const last = i === fills.length - 1;
    nodes.push(
      makeShape(
        baseName,
        finalRect,
        world,
        geometry,
        fill,
        last && uniform ? outline : null,
        i === 0 && outer
          ? toShadowEffect(outer, opacity)
          : last && inner
            ? toShadowEffect(inner, opacity)
            : null,
      ),
    );
  });
  for (const node of nodes) pushSlot(ctx, node);

  if (imageLayer) paintBackgroundImage(ctx, m, rect, imageLayer, geometry, radii);

  if (anyBorder && !uniform) {
    const [t, r, b, l] = sides;
    const strips: [BorderSide, Rect][] = [
      [t, { x: rect.x, y: rect.y, w: rect.w, h: t.width }],
      [r, { x: rect.x + rect.w - r.width, y: rect.y, w: r.width, h: rect.h }],
      [b, { x: rect.x, y: rect.y + rect.h - b.width, w: rect.w, h: b.width }],
      [l, { x: rect.x, y: rect.y, w: l.width, h: rect.h }],
    ];
    for (const [side, strip] of strips) {
      if (!side.visible || !side.color) continue;
      pushSlot(
        ctx,
        makeShape(
          'Border',
          strip,
          world,
          { kind: 'rect' },
          { kind: 'solid', color: withAlpha(side.color, opacity) },
          null,
          null,
        ),
      );
    }
  }
}

function sameColor(a: Rgba, b: Rgba): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && Math.abs(a.a - b.a) < 0.01;
}

function makeShape(
  name: string,
  rect: Rect,
  world: Mat,
  geometry: Geometry,
  fill: Fill | null,
  outline: Outline | null,
  shadow: ShadowEffect | null,
): ShapeNode {
  const p = placed(rect, world);
  const scaledOutline =
    outline && p.scale !== 1 ? { ...outline, width: outline.width * p.scale } : outline;
  const scaledGeometry =
    geometry.kind === 'roundRect' && p.scale !== 1
      ? { ...geometry, radius: geometry.radius * p.scale }
      : geometry;
  return {
    kind: 'shape',
    name,
    box: p.box,
    rotationDeg: p.rotationDeg,
    flipV: p.flipV,
    geometry: scaledGeometry,
    fill,
    outline: scaledOutline,
    shadow,
  };
}

function parseBackgroundPosition(value: string): { x: number; y: number } {
  const parts = value.split(/\s+/);
  const pct = (token: string | undefined, fallback: number) => {
    if (!token) return fallback;
    if (token.endsWith('%')) return Number.parseFloat(token) / 100;
    if (token === 'left' || token === 'top') return 0;
    if (token === 'center') return 0.5;
    if (token === 'right' || token === 'bottom') return 1;
    return Number.NaN;
  };
  return { x: pct(parts[0], 0.5), y: pct(parts[1], 0.5) };
}

type Placement = { rect: Rect; crop: Crop | null };

function placeImage(
  fit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
  natural: { width: number; height: number },
  box: Rect,
  pos: { x: number; y: number },
): Placement {
  if (fit === 'fill' || natural.width === 0 || natural.height === 0)
    return { rect: box, crop: null };
  let scale: number;
  switch (fit) {
    case 'cover':
      scale = Math.max(box.w / natural.width, box.h / natural.height);
      break;
    case 'contain':
      scale = Math.min(box.w / natural.width, box.h / natural.height);
      break;
    case 'none':
      scale = 1;
      break;
    case 'scale-down':
      scale = Math.min(1, Math.min(box.w / natural.width, box.h / natural.height));
      break;
  }
  const w = natural.width * scale;
  const h = natural.height * scale;
  const x = box.x + (box.w - w) * pos.x;
  const y = box.y + (box.h - h) * pos.y;
  const drawn = { x, y, w, h };
  const visible = intersect(drawn, box);
  const crop: Crop = {
    l: (visible.x - drawn.x) / w,
    t: (visible.y - drawn.y) / h,
    r: (drawn.x + drawn.w - (visible.x + visible.w)) / w,
    b: (drawn.y + drawn.h - (visible.y + visible.h)) / h,
  };
  const trivial = crop.l < 1e-4 && crop.t < 1e-4 && crop.r < 1e-4 && crop.b < 1e-4;
  return { rect: visible, crop: trivial ? null : crop };
}

function cropToClip(placement: Placement, clip: Rect | null, world: Mat): Placement | null {
  if (!clip || !isIdentity(world)) return placement;
  const { rect, crop } = placement;
  const visible = intersect(rect, clip);
  if (visible.w <= 0 || visible.h <= 0) return null;
  if (visible.x === rect.x && visible.y === rect.y && visible.w === rect.w && visible.h === rect.h)
    return placement;
  const base = crop ?? { l: 0, t: 0, r: 0, b: 0 };
  const spanX = 1 - base.l - base.r;
  const spanY = 1 - base.t - base.b;
  return {
    rect: visible,
    crop: {
      l: base.l + ((visible.x - rect.x) / rect.w) * spanX,
      t: base.t + ((visible.y - rect.y) / rect.h) * spanY,
      r: base.r + ((rect.x + rect.w - (visible.x + visible.w)) / rect.w) * spanX,
      b: base.b + ((rect.y + rect.h - (visible.y + visible.h)) / rect.h) * spanY,
    },
  };
}

function makePicture(
  name: string,
  placement: Placement,
  world: Mat,
  imageId: number,
  alpha: number,
  geometry: Geometry,
  outline: Outline | null,
  shadow: ShadowEffect | null,
): PictureNode {
  const p = placed(placement.rect, world);
  return {
    kind: 'picture',
    name,
    box: p.box,
    rotationDeg: p.rotationDeg,
    flipV: p.flipV,
    imageId,
    crop: placement.crop,
    alpha,
    geometry:
      geometry.kind === 'roundRect' && p.scale !== 1
        ? { ...geometry, radius: geometry.radius * p.scale }
        : geometry,
    outline,
    shadow,
  };
}

function paintImage(ctx: Ctx, m: Measured & { el: HTMLImageElement }): void {
  const { el, cs } = m;
  if (needsSubtreeRaster(m) || el.naturalWidth === 0) {
    if (el.naturalWidth > 0 || el.currentSrc) requestRaster(ctx, m, 'subtree');
    return;
  }
  const content = paddingBox(m.rect, cs);
  const inner = {
    x: content.x + parsePx(cs.paddingLeft),
    y: content.y + parsePx(cs.paddingTop),
    w: Math.max(0, content.w - parsePx(cs.paddingLeft) - parsePx(cs.paddingRight)),
    h: Math.max(0, content.h - parsePx(cs.paddingTop) - parsePx(cs.paddingBottom)),
  };
  const bgOrBorder = paintsAnything(cs, ctx.color);
  if (bgOrBorder) paintBoxRect(ctx, m, m.rect);
  const fit = (cs.objectFit || 'fill') as Parameters<typeof placeImage>[0];
  const pos = parseBackgroundPosition(cs.objectPosition || '50% 50%');
  const natural = { width: el.naturalWidth, height: el.naturalHeight };
  const placement = cropToClip(placeImage(fit, natural, inner, pos), m.clip, m.world);
  if (!placement || placement.rect.w < MIN_SIZE || placement.rect.h < MIN_SIZE) return;
  const radii = radiiOf(cs, m.rect.w, m.rect.h);
  const inset = bgOrBorder ? Math.max(...borderSides(cs, ctx.color).map((side) => side.width)) : 0;
  const geometry = geometryFor(shrinkRadii(radii, inset), placement.rect.w, placement.rect.h);
  const slot = pushSlot(ctx, null);
  const alpha = m.opacity;
  const src = el.currentSrc || el.src;
  const name = el.alt ? `Image: ${el.alt}` : 'Image';
  ctx.pending.push(
    ctx.images.fromUrl(src).then((loaded: LoadedImage | null) => {
      if (!loaded) return;
      slot.node = makePicture(name, placement, m.world, loaded.id, alpha, geometry, null, null);
    }),
  );
}

function paintBackgroundImage(
  ctx: Ctx,
  m: Measured,
  rect: Rect,
  layer: string,
  geometry: Geometry,
  radii: Radii,
): void {
  const url = /^url\(["']?(.*?)["']?\)$/.exec(layer)?.[1];
  if (!url) return;
  const { cs } = m;
  const repeat = cs.backgroundRepeat.split(/\s+/)[0];
  const size = cs.backgroundSize.split(',')[0].trim();
  const pos = parseBackgroundPosition(cs.backgroundPosition.split(',')[0].trim());
  if (Number.isNaN(pos.x) || Number.isNaN(pos.y)) {
    requestRaster(ctx, m, 'self');
    return;
  }
  const slot = pushSlot(ctx, null);
  ctx.pending.push(
    ctx.images.fromUrl(url).then((loaded) => {
      if (!loaded) return;
      const natural = { width: loaded.width, height: loaded.height };
      let placement: Placement;
      if (size === 'cover' || size === 'contain') {
        placement = placeImage(size, natural, rect, pos);
      } else if (size === 'auto' || size === 'auto auto') {
        placement = placeImage('none', natural, rect, pos);
      } else {
        const [sw, sh] = size.split(/\s+/);
        const resolve = (token: string | undefined, base: number): number | null => {
          if (!token || token === 'auto') return null;
          if (token.endsWith('%')) return (Number.parseFloat(token) / 100) * base;
          return parsePx(token);
        };
        let w = resolve(sw, rect.w);
        let h = resolve(sh, rect.h);
        if (w === null && h === null) {
          w = natural.width;
          h = natural.height;
        } else if (w === null) w = ((h as number) / natural.height) * natural.width;
        else if (h === null) h = (w / natural.width) * natural.height;
        const drawn = {
          x: rect.x + (rect.w - w) * pos.x,
          y: rect.y + (rect.h - (h as number)) * pos.y,
          w,
          h: h as number,
        };
        placement = cropToClip({ rect: drawn, crop: null }, rect, IDENTITY) ?? {
          rect: drawn,
          crop: null,
        };
      }
      const coversBox = placement.rect.w >= rect.w - 0.5 && placement.rect.h >= rect.h - 0.5;
      if (repeat !== 'no-repeat' && !coversBox) {
        ctx.rasters.push({
          slot,
          request: { target: m.el, mode: 'self', region: clampToSlide(rect), trim: false },
          svg: null,
        });
        return;
      }
      const finalPlacement = cropToClip(placement, m.clip, m.world);
      if (!finalPlacement) return;
      slot.node = makePicture(
        'Background image',
        finalPlacement,
        m.world,
        loaded.id,
        m.opacity,
        coversBox
          ? geometryFor(radii, rect.w, rect.h)
          : geometry.kind === 'rect'
            ? geometry
            : { kind: 'rect' },
        null,
        null,
      );
    }),
  );
}

function collectTextAtoms(
  ctx: Ctx,
  node: Text,
  cs: CSSStyleDeclaration,
  inherited: Inherited,
  atoms: Atom[],
): void {
  const text = node.data;
  if (!text || (!/\S/.test(text) && !text.includes(' '))) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0.01);
  if (rects.length === 0) return;
  const whiteSpace = cs.whiteSpace;
  const preserve = whiteSpace.startsWith('pre') && whiteSpace !== 'pre-line';
  const style = runStyle(ctx, cs, inherited);
  const styleKey = JSON.stringify(style);
  const transform = cs.textTransform;
  const transformed = applyTextTransform(text, transform);

  if (rects.length === 1 && !(preserve && text.includes('\n'))) {
    atoms.push({
      text: transformed,
      rect: rel(ctx, rects[0]),
      styleKey,
      style,
      preserveSpaces: preserve,
    });
    return;
  }

  const aligned = transformed.length === text.length;
  const segments = ctx.segmenter
    ? Array.from(ctx.segmenter.segment(text), (s) => ({ index: s.index, segment: s.segment }))
    : Array.from(text, (ch, i) => ({ index: i, segment: ch }));
  for (const { index, segment } of segments) {
    range.setStart(node, index);
    range.setEnd(node, index + segment.length);
    const r = range.getBoundingClientRect();
    if (r.width < 0.01) {
      if (/^\s+$/.test(segment) || r.height < 0.01) continue;
    }
    const piece = aligned
      ? transformed.slice(index, index + segment.length)
      : applyTextTransform(segment, transform);
    atoms.push({ text: piece, rect: rel(ctx, r), styleKey, style, preserveSpaces: preserve });
  }
}

function runStyle(ctx: Ctx, cs: CSSStyleDeclaration, inherited: Inherited): RunStyle {
  const color = ctx.color(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
  const textShadow = parseShadows(cs.textShadow, ctx.color)[0];
  const strokeWidth = parsePx((cs as unknown as Record<string, string>).webkitTextStrokeWidth);
  const strokeColor =
    strokeWidth > 0
      ? ctx.color((cs as unknown as Record<string, string>).webkitTextStrokeColor)
      : null;
  const shadow: TextShadow | null = textShadow
    ? {
        blur: textShadow.blur,
        dist: Math.hypot(textShadow.x, textShadow.y),
        dirDeg: (Math.atan2(textShadow.y, textShadow.x) * 180) / Math.PI,
        color: withAlpha(textShadow.color, inherited.opacity),
      }
    : null;
  return {
    font: resolveFontFamily(cs.fontFamily),
    sizePx: parsePx(cs.fontSize),
    bold: (Number.parseInt(cs.fontWeight, 10) || 400) >= 600,
    italic: cs.fontStyle !== 'normal',
    underline: inherited.decoration.underline || cs.textDecorationLine.includes('underline'),
    strike: inherited.decoration.strike || cs.textDecorationLine.includes('line-through'),
    color: withAlpha(color, inherited.opacity),
    letterSpacingPx: cs.letterSpacing === 'normal' ? 0 : parsePx(cs.letterSpacing),
    baselineShift:
      cs.verticalAlign === 'super' ? 'super' : cs.verticalAlign === 'sub' ? 'sub' : null,
    shadow,
    outline:
      strokeColor && isVisibleColor(strokeColor)
        ? { width: strokeWidth, color: withAlpha(strokeColor, inherited.opacity) }
        : null,
  };
}

function alignOf(cs: CSSStyleDeclaration): Paragraph['align'] {
  switch (cs.textAlign) {
    case 'center':
      return 'ctr';
    case 'right':
    case 'end':
      return 'r';
    case 'justify':
      return 'just';
    default:
      return 'l';
  }
}

const NUMBER_SCHEMES: Record<string, string> = {
  decimal: 'arabicPeriod',
  'decimal-leading-zero': 'arabicPeriod',
  'lower-alpha': 'alphaLcPeriod',
  'lower-latin': 'alphaLcPeriod',
  'upper-alpha': 'alphaUcPeriod',
  'upper-latin': 'alphaUcPeriod',
  'lower-roman': 'romanLcPeriod',
  'upper-roman': 'romanUcPeriod',
};

const BULLET_CHARS: Record<string, string> = { disc: '•', circle: '○', square: '▪' };

function bulletFor(
  ctx: Ctx,
  m: Measured,
  firstStyle: RunStyle,
): { bullet: Bullet; width: number } | null {
  const { el, cs } = m;
  if (cs.display !== 'list-item') return null;
  const type = cs.listStyleType;
  if (type === 'none' || cs.listStylePosition !== 'outside') return null;
  const markerColor = ctx.color(getComputedStyle(el, '::marker').color) ?? firstStyle.color;
  const color = withAlpha(markerColor, m.opacity);
  const size = firstStyle.sizePx;
  const scheme = NUMBER_SCHEMES[type];
  if (scheme) {
    const list = el.parentElement;
    let index = 1;
    if (list) {
      const items = Array.from(list.children).filter(
        (c) => getComputedStyle(c).display === 'list-item',
      );
      const start = list instanceof HTMLOListElement ? list.start : 1;
      index = start + items.indexOf(el);
    }
    const label = `${index}. `;
    const width = measureText(ctx, cs, label) || size * 1.2;
    return { bullet: { kind: 'number', scheme, startAt: index, color }, width };
  }
  const char = BULLET_CHARS[type];
  if (!char) return null;
  return { bullet: { kind: 'char', char, color, font: 'Arial' }, width: size * 0.5 };
}

function measureText(ctx: Ctx, cs: CSSStyleDeclaration, text: string): number {
  const c = ctx.measureCanvas;
  if (!c) return 0;
  try {
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return c.measureText(text).width;
  } catch {
    return 0;
  }
}

function paintText(ctx: Ctx, m: Measured, atoms: Atom[]): void {
  if (atoms.length === 0) return;
  const lines = fillEmptyLines(groupAtomsIntoLines(atoms));
  while (lines.length > 0 && lines[lines.length - 1].atoms.length === 0) lines.pop();
  if (lines.length === 0) return;
  const textLines: TextLine[] = lines.map(lineToRuns);
  if (textLines.every((l) => l.runs.length === 0)) return;

  const cs = m.cs;
  const cssLineHeight = cs.lineHeight === 'normal' ? null : parsePx(cs.lineHeight);
  const firstPitch =
    lines.length >= 2
      ? lines[1].bottom - lines[0].bottom
      : (cssLineHeight ?? lines[0].bottom - lines[0].top);
  const boxTop = lines[0].bottom - firstPitch;

  const paragraphs: Paragraph[] = [];
  const align = alignOf(cs);
  const firstStyle = textLines.find((l) => l.runs.length > 0)?.runs[0].style ?? atoms[0].style;
  const marker = bulletFor(ctx, m, firstStyle);
  let current: Paragraph | null = null;
  let currentPitch = Number.NaN;
  let height = 0;
  for (let i = 0; i < lines.length; i++) {
    const pitch = i === 0 ? firstPitch : lines[i].bottom - lines[i - 1].bottom;
    if (!current || Math.abs(pitch - currentPitch) > PITCH_TOLERANCE) {
      current = {
        lineSpacingPx: Math.max(1, pitch),
        lines: [],
        align,
        bullet: paragraphs.length === 0 && marker ? marker.bullet : null,
        marginLeftPx: marker ? marker.width : 0,
        indentPx: paragraphs.length === 0 && marker ? -marker.width : 0,
        endSizePx: lines[i].sizePx,
      };
      currentPitch = pitch;
      paragraphs.push(current);
    }
    current.lines.push(textLines[i]);
    height += Math.max(1, pitch);
  }

  const left = Math.min(...lines.map((l) => l.left)) - (marker ? marker.width : 0);
  const right = Math.max(...lines.map((l) => l.right));
  const layoutBox: Rect = {
    x: left,
    y: boxTop,
    w: Math.max(1, right - left),
    h: Math.max(1, height),
  };
  const p = placed(layoutBox, m.world);
  if (p.scale !== 1) {
    for (const para of paragraphs) {
      para.lineSpacingPx *= p.scale;
      para.marginLeftPx *= p.scale;
      para.indentPx *= p.scale;
      para.endSizePx *= p.scale;
      for (const line of para.lines) {
        line.sizePx *= p.scale;
        for (const run of line.runs) {
          run.style = {
            ...run.style,
            sizePx: run.style.sizePx * p.scale,
            letterSpacingPx: run.style.letterSpacingPx * p.scale,
          };
        }
      }
    }
  }
  const preview = textLines
    .flatMap((l) => l.runs.map((r) => r.text))
    .join(' ')
    .trim()
    .slice(0, 40);
  const node: TextNode = {
    kind: 'text',
    name: preview ? `Text: ${preview}` : 'Text',
    box: p.box,
    rotationDeg: p.rotationDeg,
    flipV: p.flipV,
    paragraphs,
  };
  pushSlot(ctx, node);
}
