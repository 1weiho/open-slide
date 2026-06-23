// playwright is an OPTIONAL peer dependency. Import its types only (erased at
// build time, so a host without playwright installed does not crash at module
// load) and pull the runtime `chromium` in lazily inside measureSlide().
import type { Browser } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { PageHtml } from './render-html.ts';
import type { PrimRecord } from './instrument.tsx';
import { intersectSlide, overflowsCanvas, TRANSPARENT_PNG_1X1 } from './clip-to-slide.ts';

/**
 * Raised when Playwright (optional peer) or its Chromium binary is missing.
 * The dev-server export route catches this to prompt the user to install
 * Playwright instead of surfacing a raw stack trace.
 */
export class PlaywrightUnavailableError extends Error {
  readonly code = 'PLAYWRIGHT_UNAVAILABLE';
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PlaywrightUnavailableError';
    if (cause !== undefined) this.cause = cause;
  }
}

export type Rect = { x: number; y: number; w: number; h: number };

export type CssFeatureFlags = {
  filter: string; // e.g. 'blur(8px)' | ''
  mask: string; // computed mask-image when not 'none'
  clipPath: string; // computed clip-path when not 'none'
  mixBlendMode: string; // when not 'normal'
  transform: string; // when not 'none' AND not a translate/rotate-only matrix
  animationName: string; // when not 'none' — recorded for reference only
};

export type PrimMeasure = {
  id: string;
  name: string;
  rect: Rect;
  svgOffset: { x: number; y: number } | null;
  props: Record<string, any>;
  parentId: string | null; // NEW — closest enclosing primitive id
  // When the primitive's root element has a CSS feature that the native
  // emit path cannot reproduce (linear-gradient / radial-gradient / url()
  // background, etc.), set to a data: URL of the whole primitive's
  // rendering. measureToIR then emits a single Image leaf in place of the
  // group and suppresses every descendant leaf (which is already baked
  // into the screenshot).
  fallbackImageDataUrl?: string;
};

export type TextLeaf = {
  rect: Rect;
  text: string;
  runs: { text: string; color: string; bold: boolean; italic: boolean; mono: boolean }[];
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  background: string;
  borderColor: string;
  borderRadius: number;
  textAlign: string;
  padding: { t: number; r: number; b: number; l: number };
  cssFeatureFlags: CssFeatureFlags;
  groupId: string | null; // NEW
  leafId: string;
  fallbackImageDataUrl?: string;
};

export type ImageLeaf = {
  rect: Rect;
  src: string;
  alt?: string;
  groupId: string | null; // NEW
  leafId: string;
  fallbackImageDataUrl?: string;
};

export type DecorBox = {
  rect: Rect;
  background?: string;
  // Captured when the element has a non-trivial background-image (CSS
  // gradient or url()). The classifier promotes such decors to
  // ImageFallback so the gradient/picture renders as an embedded PNG
  // instead of silently dropping out of the pptx export.
  backgroundImage?: string;
  borderColor?: string;
  borderWidth: number;
  borderRadii: [number, number, number, number];
  boxShadow: { offsetX: number; offsetY: number; blur: number; color: string } | null;
  cssFeatureFlags: CssFeatureFlags;
  groupId: string | null; // NEW
  leafId: string;
  fallbackImageDataUrl?: string;
};

export type SvgShape = {
  tag: string; // 'rect' | 'line' | 'polyline' | 'circle' | 'ellipse' | 'text' | 'curvePath'
  rect: Rect;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  rx?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  points: string;
  markerEnd: string;
  // Plan J: closed=true when a curvePath's `d` ends with Z/z. Used by the
  // custGeom emitter to decide whether to write <a:close/>.
  closed?: boolean;
  text: string;
  fontSize: number;
  fontFamily: string;
  textAnchor: string;
  // Structural flags for the classifier. `hasUnsupportedPath` is always false
  // since Plan E uses getPointAtLength + getScreenCTM to render all path
  // commands natively (including A/S/T). Field retained for type-shape
  // compatibility with classifier and measure-to-ir.
  hasUnsupportedPath: boolean;
  hasUse: boolean;
  hasPattern: boolean;
  hasMask: boolean;
  groupId: string | null;
  leafId: string;
  fallbackImageDataUrl?: string;
};

export type PageMeasure = {
  pageIndex: number;
  pageName: string;
  primitives: PrimMeasure[];
  texts: TextLeaf[];
  images: ImageLeaf[];
  decors: DecorBox[];
  svgShapes: SvgShape[];
};

