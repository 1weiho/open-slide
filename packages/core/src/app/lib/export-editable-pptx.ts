import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { isSafari } from './export-pdf';
import type { PptxExportProgress } from './export-pptx';
import { SlidePageProvider } from './page-context';
import { classifyNode, type NodeView } from './pptx/classify';
import { buildGradFillXml, parseGradient, patchSlideXmlGradients } from './pptx/gradient';
import {
  alphaToTransparency,
  isBold,
  lineSpacingMultiple,
  mapTextAlign,
  parseBoxShadow,
  parseCssColor,
  pxToIn,
  pxToPt,
  rotationDeg,
} from './pptx/units';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from './print-ready';
import type { SlideModule } from './sdk';

const ROOT_ID = 'os-editable-pptx-root';
const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;
const MAX_RASTER_EDGE_PX = 1600;

const INLINE_PHRASING = new Set([
  'a',
  'abbr',
  'b',
  'big',
  'br',
  'cite',
  'code',
  'del',
  'em',
  'i',
  'ins',
  'kbd',
  'label',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'tt',
  'u',
  'var',
  'wbr',
]);

type Box = { x: number; y: number; w: number; h: number; rotate: number };

type EmitContext = {
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS slide type is loaded dynamically.
  pptxSlide: any;
  frameRect: DOMRect;
  imageCache: Map<string, string>;
  gradients: Map<string, string>;
  seq: { n: number };
};

export async function exportSlideAsPptx(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PptxExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const total = pages.length;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(root);

  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const designVars = slide.design ? designToCssVars(slide.design) : null;
  const reactRoots: Root[] = [];
  const frames: HTMLElement[] = [];

  for (let i = 0; i < pages.length; i++) {
    const Page = pages[i];
    if (!Page) continue;
    const host = document.createElement('div');
    host.setAttribute('data-osd-canvas', '');
    Object.assign(host.style, {
      width: '1920px',
      height: '1080px',
      position: 'relative',
      overflow: 'hidden',
      background: '#fff',
    });
    if (designVars) {
      for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
    }
    root.appendChild(host);
    frames.push(host);
    const r = createRoot(host);
    r.render(
      createElement(SlidePageProvider, { index: i, total: pages.length }, createElement(Page)),
    );
    reactRoots.push(r);
  }

  await nextPaint();

  try {
    await waitForFonts();

    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      const settled = frames.reduce((n, f) => (isFrameAnimationSettled(f) ? n + 1 : n), 0);
      onProgress?.({
        phase: 'processing',
        current: settled,
        total,
        percent: Math.min(90, (settled / frames.length) * 90),
      });
      if (settled === frames.length) break;
      await sleep(POLL_INTERVAL_MS);
    }
    await waitForDataWaitfor(root);
    await sleep(100);

    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'OSD', width: 20, height: 11.25 });
    pptx.layout = 'OSD';

    const imageCache = new Map<string, string>();
    const gradients = new Map<string, string>();
    const seq = { n: 0 };
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const pptxSlide = pptx.addSlide();
      const frameRect = frame.getBoundingClientRect();
      const ctx: EmitContext = { pptxSlide, frameRect, imageCache, gradients, seq };
      for (const child of Array.from(frame.children)) {
        await walk(child as HTMLElement, ctx);
      }
      onProgress?.({
        phase: 'processing',
        current: total,
        total,
        percent: 90 + ((i + 1) / frames.length) * 9,
      });
    }

    onProgress?.({ phase: 'generating', current: total, total, percent: 98 });
    const raw = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
    const blob = await applyGradients(new Uint8Array(raw), gradients);
    downloadBlob(blob, `${slideId}.pptx`);
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    for (const r of reactRoots) r.unmount();
    root.remove();
  }
}

async function walk(el: HTMLElement, ctx: EmitContext): Promise<void> {
  const cs = getComputedStyle(el);
  const node = toNodeView(el, cs);
  const { kind, recurse } = classifyNode(node);

  switch (kind) {
    case 'skip':
      return;
    case 'text':
      emitText(el, cs, ctx);
      return;
    case 'image':
      await emitImage(el as HTMLImageElement, ctx);
      return;
    case 'table':
      emitTable(el as HTMLTableElement, cs, ctx);
      return;
    case 'raster':
      await emitRaster(el, ctx);
      return;
    case 'shape':
      emitShape(el, cs, ctx);
      break;
    case 'container':
      break;
  }

  if (recurse) {
    for (const child of Array.from(el.children)) {
      await walk(child as HTMLElement, ctx);
    }
  }
}

