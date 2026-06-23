import type {
  IRGroup,
  IRPage,
  IRItem,
  IRRichText,
  IRImage,
  IRDecorBox,
  IRShape,
  IRCurvePath,
  Run,
} from './types.ts';
import type { PageMeasure, Rect, TextLeaf, SvgShape } from './extract-pw.ts';
import { classifyLeaf } from './classifier.ts';
import { classifyPoints, type Point } from './shape-classify.ts';

const CANVAS_W = 1920 as const;
const CANVAS_H = 1080 as const;
const CANVAS_AREA = CANVAS_W * CANVAS_H;

function r(rect: Rect) {
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

function pickFontFamily(family: string): 'mono' | 'body' | 'display' | undefined {
  if (!family) return undefined;
  const f = family.toLowerCase();
  if (
    f.includes('mono') ||
    f.includes('consolas') ||
    f.includes('jetbrains') ||
    f.includes('cascadia')
  )
    return 'mono';
  return 'body';
}

function svgToIR(s: SvgShape, id: string): IRItem[] {
  switch (s.tag) {
    case 'rect':
      return [
        {
          kind: 'Shape',
          id,
          shape: (s.rx ?? 0) > 0 ? 'roundRect' : 'rect',
          rect: r(s.rect),
          fill: s.fill || undefined,
          stroke: s.stroke || undefined,
          strokeWidth: s.strokeWidth,
          rectRadius: (s.rx ?? 0) > 0 ? (s.rx as number) : undefined,
        } as IRShape,
      ];
    case 'circle':
    case 'ellipse':
      return [
        {
          kind: 'Shape',
          id,
          shape: 'ellipse',
          rect: r(s.rect),
          fill: s.fill || undefined,
          stroke: s.stroke || undefined,
          strokeWidth: s.strokeWidth,
        } as IRShape,
      ];
    case 'line':
      return [
        {
          kind: 'Shape',
          id,
          shape: 'line',
          rect: {
            x: Math.min(s.x1, s.x2),
            y: Math.min(s.y1, s.y2),
            w: Math.abs(s.x2 - s.x1),
            h: Math.abs(s.y2 - s.y1),
          },
          stroke: s.stroke || undefined,
          strokeWidth: s.strokeWidth,
          dashed: s.dashed,
          endArrow: !!s.markerEnd,
          flipH: s.x1 > s.x2,
          flipV: s.y1 > s.y2,
        } as IRShape,
      ];
    case 'curvePath': {
      const nums = s.points
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((v) => !Number.isNaN(v));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
      if (pts.length < 2) return [];
      return [
        {
          kind: 'CurvePath',
          id,
          points: pts,
          closed: !!s.closed,
          rect: r(s.rect),
          fill: s.fill || undefined,
          stroke: s.stroke || undefined,
          strokeWidth: s.strokeWidth,
          dashed: s.dashed,
          endArrow: !!s.markerEnd,
          domLeafId: s.leafId,
        } as IRCurvePath,
      ];
    }
    case 'polyline': {
      const nums = s.points
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((v) => !Number.isNaN(v));
      const pts: Point[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
      const cls = classifyPoints(pts);
      if (cls.kind === 'line') {
        return [
          {
            kind: 'Shape',
            id,
            shape: 'line',
            rect: {
              x: Math.min(cls.a.x, cls.b.x),
              y: Math.min(cls.a.y, cls.b.y),
              w: Math.abs(cls.b.x - cls.a.x),
              h: Math.abs(cls.b.y - cls.a.y),
            },
            stroke: s.stroke || undefined,
            strokeWidth: s.strokeWidth,
            flipH: cls.a.x > cls.b.x,
            flipV: cls.a.y > cls.b.y,
          } as IRShape,
        ];
      }
      if (cls.kind === 'rect') {
        return [
          {
            kind: 'Shape',
            id,
            shape: 'rect',
            rect: { x: cls.x, y: cls.y, w: cls.w, h: cls.h },
            fill: s.fill || undefined,
            stroke: s.stroke || undefined,
            strokeWidth: s.strokeWidth,
          } as IRShape,
        ];
      }
      // polyline — keep the existing N-1 segment fallback.
      const out: IRItem[] = [];
      for (let i = 0; i + 1 < cls.points.length; i++) {
        const a = cls.points[i];
        const b = cls.points[i + 1];
        out.push({
          kind: 'Shape',
          id: `${id}-seg-${i}`,
          shape: 'line',
          rect: {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            w: Math.abs(b.x - a.x),
            h: Math.abs(b.y - a.y),
          },
          stroke: s.stroke || undefined,
          strokeWidth: s.strokeWidth,
          flipH: a.x > b.x,
          flipV: a.y > b.y,
        } as IRShape);
      }
      return out;
    }
    case 'text': {
      // Chromium's <text> bbox is tight; PowerPoint's mono fallback (Cascadia
      // for JetBrains Mono) renders ~10–20% wider. Pad generously and shift
      // anchor so the visual stays centered/right where source intended.
      const padW = Math.max(40, s.fontSize * 2);
      const padH = Math.max(8, s.fontSize * 0.5);
      const isCenter = s.textAnchor === 'middle';
      const isRight = s.textAnchor === 'end';
      const dx = isCenter ? padW / 2 : isRight ? padW : 0;
      return [
        {
          kind: 'RichText',
          id,
          rect: {
            x: s.rect.x - dx,
            y: s.rect.y,
            w: s.rect.w + padW,
            h: s.rect.h + padH,
          },
          runs: [
            {
              text: s.text,
              color: s.fill || '#1a1f2e',
            },
          ],
          fontSize: s.fontSize,
          fontFamily:
            s.fontFamily.toLowerCase().includes('mono') ||
            s.fontFamily.toLowerCase().includes('jetbrains') ||
            s.fontFamily.toLowerCase().includes('cascadia') ||
            s.fontFamily.toLowerCase().includes('consolas')
              ? 'mono'
              : 'body',
          align: isCenter ? 'center' : isRight ? 'right' : 'left',
          valign: 'top',
          domLeafId: s.leafId,
          classification: classifyLeaf({
            type: 'text',
            text: s.text,
            rect: s.rect,
            color: s.fill,
            fontSize: s.fontSize,
            fontFamily: s.fontFamily,
          }),
          fallbackImageDataUrl: s.fallbackImageDataUrl,
        } as IRRichText,
      ];
    }
    default:
      return [];
  }
}

function textLeafToRich(t: TextLeaf, id: string): IRRichText {
  const runs: Run[] =
    t.runs && t.runs.length > 0
      ? t.runs.map((r) => ({
          text: r.text,
          color: r.color || t.color || '#1a1f2e',
          bold: r.bold,
          italic: r.italic,
          mono: r.mono,
        }))
      : [{ text: t.text, color: t.color || '#1a1f2e', bold: t.fontWeight >= 600 }];
  let classification = classifyLeaf({
    type: 'text',
    text: t.text,
    rect: t.rect,
    color: t.color,
    fontSize: t.fontSize,
    fontFamily: t.fontFamily,
    cssFeatureFlags: t.cssFeatureFlags,
  });
  // extract-pw attaches a fallback PNG when the leaf's bbox extends
  // past the slide canvas — the classifier itself has no canvas-size
  // knowledge, so upgrade the classification here so pptx-build's
  // ImageFallback dispatch path takes over. Otherwise the native text
  // emit would land at the clipped rect and re-flow the glyphs (a
  // partially-off-slide "01" hero digit would become a smaller centred
  // "01" instead of preserving the HTML's left-cut profile).
  if (t.fallbackImageDataUrl && classification.kind !== 'ImageFallback') {
    classification = {
      kind: 'ImageFallback',
      reasons: [...classification.reasons, 'fallback-image-attached'],
    };
  }
  return {
    kind: 'RichText',
    id,
    rect: r(t.rect),
    runs,
    fontSize: t.fontSize || 20,
    fontFamily: pickFontFamily(t.fontFamily),
    align:
      t.textAlign === 'center' || t.textAlign === 'right' || t.textAlign === 'left'
        ? (t.textAlign as any)
        : 'left',
    valign: 'top',
    domLeafId: t.leafId,
    classification,
    fallbackImageDataUrl: t.fallbackImageDataUrl,
  };
}

export function measureToIR(m: PageMeasure): IRPage {
  // Buckets keyed by parent id (null = page root).
  const buckets = new Map<string | null, IRItem[]>();
  const groupById = new Map<string, IRGroup>();
  // Primitives that are being substituted by an Image leaf (CSS gradient /
  // url() background — the only honest way to reproduce a multi-stop
  // gradient in pptx). Any leaf whose closest enclosing primitive is in
  // this set must be suppressed: its rendering is already baked into the
  // primitive's screenshot, and emitting it again would double-paint
  // (white text on top of the gradient that already contains the text).
  const fallbackPrimIds = new Set<string>();
  for (const p of m.primitives) {
    if (p.fallbackImageDataUrl) fallbackPrimIds.add(p.id);
  }
  // Cascade suppression: a primitive nested INSIDE a fallback'd primitive is
  // already baked into the parent's screenshot. Without cascade, step 1
  // would still create a Group for the nested primitive, step 3 would push
  // it into bucket[parentId], but the parent has no entry in groupById
  // (skipped on line 176) — the nested primitive (and all its descendants)
  // would silently vanish from the IR. Tracked separately from
  // fallbackPrimIds so we suppress these primitives entirely in step 3
  // (no separate Image leaf — they have no fallbackImageDataUrl of their
  // own, since the parent's screenshot already covers them). The leaf-level
  // closest-primitive checks (steps 2/4/5/6) walk the DOM up to the closest
  // [data-prim-id] which is the nested primitive itself; we extend those by
  // also treating cascade-suppressed groups as fallback for leaf rejection.
  const cascadeSuppressedPrimIds = new Set<string>();
  for (const p of m.primitives) {
    if (fallbackPrimIds.has(p.id)) continue;
    let anc = p.parentId;
    while (anc) {
      if (fallbackPrimIds.has(anc) || cascadeSuppressedPrimIds.has(anc)) {
        cascadeSuppressedPrimIds.add(p.id);
        break;
      }
      const parent = m.primitives.find((q) => q.id === anc);
      anc = parent ? parent.parentId : null;
    }
  }
  // Unified set used by every leaf-suppression check below. Cascade-
  // suppressed primitives still need their leaves dropped (the parent's
  // screenshot already contains them).
  const suppressedPrimIds = new Set<string>([...fallbackPrimIds, ...cascadeSuppressedPrimIds]);
  const push = (parentId: string | null, item: IRItem) => {
    let arr = buckets.get(parentId);
    if (!arr) {
      arr = [];
      buckets.set(parentId, arr);
    }
    arr.push(item);
  };

  // 1) Create empty groups for every primitive — preserves declaration order.
  //    Primitives flagged for image-fallback skip group creation; they are
  //    substituted with a single Image leaf in step 3. Cascade-suppressed
  //    primitives also skip group creation AND skip step 3 entirely (their
  //    rendering is baked into the ancestor's screenshot).
  for (const p of m.primitives) {
    if (suppressedPrimIds.has(p.id)) continue;
    const g: IRGroup = {
      kind: 'Group',
      id: p.id,
      name: p.name,
      rect: r(p.rect),
      children: [],
    };
    groupById.set(p.id, g);
  }

  // 2) Decor FIRST — pushed before groups so they end up at the BACK of the
  //    z-stack in every bucket. Otherwise an outer card's white panel would
  //    paint on top of the BitField groups it contains and hide them.
  let decorN = 0;
  let bgOverride: string | undefined;
  for (const d of m.decors) {
    if (d.rect.w * d.rect.h > CANVAS_AREA * 0.9) {
      // Full-bleed wrapper: don't emit as a shape (would paint over content),
      // but capture its solid background colour so pptx-build can apply it
      // as the slide background. Later, larger overrides win (the outermost
      // wrapper is iterated last under the normal DOM order).
      if (d.background) bgOverride = d.background;
      continue;
    }
    if (d.groupId && suppressedPrimIds.has(d.groupId)) continue; // baked into primitive screenshot
    const decor: IRDecorBox = {
      kind: 'Decor',
      id: `decor-${decorN++}`,
      rect: r(d.rect),
      background: d.background || undefined,
      borderColor: d.borderColor || undefined,
      borderWidth: d.borderWidth,
      borderRadii: d.borderRadii,
      boxShadow: d.boxShadow || undefined,
    };
    decor.domLeafId = d.leafId;
    decor.classification = classifyLeaf({
      type: 'decor',
      rect: d.rect,
      background: d.background,
      backgroundImage: d.backgroundImage,
      borderWidth: d.borderWidth,
      cssFeatureFlags: d.cssFeatureFlags,
    });
    if (d.fallbackImageDataUrl) {
      decor.fallbackImageDataUrl = d.fallbackImageDataUrl;
      // extract-pw can attach a fallback PNG for reasons the classifier
      // doesn't know about — currently slide-canvas overflow promotion.
      // pptx-build dispatches based on classification.kind, so we must
      // upgrade the classification or the decor will emit as a native
      // shape at the clipped rect (which would render as a smaller
      // full shape instead of a HTML-faithful clipped one).
      decor.classification = {
        kind: 'ImageFallback',
        reasons: [...(decor.classification?.reasons ?? []), 'fallback-image-attached'],
      };
    }
    push(d.groupId, decor);
  }

  // 3) Place groups under their parent — drawn on top of any decor that
  //    shares the same bucket. Fallback'd primitives become a single Image
  //    leaf at the primitive's rect instead of an editable group. Cascade-
  //    suppressed primitives emit nothing here: the ancestor's screenshot
  //    already includes them and the leaf-rejection loops below drop their
  //    descendants.
  let primImgN = 0;
  for (const p of m.primitives) {
    if (cascadeSuppressedPrimIds.has(p.id)) continue;
    if (fallbackPrimIds.has(p.id)) {
      const img: IRImage = {
        kind: 'Image',
        id: `primimg-${primImgN++}`,
        rect: r(p.rect),
        src: p.fallbackImageDataUrl!,
        alt: p.name,
        srcPrimId: p.id,
      };
      img.domLeafId = p.id;
      img.classification = {
        kind: 'ImageFallback',
        reasons: ['primitive:non-native-background'],
      };
      push(p.parentId, img);
      continue;
    }
    const g = groupById.get(p.id)!;
    push(p.parentId, g);
  }

  // 4) Images.
  let imgN = 0;
  for (const im of m.images) {
    if (im.groupId && suppressedPrimIds.has(im.groupId)) continue;
    const img: IRImage = {
      kind: 'Image',
      id: `img-${imgN++}`,
      rect: r(im.rect),
      src: im.src,
      alt: im.alt,
    };
    img.domLeafId = im.leafId;
    img.classification = classifyLeaf({
      type: 'image',
      rect: im.rect,
      src: im.src,
    });
    if (im.fallbackImageDataUrl) img.fallbackImageDataUrl = im.fallbackImageDataUrl;
    push(im.groupId, img);
  }

  // 5) Text leaves.
  let txtN = 0;
  for (const t of m.texts) {
    if (!t.text?.trim()) continue;
    if (t.rect.w <= 0 || t.rect.h <= 0) continue;
    if (t.groupId && suppressedPrimIds.has(t.groupId)) continue;
    const rich = textLeafToRich(t, `txt-${txtN++}`);
    push(t.groupId, rich);
  }

  // 6) SVG primitives — emit one or more IR items, attribute to closest group.
  // When a group of svgShapes share a leafId AND have a fallbackImageDataUrl,
  // emit ONE Shape covering their union bbox classified as ImageFallback,
  // not N tiny line-segment shapes each holding the same PNG.
  let svgN = 0;
  // Pre-group by leafId so we can detect path-segment splits up front.
  const svgByLeaf = new Map<string, typeof m.svgShapes>();
  for (const s of m.svgShapes) {
    if (!svgByLeaf.has(s.leafId)) svgByLeaf.set(s.leafId, []);
    svgByLeaf.get(s.leafId)!.push(s);
  }
  const handledLeafIds = new Set<string>();
  for (const s of m.svgShapes) {
    if (s.groupId && suppressedPrimIds.has(s.groupId)) continue;
    // If this leafId has a fallback image and we haven't handled it yet, emit
    // a single ImageFallback covering the union bbox of all sibling segments
    // and skip the rest of the group.
    if (s.fallbackImageDataUrl && !handledLeafIds.has(s.leafId)) {
      handledLeafIds.add(s.leafId);
      const group = svgByLeaf.get(s.leafId)!;
      const minX = Math.min(...group.map((g) => g.rect.x));
      const minY = Math.min(...group.map((g) => g.rect.y));
      const maxX = Math.max(...group.map((g) => g.rect.x + g.rect.w));
      const maxY = Math.max(...group.map((g) => g.rect.y + g.rect.h));
      const unionRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      let svgClass = classifyLeaf({
        type: 'svg',
        rect: unionRect,
        hasUnsupportedPath: s.hasUnsupportedPath,
        hasUse: s.hasUse,
        hasPattern: s.hasPattern,
        hasMask: s.hasMask,
      });
      // Mirror the text/decor upgrade: extract-pw promotes overflowing
      // SVG leaves to fallback regardless of classifier verdict, so a
      // simple icon that happens to bleed off-canvas still gets the
      // raster path through pptx-build.
      if (svgClass.kind !== 'ImageFallback') {
        svgClass = {
          kind: 'ImageFallback',
          reasons: [...svgClass.reasons, 'fallback-image-attached'],
        };
      }
      const fallback: IRShape = {
        kind: 'Shape',
        id: `svg-${svgN++}`,
        shape: 'rect',
        rect: unionRect,
        domLeafId: s.leafId,
        classification: svgClass,
        fallbackImageDataUrl: s.fallbackImageDataUrl,
      };
      push(s.groupId, fallback);
      continue;
    }
    if (handledLeafIds.has(s.leafId)) continue; // already emitted as fallback
    const items = svgToIR(s, `svg-${svgN++}`);
    for (const item of items) {
      if (item.kind === 'Shape' || item.kind === 'CurvePath') {
        item.classification = classifyLeaf({
          type: 'svg',
          rect: item.rect,
          hasUnsupportedPath: s.hasUnsupportedPath,
          hasUse: s.hasUse,
          hasPattern: s.hasPattern,
          hasMask: s.hasMask,
        });
        item.domLeafId = s.leafId;
        if (item.kind === 'Shape' && s.fallbackImageDataUrl)
          item.fallbackImageDataUrl = s.fallbackImageDataUrl;
      }
      push(s.groupId, item);
    }
  }

  // 8) Resolve buckets onto groups + root.
  for (const [parentId, items] of buckets) {
    if (parentId == null) continue;
    const g = groupById.get(parentId);
    if (g) g.children = items;
  }

  return {
    pageId: `${m.pageIndex}`,
    pageIndex: m.pageIndex,
    pageName: m.pageName,
    size: { w: CANVAS_W, h: CANVAS_H },
    items: buckets.get(null) ?? [],
    bgOverride,
  };
}