const EXTRACT_SCRIPT = `(() => {
  const pickRect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };

  // Text-leaf rect: when content overflows the layout box (scrollWidth >
  // clientWidth, no clip), the displayed text actually spans wider than the
  // border-box. Using the border-box would let PowerPoint wrap at the
  // narrower number even though the original layout shows it on one line.
  const pickTextRect = (el) => {
    const r = el.getBoundingClientRect();
    let w = r.width;
    const cs = getComputedStyle(el);
    const clipped = cs.overflow !== 'visible' && cs.overflow !== '' || cs.whiteSpace === 'nowrap' && false;
    // Inline elements: scrollWidth is meaningless on them; their bounding
    // rect already reflects the line-box content.
    if (el.nodeType === 1 && !INLINE_TAGS.has(el.tagName)) {
      if (cs.overflow === 'visible' || cs.overflow === '') {
        const sw = el.scrollWidth;
        if (sw > w + 1) w = sw;
      }
    }
    return { x: r.left, y: r.top, w, h: r.height };
  };

  // Background images that the native decor emitter cannot reproduce:
  // CSS gradients (linear, radial, conic) and url() backgrounds. When the
  // primitive's root element carries one of these, the only honest path is
  // to screenshot the whole primitive and embed the PNG. Solid background-
  // color values still flow through the native decor path.
  const hasNonNativeBackground = (cs) => {
    const bi = cs.backgroundImage || '';
    if (!bi || bi === 'none') return false;
    // Be generous: any gradient or url() syntax counts. The browser
    // computed-style serialises these identifiers verbatim.
    if (bi.includes('gradient(')) return true;
    if (bi.includes('url(')) return true;
    return false;
  };

  const PRIM_ELEMENTS = Array.from(document.querySelectorAll('[data-prim-id]'));
  const primitives = PRIM_ELEMENTS.map((el) => {
    const svg = el.closest('svg');
    const svgRect = svg ? svg.getBoundingClientRect() : null;
    const cs = getComputedStyle(el);
    return {
      id: el.getAttribute('data-prim-id'),
      name: el.getAttribute('data-prim-name'),
      rect: pickRect(el),
      svgOffset: svgRect ? { x: svgRect.left, y: svgRect.top } : null,
      parentId: el.parentElement?.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null,
      needsFallback: hasNonNativeBackground(cs),
    };
  });

  // Set of nodes that are inside a primitive — skip those for generic
  // text/image collection so we don't double-count Box internals etc.
  const inPrim = new WeakSet();
  for (const p of PRIM_ELEMENTS) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_ELEMENT);
    let n; while ((n = walker.nextNode())) inPrim.add(n);
  }

  // IMPORTANT: leafIdOf must be defined before the images loop (and any other
  // loop that calls it) — 'const' is not hoisted, so calling it before its
  // declaration throws a TDZ ReferenceError when the script is eval-ed.
  const leafIdOf = (el) => {
    const prim = el.closest('[data-prim-id]');
    const primId = prim?.getAttribute('data-prim-id') || 'root';
    const path = [];
    let cur = el;
    while (cur && cur !== prim && cur.parentElement) {
      const sibs = Array.from(cur.parentElement.children);
      path.unshift(sibs.indexOf(cur));
      cur = cur.parentElement;
    }
    const id = path.length === 0 ? primId : primId + ':' + path.join('.');
    if (!el.getAttribute('data-leaf-id')) el.setAttribute('data-leaf-id', id);
    return id;
  };

  const trim = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const parseColor = (s) => {
    const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(s || '');
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] != null ? +m[4] : 1 };
  };
  const bgColor = parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  const blendOver = (c) => ({
    r: Math.round(bgColor.r + (c.r - bgColor.r) * c.a),
    g: Math.round(bgColor.g + (c.g - bgColor.g) * c.a),
    b: Math.round(bgColor.b + (c.b - bgColor.b) * c.a),
  });
  const toHex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  const colorRgbToHex = (s) => {
    const c = parseColor(s);
    if (!c) return '';
    return toHex(c.a < 1 ? blendOver(c) : c);
  };
  const parsePx = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  const images = [];
  for (const img of document.querySelectorAll('img')) {
    // Trust the browser: img.getBoundingClientRect() is the IMG element's
    // layout box, which already accounts for natural aspect ratio + any
    // width/height auto-resolution + CSS object-fit. Using the parent
    // wrapper's rect and relying on pptxgenjs sizing:contain is
    // unreliable — PowerPoint silently stretches embedded images to fill
    // the rect regardless of the sizing hint, distorting icons (see
    // getting-started AssetsManager logos at 64px tall inside 270x130
    // flex cells). The IMG's own rect matches what Chromium painted.
    // Note: do NOT skip imgs inside primitives — every React component
    // is tagged as a primitive, so skipping would drop all <img>.
    const rect = pickRect(img);
    images.push({
      rect,
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
      leafId: leafIdOf(img),
      groupId: img.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null,
    });
  }

  const isTrivialTransform = (t) => {
    if (!t || t === 'none') return true;
    const m = /^matrix\\(([^)]+)\\)/.exec(t);
    if (m) {
      const v = m[1].split(',').map((s) => parseFloat(s.trim()));
      if (v.length === 6) {
        const [a, b, c, d] = v;
        const isPureRotate = Math.abs(a*a + b*b - 1) < 1e-3 && Math.abs(c*c + d*d - 1) < 1e-3;
        return isPureRotate;
      }
    }
    return false;
  };
  const buildCssFeatureFlags = (cs) => ({
    filter: cs.filter && cs.filter !== 'none' ? cs.filter : '',
    mask: cs.mask && cs.mask !== 'none' ? cs.mask : '',
    clipPath: cs.clipPath && cs.clipPath !== 'none' ? cs.clipPath : '',
    mixBlendMode: cs.mixBlendMode && cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : '',
    transform: isTrivialTransform(cs.transform) ? '' : cs.transform,
    animationName: cs.animationName && cs.animationName !== 'none' ? cs.animationName : '',
  });

  // Walk up from el (including el itself) to body; return true if any
  // ancestor has mix-blend-mode != normal. PowerPoint does not honour
  // CSS blend modes when stamping shapes — multiply-noise overlays end
  // up painted as solid dark layers, producing 90%+ pixel diffs on
  // every page of decks that use a paper-grain texture (claude-code-intro
  // pattern). Skipping these elements at extraction time omits the
  // decorative overlay from the pptx, leaving the underlying bg intact.
  const hasBlendModeAncestor = (el) => {
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      const m = getComputedStyle(n).mixBlendMode;
      if (m && m !== 'normal') return true;
      n = n.parentElement;
    }
    return false;
  };

  const INLINE_TAGS = new Set(['SPAN','EM','STRONG','B','I','A','CODE','SUP','SUB','MARK','U','SMALL','KBD','SAMP','VAR','BR','WBR','NOBR']);

  // Pick a usable text color when CSS uses the gradient-text trick
  // (background-image linear-gradient + background-clip text + transparent color):
  // the computed color is transparent so falling back to it produces invisible
  // text in pptx. Parse the first color stop from background-image instead.
  const firstGradientColor = (bgImage) => {
    if (!bgImage || bgImage === 'none') return '';
    const m = /rgba?\\([^)]+\\)|#[0-9a-f]{3,8}/i.exec(bgImage);
    return m ? m[0] : '';
  };
  const effectiveColor = (cs) => {
    const raw = cs.color || '';
    const parsed = parseColor(raw);
    const clip = cs.webkitBackgroundClip || cs.backgroundClip || '';
    if (parsed && parsed.a === 0 && clip.includes('text')) {
      const grad = firstGradientColor(cs.backgroundImage || '');
      if (grad) return colorRgbToHex(grad) || colorRgbToHex(raw);
    }
    return colorRgbToHex(raw);
  };
  const styleSig = (el) => {
    const cs = getComputedStyle(el);
    return {
      color: effectiveColor(cs),
      bold: parseInt(cs.fontWeight, 10) >= 600,
      italic: cs.fontStyle === 'italic',
      mono: (cs.fontFamily || '').toLowerCase().includes('mono')
         || (cs.fontFamily || '').toLowerCase().includes('jetbrains')
         || (cs.fontFamily || '').toLowerCase().includes('cascadia')
         || (cs.fontFamily || '').toLowerCase().includes('consolas'),
    };
  };
  const collectRuns = (el) => {
    const own = styleSig(el);
    const out = [];
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const t = child.textContent;
        if (t && t.length) out.push({ text: t, ...own });
      } else if (child.nodeType === 1) {
        if (INLINE_TAGS.has(child.tagName)) {
          if (child.tagName === 'BR') {
            out.push({ text: '\\n', ...own });
          } else {
            out.push(...collectRuns(child));
          }
        }
      }
    }
    return out;
  };
  const isInlineEl = (n) => n.nodeType === 1 && INLINE_TAGS.has(n.tagName);

  const texts = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    if (el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'STYLE') continue;
    if (INLINE_TAGS.has(el.tagName)) continue; // inline children are folded into parent
    if (el.closest('svg')) continue; // SVG descendants handled by the svgShapes collector
    if (hasBlendModeAncestor(el)) continue;

    // Children-by-type check
    let hasOwnText = false;
    let hasBlockChild = false;
    for (const c of el.childNodes) {
      if (c.nodeType === 3) {
        if (c.textContent && c.textContent.trim()) hasOwnText = true;
      } else if (c.nodeType === 1) {
        if (!isInlineEl(c)) hasBlockChild = true;
        else if (c.textContent && c.textContent.trim()) hasOwnText = true;
      }
    }
    // Only emit when element is a leaf-of-block: contains text (own or inline)
    // and no block-level children.
    if (!hasOwnText || hasBlockChild) continue;

    const cs = getComputedStyle(el);
    // Count direct text vs text-bearing inline children. When the block has
    // 2+ inline children that each carry their own text (e.g. flex/grid
    // layout with span on each side), emitting one merged leaf at the
    // block's full width concatenates the strings and PowerPoint then re-
    // wraps everything inside that single box — losing the original spatial
    // separation. Instead emit one leaf per inline child using its own rect.
    let directTextLen = 0;
    const textInlineChildren = [];
    for (const c of el.childNodes) {
      if (c.nodeType === 3 && c.textContent && c.textContent.trim()) {
        directTextLen += c.textContent.trim().length;
      } else if (c.nodeType === 1 && isInlineEl(c) && c.textContent && c.textContent.trim()) {
        textInlineChildren.push(c);
      }
    }

    // Per-text padding helper: chromium gives content-fit bounds. Widths
    // need to be padded differently per text class:
    //
    // Latin / monospace text (JetBrains Mono, Segoe UI): PowerPoint's
    // fallback (Cascadia for JetBrains Mono) renders WIDER than Chromium's
    // bundled font — pad width generously so big headings keep their
    // single-line layout.
    //
    // CJK-bearing text: PowerPoint falls back to Microsoft JhengHei via
    // theme, which renders NARROWER than Chromium's Noto Sans CJK fallback.
    // Over-padding the width pushes "Claude Code 上手" / "指南" wrap
    // together onto one line because the rect now accommodates both. Use
    // a minimal pad for CJK rects so PowerPoint's wrap behaviour matches
    // Chromium's.
    //
    // Height pad always applies (line-height differences are small and
    // a hair of extra vertical room never causes wrap regression).
    const padRect = (r, fs, content) => {
      // Range covers CJK Unified Ideographs (U+4E00–U+9FFF), CJK
      // symbols/punctuation/kana (U+3000–U+303F, U+3040–U+30FF) and
      // Bopomofo (U+3100–U+312F) via the [　-鿿] block, Hangul
      // syllables (U+AC00–U+D7A3) via [가-힣], and fullwidth
      // forms (U+FF00–U+FFEF) via [＀-￯]. In short: any CJK / Hangul /
      // fullwidth / JP kana character forces the EA-font width-pad path.
      const hasCJK = content && /[　-鿿가-힣＀-￯]/.test(content);
      // CJK text needs NEGATIVE pad: PowerPoint's JhengHei is narrower than
      // Chromium's Noto Sans CJK fallback, so the captured Chromium rect
      // already over-reserves width relative to what PowerPoint will draw.
      // Shrinking the rect by ~one-glyph-worth (≈fs * 0.5 per CJK character
      // difference, but bounded to fs * 0.3 of slack removal) pushes
      // PowerPoint to wrap closer to where Chromium did. Latin / mono text
      // still needs POSITIVE pad because PowerPoint's Cascadia / Segoe
      // fallback is wider than Chromium's bundled sans.
      r.w += hasCJK ? -Math.min(r.w * 0.05, fs * 0.3) : Math.max(24, fs * 0.35);
      r.h += Math.max(8, fs * 0.15);
      return r;
    };

    if (directTextLen === 0 && textInlineChildren.length >= 2) {
      for (const c of textInlineChildren) {
        const ccs = getComputedStyle(c);
        const crect = pickTextRect(c);
        if (crect.w <= 0 || crect.h <= 0) continue;
        const cfs = parsePx(ccs.fontSize);
        padRect(crect, cfs, trim(c.textContent));
        texts.push({
          rect: crect,
          text: trim(c.textContent),
          runs: collectRuns(c),
          fontSize: cfs,
          fontFamily: ccs.fontFamily,
          fontWeight: parseInt(ccs.fontWeight, 10) || 400,
          color: effectiveColor(ccs),
          background: ccs.backgroundColor && ccs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? colorRgbToHex(ccs.backgroundColor) : '',
          borderColor: ccs.borderTopWidth !== '0px' ? colorRgbToHex(ccs.borderTopColor) : '',
          borderRadius: parsePx(ccs.borderTopLeftRadius),
          textAlign: ccs.textAlign,
          padding: {
            t: parsePx(ccs.paddingTop),
            r: parsePx(ccs.paddingRight),
            b: parsePx(ccs.paddingBottom),
            l: parsePx(ccs.paddingLeft),
          },
          cssFeatureFlags: buildCssFeatureFlags(ccs),
          leafId: leafIdOf(c),
          groupId: c.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null,
        });
      }
      continue;
    }

    const rect = pickTextRect(el);
    if (rect.w <= 0 || rect.h <= 0) continue;
    // Effective font size: when the block has no direct text node and all text
    // lives in inline children (e.g. <div><span bar/><span fontSize:30>txt</span></div>),
    // the block's own computed fontSize is the inherited default — not the
    // size the user sees. Pick the largest inline-text-bearing child's fontSize.
    let effFontSize = parsePx(cs.fontSize);
    if (directTextLen === 0 && textInlineChildren.length > 0) {
      let bestFs = 0;
      for (const c of textInlineChildren) {
        const fs = parsePx(getComputedStyle(c).fontSize);
        if (fs > bestFs) bestFs = fs;
      }
      if (bestFs > 0) effFontSize = bestFs;
    }
    padRect(rect, effFontSize, trim(el.textContent));
    texts.push({
      rect,
      text: trim(el.textContent),
      runs: collectRuns(el),
      fontSize: effFontSize,
      fontFamily: cs.fontFamily,
      fontWeight: parseInt(cs.fontWeight, 10) || 400,
      color: effectiveColor(cs),
      background: cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? colorRgbToHex(cs.backgroundColor) : '',
      borderColor: cs.borderTopWidth !== '0px' ? colorRgbToHex(cs.borderTopColor) : '',
      borderRadius: parsePx(cs.borderTopLeftRadius),
      textAlign: cs.textAlign,
      padding: {
        t: parsePx(cs.paddingTop),
        r: parsePx(cs.paddingRight),
        b: parsePx(cs.paddingBottom),
        l: parsePx(cs.paddingLeft),
      },
      cssFeatureFlags: buildCssFeatureFlags(cs),
      leafId: leafIdOf(el),
      groupId: el.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null,
    });
  }

  // Decor boxes: elements with background/border that DO NOT have direct text.
  // Captures card chrome (the wrapper <div> around card content).
  // Border handling: when all 4 sides match, emit as one decor with that
  // border. When sides differ (e.g. only border-bottom for a table-row
  // separator), emit decor with no border + a synthetic line per non-zero
  // side — otherwise the row-separator hair-lines disappear entirely.
  const decors = [];
  const borderLines = [];
  for (const el of all) {
    if (el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'STYLE') continue;
    if (INLINE_TAGS.has(el.tagName)) continue;
    if (el.closest('svg')) continue;
    if (hasBlendModeAncestor(el)) continue;

    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? colorRgbToHex(cs.backgroundColor) : '';
    const bgImg = cs.backgroundImage || '';
    const hasGradient = bgImg && bgImg !== 'none' && (bgImg.includes('gradient(') || bgImg.includes('url('));
    const sides = {
      t: { w: parsePx(cs.borderTopWidth), c: cs.borderTopColor },
      r: { w: parsePx(cs.borderRightWidth), c: cs.borderRightColor },
      b: { w: parsePx(cs.borderBottomWidth), c: cs.borderBottomColor },
      l: { w: parsePx(cs.borderLeftWidth), c: cs.borderLeftColor },
    };
    const anyBorder = sides.t.w > 0 || sides.r.w > 0 || sides.b.w > 0 || sides.l.w > 0;
    if (!bg && !anyBorder && !hasGradient) continue;

    const rect = pickRect(el);
    if (rect.w <= 0 || rect.h <= 0) continue;
    const groupId = el.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null;

    const uniform = anyBorder
      && sides.t.w === sides.r.w && sides.t.w === sides.b.w && sides.t.w === sides.l.w
      && sides.t.c === sides.r.c && sides.t.c === sides.b.c && sides.t.c === sides.l.c;

    decors.push({
      rect,
      background: bg || '',
      backgroundImage: hasGradient ? bgImg : '',
      borderColor: uniform ? colorRgbToHex(sides.t.c) : '',
      borderWidth: uniform ? sides.t.w : 0,
      borderRadii: [
        parsePx(cs.borderTopLeftRadius),
        parsePx(cs.borderTopRightRadius),
        parsePx(cs.borderBottomRightRadius),
        parsePx(cs.borderBottomLeftRadius),
      ],
      boxShadow: (function () {
        const sh = cs.boxShadow;
        if (!sh || sh === 'none') return null;
        const colorMatch = sh.match(/rgba?\\([^)]+\\)/);
        const nums = sh.replace(/rgba?\\([^)]+\\)/, '').trim().split(/\\s+/).map(parsePx);
        return {
          offsetX: nums[0] ?? 0,
          offsetY: nums[1] ?? 0,
          blur: nums[2] ?? 0,
          color: colorMatch ? colorRgbToHex(colorMatch[0]) : '#000000',
        };
      })(),
      cssFeatureFlags: buildCssFeatureFlags(cs),
      leafId: leafIdOf(el),
      groupId,
    });

    if (anyBorder && !uniform) {
      // Emit each non-zero side as a synthetic line shape so non-uniform
      // borders survive (table row separators, single-side accents, etc).
      const pushLine = (x1, y1, x2, y2, w, c, side) => {
        borderLines.push({
          tag: 'line',
          rect: {
            x: Math.min(x1, x2), y: Math.min(y1, y2),
            w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
          },
          fill: '', stroke: colorRgbToHex(c), strokeWidth: w, dashed: false,
          rx: 0, x1, y1, x2, y2, points: '',
          markerEnd: '',
          text: '', fontSize: 0, fontFamily: '', textAnchor: 'start',
          hasUnsupportedPath: false, hasUse: false, hasPattern: false, hasMask: false,
          leafId: leafIdOf(el) + ':b' + side,
          groupId,
        });
      };
      if (sides.t.w > 0) pushLine(rect.x, rect.y, rect.x + rect.w, rect.y, sides.t.w, sides.t.c, 't');
      if (sides.r.w > 0) pushLine(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h, sides.r.w, sides.r.c, 'r');
      if (sides.b.w > 0) pushLine(rect.x, rect.y + rect.h, rect.x + rect.w, rect.y + rect.h, sides.b.w, sides.b.c, 'b');
      if (sides.l.w > 0) pushLine(rect.x, rect.y, rect.x, rect.y + rect.h, sides.l.w, sides.l.c, 'l');
    }
  }

  // Plan E: convert SVG user-space coordinates to screen-space using
  // getScreenCTM(). This handles viewBox transforms, parent <g transform>,
  // and CSS transforms on the SVG element — everything parsePathD missed.
  const toScreenPt = (el, x, y) => {
    const ctm = el.getScreenCTM();
    if (!ctm) return { x, y };
    const svg = el.ownerSVGElement || el;
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    const out = pt.matrixTransform(ctm);
    return { x: out.x, y: out.y };
  };

  const svgShapes = [];
  const SVG_TAGS = new Set(['rect','line','polyline','circle','ellipse','text','path']);
  const svgRootFlags = new WeakMap();
  for (const svg of document.querySelectorAll('svg')) {
    svgRootFlags.set(svg, {
      hasUnsupportedPath: false, // Plan E: getPointAtLength handles all path commands natively.
      hasUse:     !!svg.querySelector('use'),
      hasPattern: !!svg.querySelector('pattern'),
      hasMask:    !!svg.querySelector('mask'),
    });
  }
  for (const el of document.querySelectorAll('svg *')) {
    const tag = el.tagName.toLowerCase();
    if (!SVG_TAGS.has(tag)) continue;
    // <marker>/<defs> children are rendered indirectly via url(#id); their
    // own bbox is zero and would otherwise pollute the output.
    if (el.closest('marker, defs')) continue;
    if (hasBlendModeAncestor(el)) continue;
    const cs = getComputedStyle(el);
    if (tag === 'path') {
      const totalLen = el.getTotalLength ? el.getTotalLength() : 0;
      if (totalLen <= 0) continue;
      const dAttr = el.getAttribute('d') || '';
      const LINEAR_CMDS = new Set(['M', 'L', 'H', 'V', 'Z']);
      const stroke = cs.stroke && cs.stroke !== 'none' ? colorRgbToHex(cs.stroke) : '';
      const fill = cs.fill && cs.fill !== 'none' ? colorRgbToHex(cs.fill) : '';
      const sw = parsePx(cs.strokeWidth);
      const dashed = !!cs.strokeDasharray && cs.strokeDasharray !== 'none';
      const me = el.getAttribute('marker-end') || '';
      const gid = el.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null;
      const rootFlags = svgRootFlags.get(el.closest('svg')) || { hasUnsupportedPath: false, hasUse: false, hasPattern: false, hasMask: false };

      // Split into subpaths at each move command (M/m) and sample each
      // independently, so a pen-lift between subpaths (e.g. the two strokes of
      // an "X" or a "+") does NOT draw a spurious connecting segment. Splitting
      // on the command LETTER is structural (CLAUDE.md classification-vs-
      // geometry) — coordinates still come from the browser via getPointAtLength
      // below, never parsed out of \`d\`.
      const subStrs = dAttr.match(/[Mm][^Mm]*/g) || [dAttr];
      // Sample each subpath from its OWN throwaway clone (a single subpath, so
      // no internal pen-lift). Sampling the original across cumulative lengths
      // is unreliable: some engines count the moveto in getTotalLength, which
      // re-introduces the connecting segment between subpaths. The clone is
      // appended next to el so it shares el's CTM (viewBox + ancestor
      // transforms), keeping getScreenCTM-based screen coordinates correct.
      for (let si = 0; si < subStrs.length; si++) {
        const sub = subStrs[si];
        const tmp = el.cloneNode(false);
        tmp.removeAttribute('id');
        tmp.setAttribute('d', sub);
        el.parentNode.appendChild(tmp);
        try {
          const segLen = tmp.getTotalLength ? tmp.getTotalLength() : 0;
          if (segLen <= 0) continue; // lone moveto / zero-length subpath draws nothing
          const subLetters = (sub.match(/[a-zA-Z]/g) || []).map((c) => c.toUpperCase());
          const subLinear = subLetters.length > 0 && subLetters.every((c) => LINEAR_CMDS.has(c));
          const subClosed = /[zZ]\\s*$/.test(sub.trim());
          const N = Math.max(16, Math.min(256, Math.ceil(segLen / 8)));
          const pts = [];
          for (let k = 0; k <= N; k++) {
            const up = tmp.getPointAtLength((k * segLen) / N);
            pts.push(toScreenPt(tmp, up.x, up.y));
          }
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          const bx = Math.min(...xs), by = Math.min(...ys);
          const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
          // marker-end belongs only to the path's final subpath end.
          const subMe = si === subStrs.length - 1 ? me : '';
          const base = {
            rect: { x: bx, y: by, w: bw, h: bh },
            fill: fill, stroke: stroke, strokeWidth: sw, dashed: dashed,
            rx: 0,
            x1: 0, y1: 0, x2: 0, y2: 0,
            points: pts.map((p) => p.x + ',' + p.y).join(' '),
            markerEnd: subMe,
            text: '', fontSize: 0, fontFamily: '', textAnchor: 'start',
            ...rootFlags,
            leafId: leafIdOf(el),
            groupId: gid,
          };
          // A straight-only subpath with NO fill collapses to a line/rect
          // downstream (cheap native path). Anything curved OR filled goes
          // through the custGeom emitter, which honours fill + closure —
          // without this a filled diamond/triangle would emit as stroke-only
          // segments and vanish (it has no stroke of its own).
          if (subLinear && !fill) {
            svgShapes.push({ tag: 'polyline', ...base });
          } else {
            svgShapes.push({ tag: 'curvePath', closed: subClosed, ...base });
          }
        } finally {
          el.parentNode.removeChild(tmp);
        }
      }
      continue;
    }
    const rect = pickRect(el);
    if (rect.w <= 0 && tag !== 'line') continue;
    if (rect.h <= 0 && tag !== 'line') continue;
    const x1 = parseFloat(el.getAttribute('x1') || '0');
    const y1 = parseFloat(el.getAttribute('y1') || '0');
    const x2 = parseFloat(el.getAttribute('x2') || '0');
    const y2 = parseFloat(el.getAttribute('y2') || '0');
    // Site 2: transform <line> endpoints via getScreenCTM instead of
    // adding raw svgRect.left/top (which ignores viewBox transforms).
    let lineEndpoints = null;
    if (tag === 'line') {
      const a = toScreenPt(el, x1, y1);
      const b = toScreenPt(el, x2, y2);
      lineEndpoints = { sx1: a.x, sy1: a.y, sx2: b.x, sy2: b.y };
    }
    // Site 3: transform <polyline> points via getScreenCTM so that
    // user-space coordinates with viewBox offsets are correct.
    let screenPoints = '';
    if (tag === 'polyline') {
      const raw = el.getAttribute('points') || '';
      const nums = raw.trim().split(/[\\s,]+/).map(parseFloat).filter((v) => !isNaN(v));
      const out = [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const p = toScreenPt(el, nums[i], nums[i + 1]);
        out.push(p.x + ',' + p.y);
      }
      screenPoints = out.join(' ');
    }
    svgShapes.push({
      tag,
      rect,
      fill: cs.fill && cs.fill !== 'none' ? colorRgbToHex(cs.fill) : '',
      stroke: cs.stroke && cs.stroke !== 'none' ? colorRgbToHex(cs.stroke) : '',
      strokeWidth: parsePx(cs.strokeWidth),
      dashed: !!cs.strokeDasharray && cs.strokeDasharray !== 'none',
      rx: parseFloat(el.getAttribute('rx') || '0'),
      x1: lineEndpoints?.sx1 ?? x1,
      y1: lineEndpoints?.sy1 ?? y1,
      x2: lineEndpoints?.sx2 ?? x2,
      y2: lineEndpoints?.sy2 ?? y2,
      points: tag === 'polyline' ? screenPoints : (el.getAttribute('points') || ''),
      markerEnd: el.getAttribute('marker-end') || '',
      text: tag === 'text' ? (el.textContent || '').trim() : '',
      fontSize: parsePx(cs.fontSize),
      fontFamily: cs.fontFamily || '',
      textAnchor: el.getAttribute('text-anchor') || 'start',
      ...(svgRootFlags.get(el.closest('svg')) || { hasUnsupportedPath: false, hasUse: false, hasPattern: false, hasMask: false }),
      leafId: leafIdOf(el),
      groupId: el.closest('[data-prim-id]')?.getAttribute('data-prim-id') || null,
    });
  }

  // Border-edge lines from HTML decor extraction join the SVG shape stream
  // so they go through the same downstream "shape" handling.
  for (const bl of borderLines) svgShapes.push(bl);

  return { primitives, texts, images, decors, svgShapes };
})()`;