function toNodeView(el: HTMLElement, cs: CSSStyleDeclaration): NodeView {
  return {
    tag: el.tagName.toLowerCase(),
    isSvg: el.namespaceURI === 'http://www.w3.org/2000/svg',
    hasTextContent: (el.textContent ?? '').trim().length > 0,
    childElementTags: Array.from(el.children).map((c) => c.tagName.toLowerCase()),
    style: {
      display: cs.display,
      visibility: cs.visibility,
      filter: cs.filter,
      backdropFilter:
        cs.backdropFilter ||
        (cs as unknown as Record<string, string>).webkitBackdropFilter ||
        'none',
      mixBlendMode: cs.mixBlendMode,
      clipPath: cs.clipPath,
      transform: cs.transform,
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage,
      borderStyle: cs.borderTopStyle,
      borderTopWidth: cs.borderTopWidth,
    },
  };
}

function measureBox(el: HTMLElement, cs: CSSStyleDeclaration, frameRect: DOMRect): Box {
  const rotate = rotationDeg(cs.transform);
  let rect: DOMRect;
  if (rotate !== 0) {
    const prev = el.style.transform;
    el.style.transform = 'none';
    rect = el.getBoundingClientRect();
    el.style.transform = prev;
  } else {
    rect = el.getBoundingClientRect();
  }
  return {
    x: pxToIn(rect.left - frameRect.left),
    y: pxToIn(rect.top - frameRect.top),
    w: pxToIn(rect.width),
    h: pxToIn(rect.height),
    rotate,
  };
}

function box(b: Box) {
  const out: Record<string, number> = { x: b.x, y: b.y, w: b.w, h: b.h };
  if (b.rotate !== 0) out.rotate = b.rotate;
  return out;
}

// biome-ignore lint/suspicious/noExplicitAny: PptxGenJS run/option types are loaded dynamically.
type Run = { text: string; options: Record<string, any> };

function emitText(el: HTMLElement, cs: CSSStyleDeclaration, ctx: EmitContext): void {
  const runs = buildRuns(el);
  if (runs.length === 0) return;
  const b = measureBox(el, cs, ctx.frameRect);
  const lh = lineSpacingMultiple(parseFloat(cs.lineHeight), parseFloat(cs.fontSize));
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS option bag.
  const opts: Record<string, any> = {
    ...box(b),
    margin: 0,
    fit: 'none',
    valign: 'top',
    align: mapTextAlign(cs.textAlign),
  };
  if (lh && Number.isFinite(lh)) opts.lineSpacingMultiple = Math.min(9.99, Math.max(0.1, lh));
  const paint = paintFromStyle(cs);
  if (paint.fill) opts.fill = paint.fill;
  if (paint.line) opts.line = paint.line;
  ctx.pptxSlide.addText(runs, opts);
}

function buildRuns(el: HTMLElement): Run[] {
  const runs: Run[] = [];
  const visit = (n: Node, styleSource: HTMLElement, href: string | undefined) => {
    for (const child of Array.from(n.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child.textContent ?? '').replace(/\s+/g, ' ');
        if (text.trim().length === 0 && text !== ' ') continue;
        const options = runOptions(styleSource);
        if (href) options.hyperlink = { url: href };
        runs.push({ text, options });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const ce = child as HTMLElement;
        const tag = ce.tagName.toLowerCase();
        if (tag === 'br') {
          if (runs.length > 0) runs[runs.length - 1].options.breakLine = true;
          else runs.push({ text: '', options: { breakLine: true } });
          continue;
        }
        if (INLINE_PHRASING.has(tag)) {
          visit(ce, ce, tag === 'a' ? (linkHref(ce) ?? href) : href);
        }
      }
    }
  };
  visit(el, el, linkHref(el));
  return runs;
}