export type MeasureOptions = {
  // When set, the function writes a 1920×1080 PNG per page next to the
  // pptx output. Reuses the Playwright page already loaded for measurement.
  snapshotDir?: string;
  // Per-page progress hook. Called after each page finishes measuring +
  // (optional) snapshot. `current` is 1-indexed; `total` is the page count.
  onPage?: (current: number, total: number) => void;
};

export async function measureSlide(
  pages: PageHtml[],
  opts: MeasureOptions = {},
): Promise<PageMeasure[]> {
  // Lazy-load the optional peer. A missing package throws ERR_MODULE_NOT_FOUND
  // here rather than at import time, which keeps the rest of @open-slide/core
  // working when Playwright is not installed.
  let chromium: typeof import('playwright').chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (e: any) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || e?.code === 'MODULE_NOT_FOUND') {
      throw new PlaywrightUnavailableError(
        'Playwright is not installed. Run: npm install -D playwright && npx playwright install chromium',
        e,
      );
    }
    throw e;
  }

  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("Executable doesn't exist") || msg.includes('browserType.launch')) {
      throw new PlaywrightUnavailableError(
        'Playwright Chromium is not installed. Run: npx playwright install chromium',
        e,
      );
    }
    throw e;
  }
  const out: PageMeasure[] = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    for (const p of pages) {
      const propsById = new Map<string, PrimRecord>();
      for (const r of p.primitives) propsById.set(r.id, r);
      await page.setContent(p.html, { waitUntil: 'load' });
      // give web fonts a beat to settle (we set deterministic fonts via the
      // design tokens, but Chromium occasionally measures pre-swap)
      await page.evaluate(() => (document as any).fonts?.ready);
      // Skip CSS animations to end state before measuring. Decks commonly
      // use entrance animations (opacity 0 → 1, width 0 → 100%) whose
      // starting state has zero width or invisible content — measuring
      // mid-animation produces empty rects or omits text entirely.
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            animation-fill-mode: forwards !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });
      // One extra rAF tick so layout reflects the post-animation state.
      await page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );
      const raw = await page.evaluate(EXTRACT_SCRIPT);
      const r = raw as {
        primitives: any[];
        texts: TextLeaf[];
        images: ImageLeaf[];
        decors: DecorBox[];
        svgShapes: SvgShape[];
      };
      // Element-screenshot pass: any leaf that the classifier promotes to
      // ImageFallback needs a pixel rendering to embed in the pptx.
      // Primitives whose root element has a non-native background (gradient
      // or url()) are also captured here so measureToIR can substitute the
      // entire group with an Image leaf.
      const { classifyLeaf } = await import('./classifier.js');
      const leavesToFallback: Array<{
        kind: 'text' | 'decor' | 'svg';
        leafId: string;
        index: number;
      }> = [];
      const primsToFallback: Array<{ primId: string; index: number }> = [];
      r.primitives.forEach((p: any, i: number) => {
        if (p.needsFallback) primsToFallback.push({ primId: p.id, index: i });
      });
      // A leaf qualifies for fallback when EITHER the classifier promotes
      // it (unsupported CSS feature, SVG pattern/mask, etc.) OR its
      // bounding rect extends past the slide canvas — the latter must
      // raster the visible portion because clipping a native shape's
      // rect would re-flow text and chop roundRect corners flat, while
      // the screenshot captures the intended visual exactly. Both paths
      // converge in the leaf-fallback loop below which clips both the
      // PNG and the emitted IR rect to the canvas intersection.
      r.texts.forEach((t, i) => {
        const c = classifyLeaf({
          type: 'text',
          text: t.text,
          rect: t.rect,
          color: t.color,
          fontSize: t.fontSize,
          fontFamily: t.fontFamily,
          cssFeatureFlags: t.cssFeatureFlags,
        });
        if (c.kind === 'ImageFallback' || overflowsCanvas(t.rect)) {
          leavesToFallback.push({ kind: 'text', leafId: t.leafId, index: i });
        }
      });
      r.decors.forEach((d, i) => {
        const c = classifyLeaf({
          type: 'decor',
          rect: d.rect,
          background: d.background,
          backgroundImage: d.backgroundImage,
          borderWidth: d.borderWidth,
          cssFeatureFlags: d.cssFeatureFlags,
        });
        if (c.kind === 'ImageFallback' || overflowsCanvas(d.rect)) {
          leavesToFallback.push({ kind: 'decor', leafId: d.leafId, index: i });
        }
      });
      r.svgShapes.forEach((s, i) => {
        const c = classifyLeaf({
          type: 'svg',
          rect: s.rect,
          hasUnsupportedPath: s.hasUnsupportedPath,
          hasUse: s.hasUse,
          hasPattern: s.hasPattern,
          hasMask: s.hasMask,
        });
        if (c.kind === 'ImageFallback' || overflowsCanvas(s.rect)) {
          leavesToFallback.push({ kind: 'svg', leafId: s.leafId, index: i });
        }
      });

      // De-dupe by leafId so when an SVG produces multiple shapes we only
      // screenshot the host element once and attach the PNG to all of them.
      // For each leaf-to-fallback we MUST:
      //   1. Compute the leaf element's current bounding rect via DOM (the
      //      authoritative paint bbox post-animation-freeze).
      //   2. Intersect with the slide canvas — like the primitive-level
      //      fallback path, an element whose rect extends past
      //      [0,0,1920,1080] must be clipped so the emitted pptx shape
      //      stays inside the slide bounds.
      //   3. Hide every sibling subtree (non-ancestor, non-descendant)
      //      BEFORE the screenshot — without this, a full-bleed SVG/decor
      //      (e.g. a <svg width="100%" height="100%"> background-grid)
      //      will bake every overlapping text element into its PNG. The
      //      same Plan K K-1 isolation that fixed primimg double-painting
      //      applies to leaf-level fallbacks: the screenshot must capture
      //      ONLY the target element's own pixels + its DOM descendants.
      //   4. Take the screenshot with page.screenshot({clip}) using the
      //      clipped rect (locator.screenshot does not accept absolute
      //      viewport clip coords, so we go through the page API).
      //   5. Restore sibling visibility before moving to the next leaf.
      const seenLeafResults = new Map<string, { rect: Rect; url: string }>();
      for (const f of leavesToFallback) {
        if (seenLeafResults.has(f.leafId)) continue;
        const leafBbox = (await page.evaluate((id) => {
          const sel = `[data-leaf-id="${id.replace(/"/g, '\\"')}"]`;
          const el = document.querySelector(sel);
          if (!el) return null;
          const rr = (el as Element).getBoundingClientRect();
          return { x: rr.left, y: rr.top, w: rr.width, h: rr.height };
        }, f.leafId)) as Rect | null;
        if (!leafBbox) continue;
        const clipped = intersectSlide(leafBbox);
        if (clipped.w <= 0 || clipped.h <= 0) continue;
        await page.evaluate((id) => {
          const sel = `[data-leaf-id="${id.replace(/"/g, '\\"')}"]`;
          const target = document.querySelector(sel);
          if (!target) return;
          const all = document.body.querySelectorAll('*');
          const hidden: HTMLElement[] = [];
          for (const p of Array.from(all)) {
            if (p === target) continue;
            if (target.contains(p)) continue; // descendant — keep
            if (p.contains(target)) continue; // ancestor — keep
            const el = p as HTMLElement;
            el.setAttribute('data-leaf-orig-vis', el.style.visibility);
            el.style.visibility = 'hidden';
            hidden.push(el);
          }
          (window as any).__leafIsolated = hidden;
        }, f.leafId);
        try {
          try {
            const buf = await page.screenshot({
              omitBackground: true,
              type: 'png',
              clip: { x: clipped.x, y: clipped.y, width: clipped.w, height: clipped.h },
            });
            seenLeafResults.set(f.leafId, {
              rect: clipped,
              url: `data:image/png;base64,${buf.toString('base64')}`,
            });
          } catch {
            // Element not located / screenshot failed. Skip; the leaf will
            // keep its classification but no fallback image, and pptx-build
            // will fall through to the native emission path.
          }
        } finally {
          await page.evaluate(() => {
            const hidden = ((window as any).__leafIsolated || []) as HTMLElement[];
            for (const el of hidden) {
              el.style.visibility = el.getAttribute('data-leaf-orig-vis') || '';
              el.removeAttribute('data-leaf-orig-vis');
            }
            delete (window as any).__leafIsolated;
          });
        }
      }
      // Attach the captured PNG + clipped leaf-bbox to every leaf entry
      // sharing that leafId. Updating the rect (not just the URL) is what
      // keeps the pptx-build emit rect in sync with the PNG content — a
      // 1920×1080 PNG at a 600×400 rect would otherwise stretch.
      for (const f of leavesToFallback) {
        const result = seenLeafResults.get(f.leafId);
        if (!result) continue;
        if (f.kind === 'text') {
          r.texts[f.index].fallbackImageDataUrl = result.url;
          r.texts[f.index].rect = result.rect;
        } else if (f.kind === 'decor') {
          r.decors[f.index].fallbackImageDataUrl = result.url;
          r.decors[f.index].rect = result.rect;
        } else if (f.kind === 'svg') {
          r.svgShapes[f.index].fallbackImageDataUrl = result.url;
          r.svgShapes[f.index].rect = result.rect;
        }
      }

      // Primitive-level fallback screenshots — one PNG per primitive whose
      // root element has a non-native background (CSS gradient / url image).
      // Hide every non-descendant, non-ancestor DOM element before each
      // screenshot so the PNG contains ONLY the target primitive's own
      // pixels + its DOM descendants. Without this, Playwright's
      // locator.screenshot clips to the target's bbox but Chromium has
      // already composited any sibling element whose paint area overlapped
      // — those pixels get baked into the PNG and PowerPoint then
      // double-paints them (Plan H1's bug, first visible on getting-started
      // where a full-slide gradient bg overlaps every other primitive).
      // Plan K's K-1 isolation.
      //
      // Why we hide all sibling-subtree elements (not just other primitives):
      // a deck may render visible HTML (<h1>, <p>, ...) directly in the
      // page body without wrapping each one in a primitive. Those raw
      // elements would still be baked into the PNG. The "ancestors stay
      // visible" rule preserves the target's layout context (body padding,
      // wrapper transforms, etc.) — only sibling subtrees that paint
      // unrelated pixels get hidden.
      //
      // omitBackground:true keeps the slide's body background transparent
      // but does nothing about sibling content (real opaque DOM elements).
      // visibility:hidden is preferred over display:none because it does
      // not collapse the box and therefore does not perturb any other
      // element's getBoundingClientRect mid-pass.
      for (const pf of primsToFallback) {
        const primEntry: any = r.primitives[pf.index];
        const primId = primEntry.id;
        // Clip the primitive's bounding rect to the slide canvas
        // [0,0,1920,1080] before screenshotting. Decks commonly place
        // decorative gradient orbs / full-bleed backgrounds well past
        // the canvas edge, relying on the canvas's overflow:hidden to
        // clip them visually. pptx has no ancestor-clip equivalent, so
        // an un-clipped primimg would spill into the presenter view.
        // Clipping here both crops the captured PNG to the visible
        // region and aligns the IR rect with what the browser actually
        // paints inside the canvas.
        const clipped = intersectSlide(primEntry.rect);
        if (clipped.w <= 0 || clipped.h <= 0) {
          // Wholly off-canvas: nothing to capture. Emit a 1×1
          // transparent PNG at the clipped edge so the primitive still
          // enters measureToIR's fallbackPrimIds set (descendant leaves
          // then get cascade-suppressed). w/h are forced to ≥1 because
          // pptx emit paths assume non-degenerate dimensions.
          primEntry.rect = { x: clipped.x, y: clipped.y, w: 1, h: 1 };
          primEntry.fallbackImageDataUrl = TRANSPARENT_PNG_1X1;
          continue;
        }
        primEntry.rect = clipped;
        await page.evaluate((id) => {
          const target = document.querySelector(`[data-prim-id="${id}"]`);
          if (!target) return;
          const all = document.body.querySelectorAll('*');
          const hidden: HTMLElement[] = [];
          for (const p of Array.from(all)) {
            if (p === target) continue;
            if (target.contains(p)) continue; // descendant — keep
            if (p.contains(target)) continue; // ancestor — keep
            const el = p as HTMLElement;
            el.setAttribute('data-prim-orig-vis', el.style.visibility);
            el.style.visibility = 'hidden';
            hidden.push(el);
          }
          (window as any).__primIsolated = hidden;
        }, primId);
        try {
          try {
            // page.screenshot with explicit clip captures only the
            // canvas-visible portion of the primitive. The hide-siblings
            // isolation above ensures no other element paints inside
            // that clip rect.
            const buf = await page.screenshot({
              omitBackground: true,
              type: 'png',
              clip: { x: clipped.x, y: clipped.y, width: clipped.w, height: clipped.h },
            });
            primEntry.fallbackImageDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
          } catch {
            // Same fallthrough as leaves: keep the primitive as a normal group
            // so children still emit natively. Less correct visually but
            // preserves editability.
          }
        } finally {
          await page.evaluate(() => {
            const hidden = ((window as any).__primIsolated || []) as HTMLElement[];
            for (const el of hidden) {
              el.style.visibility = el.getAttribute('data-prim-orig-vis') || '';
              el.removeAttribute('data-prim-orig-vis');
            }
            delete (window as any).__primIsolated;
          });
        }
      }

      // Build the PrimMeasure array AFTER the primitive-level screenshot
      // pass so fallbackImageDataUrl propagates through to measureToIR.
      const primitives = r.primitives.map((entry: any) => {
        const rec = propsById.get(entry.id);
        return {
          id: entry.id,
          name: entry.name,
          rect: entry.rect,
          svgOffset: entry.svgOffset,
          props: rec?.props ?? {},
          parentId: entry.parentId,
          fallbackImageDataUrl: entry.fallbackImageDataUrl,
        } as PrimMeasure;
      });

      out.push({
        pageIndex: p.pageIndex,
        pageName: p.pageName,
        primitives,
        texts: r.texts,
        images: r.images,
        decors: r.decors,
        svgShapes: r.svgShapes,
      });
      if (opts.snapshotDir) {
        await mkdir(opts.snapshotDir, { recursive: true });
        const idx = p.pageIndex.toString().padStart(2, '0');
        const safe =
          (p.pageName || `page-${p.pageIndex}`)
            .replace(/[^\w.-]+/g, '_')
            .replace(/^\.+/, '_')
            .slice(0, 120) || '_';
        const outPath = path.join(opts.snapshotDir, `${idx}-${safe}.png`);
        await page.screenshot({
          path: outPath,
          fullPage: false,
          clip: { x: 0, y: 0, width: 1920, height: 1080 },
        });
      }
      opts.onPage?.(out.length, pages.length);
    }
  } finally {
    await browser.close();
  }
  return out;
}