// Only real navigable links become PPTX hyperlinks; in-page anchors are dropped.
function linkHref(el: HTMLElement): string | undefined {
  if (el.tagName.toLowerCase() !== 'a') return undefined;
  const href = el.getAttribute('href')?.trim();
  if (!href) return undefined;
  return /^(https?:|mailto:)/i.test(href) ? href : undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: PptxGenJS run options.
function runOptions(el: HTMLElement): Record<string, any> {
  const cs = getComputedStyle(el);
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS run options.
  const opts: Record<string, any> = {
    fontFace: substituteFont(cs.fontFamily),
    fontSize: round(pxToPt(parseFloat(cs.fontSize)), 1),
    bold: isBold(cs.fontWeight),
  };
  if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') opts.italic = true;
  const color = parseCssColor(cs.color);
  if (color) {
    opts.color = color.hex;
    if (color.alpha < 1) opts.transparency = alphaToTransparency(color.alpha);
  }
  if (cs.textDecorationLine.includes('underline')) opts.underline = { style: 'sng' };
  if (cs.textDecorationLine.includes('line-through')) opts.strike = 'sngStrike';
  if (cs.letterSpacing && cs.letterSpacing !== 'normal') {
    const ls = parseFloat(cs.letterSpacing);
    if (Number.isFinite(ls) && ls !== 0) opts.charSpacing = round(pxToPt(ls), 1);
  }
  return opts;
}

function emitShape(el: HTMLElement, cs: CSSStyleDeclaration, ctx: EmitContext): void {
  const b = measureBox(el, cs, ctx.frameRect);
  if (b.w <= 0 || b.h <= 0) return;
  const radius = parseFloat(cs.borderTopLeftRadius);
  const shapeType = Number.isFinite(radius) && radius > 0 ? 'roundRect' : 'rect';
  const paint = paintFromStyle(cs);
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS shape options.
  const opts: Record<string, any> = { ...box(b), fill: paint.fill ?? { type: 'none' } };
  if (paint.line) opts.line = paint.line;
  const shadow = shadowFromStyle(cs);
  if (shadow) opts.shadow = shadow;

  // Gradient backgrounds: PptxGenJS can't emit a:gradFill, so set a solid
  // placeholder (also the safe fallback) and register the real gradient to be
  // patched into the XML after packaging. linear + radial map to native OOXML
  // fills; conic has no OOXML equivalent, so it keeps the solid first-stop fallback.
  const grad = parseGradient(cs.backgroundImage);
  if (grad && grad.stops.length > 0) {
    opts.fill = { color: grad.stops[0].hex };
    if (grad.kind === 'linear' || grad.kind === 'radial') {
      const name = `osd-grad-${ctx.seq.n++}`;
      opts.objectName = name;
      ctx.gradients.set(name, buildGradFillXml(grad));
    }
  }

  ctx.pptxSlide.addShape(shapeType, opts);
}

async function applyGradients(bytes: Uint8Array, gradients: Map<string, string>): Promise<Blob> {
  const type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (gradients.size === 0) return new Blob([bytes as BlobPart], { type });
  const { unzipSync, zipSync, strToU8, strFromU8 } = await import('fflate');
  const files = unzipSync(bytes);
  for (const path of Object.keys(files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(path)) continue;
    const patched = patchSlideXmlGradients(strFromU8(files[path]), gradients);
    files[path] = strToU8(patched);
  }
  return new Blob([zipSync(files) as BlobPart], { type });
}

function paintFromStyle(cs: CSSStyleDeclaration): {
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS fill option bag.
  fill?: Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS line option bag.
  line?: Record<string, any>;
} {
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS option bags.
  const out: { fill?: Record<string, any>; line?: Record<string, any> } = {};
  const bg = parseCssColor(cs.backgroundColor);
  if (bg && bg.alpha > 0) {
    out.fill = { color: bg.hex };
    if (bg.alpha < 1) out.fill.transparency = alphaToTransparency(bg.alpha);
  }
  const borderColor = parseCssColor(cs.borderTopColor);
  const borderWidth = parseFloat(cs.borderTopWidth);
  if (cs.borderTopStyle !== 'none' && borderWidth > 0 && borderColor) {
    out.line = {
      color: borderColor.hex,
      width: round(pxToPt(borderWidth), 2),
      dashType:
        cs.borderTopStyle === 'dashed'
          ? 'dash'
          : cs.borderTopStyle === 'dotted'
            ? 'sysDot'
            : 'solid',
    };
  }
  return out;
}

async function emitImage(el: HTMLImageElement, ctx: EmitContext): Promise<void> {
  const src = el.currentSrc || el.src;
  if (!src) return;
  const cs = getComputedStyle(el);
  const b = measureBox(el, cs, ctx.frameRect);
  if (b.w <= 0 || b.h <= 0) return;
  const data = await toDataUri(src, ctx.imageCache);
  if (!data) return;
  // biome-ignore lint/suspicious/noExplicitAny: PptxGenJS image options.
  const opts: Record<string, any> = { ...box(b), data };
  if (cs.objectFit === 'cover' || cs.objectFit === 'contain') {
    opts.sizing = { type: cs.objectFit, w: b.w, h: b.h };
  }
  const shadow = shadowFromStyle(cs);
  if (shadow) opts.shadow = shadow;
  ctx.pptxSlide.addImage(opts);
}

// Maps a CSS box-shadow to a PptxGenJS outer shadow (offset/angle in pt/deg).
// biome-ignore lint/suspicious/noExplicitAny: PptxGenJS shadow option bag.
function shadowFromStyle(cs: CSSStyleDeclaration): Record<string, any> | undefined {
  const s = parseBoxShadow(cs.boxShadow);
  if (!s) return undefined;
  const offset = round(pxToPt(Math.hypot(s.offX, s.offY)), 1);
  const blur = round(pxToPt(s.blur), 1);
  if (offset === 0 && blur === 0) return undefined;
  const angle = Math.round(((((Math.atan2(s.offY, s.offX) * 180) / Math.PI) % 360) + 360) % 360);
  return {
    type: 'outer',
    color: s.hex,
    opacity: Math.round(s.alpha * 100) / 100,
    blur,
    offset,
    angle,
  };
}

function emitTable(el: HTMLTableElement, _cs: CSSStyleDeclaration, ctx: EmitContext): void {
  const b = measureBox(el, getComputedStyle(el), ctx.frameRect);
  const rows: { text: string }[][] = [];
  for (const tr of Array.from(el.rows)) {
    const cells: { text: string }[] = [];
    for (const cell of Array.from(tr.cells)) {
      cells.push({ text: (cell.textContent ?? '').trim() });
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return;
  ctx.pptxSlide.addTable(rows, { ...box(b) });
}

async function emitRaster(el: HTMLElement, ctx: EmitContext): Promise<void> {
  if (isSafari()) return;
  const cs = getComputedStyle(el);
  const b = measureBox(el, cs, ctx.frameRect);
  if (b.w <= 0 || b.h <= 0) return;
  // Cap the bitmap's longest edge so a full-bleed decorative subtree (e.g. a
  // 1920px noise overlay) can't balloon the deck into hundreds of MB.
  const longestPx = Math.max(b.w, b.h) * 96;
  const pixelRatio = Math.min(2, Math.max(0.5, MAX_RASTER_EDGE_PX / longestPx));
  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(el, { pixelRatio, cacheBust: true });
    ctx.pptxSlide.addImage({ ...box(b), data: dataUrl });
  } catch (err) {
    console.warn('[open-slide] raster fallback failed for element', el, err);
  }
}

async function toDataUri(src: string, cache: Map<string, string>): Promise<string | null> {
  if (src.startsWith('data:')) return src;
  const cached = cache.get(src);
  if (cached) return cached;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await blobToDataUri(blob);
    cache.set(src, data);
    return data;
  } catch {
    return null;
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const FONT_SUBSTITUTIONS: { test: RegExp; face: string }[] = [
  { test: /mono|consol|courier|jetbrains/i, face: 'Consolas' },
  { test: /georgia|times|serif|iowan|charter/i, face: 'Georgia' },
  { test: /inter|geist|aptos|helvetica|arial|system-ui|sans/i, face: 'Aptos' },
];

function substituteFont(fontFamily: string): string {
  const first =
    fontFamily
      .split(',')[0]
      ?.trim()
      .replace(/^["']|["']$/g, '') ?? '';
  for (const { test, face } of FONT_SUBSTITUTIONS) {
    if (test.test(fontFamily)) return face;
  }
  return first || 'Aptos';
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    requestAnimationFrame(settle);
    setTimeout(settle, 50);
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
