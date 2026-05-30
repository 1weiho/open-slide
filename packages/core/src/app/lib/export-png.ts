/**
 * PNG export entry points for the open-slide viewer.
 *
 * Phase 2 adds the single-page rasterisation pipeline: a page is mounted into
 * a hidden 1920×1080 host (mirroring the offscreen-mount pattern from
 * `export-pdf.ts`), readiness is gated on fonts / `data-waitfor` / animation
 * settle, then the mounted subtree is cloned, computed styles + bundled Geist
 * fonts + same-origin images are inlined onto the clone, the clone is wrapped
 * in an SVG `<foreignObject>` of the canonical 1920×1080 viewBox, loaded as
 * an `Image`, drawn onto an offscreen canvas supersampled ×2, and encoded as
 * PNG via `canvas.toBlob`. The whole-deck ZIP path lands in Phase 3.
 *
 * @agents-index PNG export pipeline — single-page rasterisation via a
 *               hand-rolled <foreignObject> -> canvas path, zero new deps.
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { downloadBlob } from './download';
import { SlidePageProvider } from './page-context';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from './print-ready';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from './sdk';

/**
 * Progress contract for the multi-page PNG export, shaped identically to
 * `PdfExportProgress` so the same toast component pattern can render it.
 */
export type PngExportProgress = {
  /**
   * Coarse phase of the export.
   * - `processing`: page is mounted offscreen and awaiting fonts / animations.
   * - `rasterising`: cloned subtree is being drawn to canvas and encoded to PNG.
   * - `zipping`: per-page PNGs are being bundled with fflate.
   * - `done`: export has finished and the download has been triggered.
   */
  phase: 'processing' | 'rasterising' | 'zipping' | 'done';
  /** Number of pages whose current-phase work has finished (0..total). */
  current: number;
  total: number;
  /** 0–99 while in-flight, 100 when `done`. */
  percent: number;
};

const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;
const PNG_HOST_ATTR = 'data-png-export-host';

/**
 * Compute the per-page PNG filename, padding the 1-based page number to the
 * width of the total page count so file-system sort order matches slide order
 * for any deck size (per FR-1 / Open Question 2).
 */
export function pngFilenameFor(slideId: string, pageIndex: number, total: number): string {
  const width = String(Math.max(1, total)).length;
  const n = String(pageIndex + 1).padStart(width, '0');
  return `${slideId}-p${n}.png`;
}

/**
 * Rasterise a single page of `slide` to a PNG and trigger a browser download
 * named `{slideId}-p{N}.png`, where `N` is `pageIndex + 1` zero-padded to the
 * width of the total page count. Resolves once the download has been
 * triggered; rejects on any rasterisation failure so the caller can surface
 * `slide.pngExportFailed`.
 */
export async function exportSlidePageAsPng(
  slide: SlideModule,
  slideId: string,
  pageIndex: number,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const blob = await renderPageToPng(slide, pageIndex);
  downloadBlob(blob, pngFilenameFor(slideId, pageIndex, pages.length));
}

/**
 * Rasterise every page of `slide` to a PNG, bundle the results into a flat
 * `{slideId}.zip` via the existing `fflate` dependency, and trigger a browser
 * download. Reports progress through the optional `onProgress` callback using
 * the same shape as `PdfExportProgress` so the toast component can render
 * either pipeline.
 *
 * Phase 2 skeleton: the multi-page + ZIP pipeline lands in Phase 3.
 */
export async function exportSlideAsPngZip(
  _slide: SlideModule,
  _slideId: string,
  _onProgress?: (progress: PngExportProgress) => void,
): Promise<void> {
  throw new Error('exportSlideAsPngZip is not implemented yet');
}

/**
 * Mount a single page offscreen at 1920×1080, wait for fonts / `data-waitfor`
 * / intro animations to settle (mirroring `export-pdf.ts`), then rasterise it
 * through the hand-rolled `<foreignObject>` → canvas pipeline. Tears down the
 * React root and DOM host on both success and failure so no residue is left.
 */
async function renderPageToPng(slide: SlideModule, pageIndex: number): Promise<Blob> {
  const pages = slide.default ?? [];
  const Page = pages[pageIndex];
  if (!Page) throw new Error(`export-png: page ${pageIndex} is missing`);

  const host = document.createElement('div');
  host.setAttribute(PNG_HOST_ATTR, '');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
    pointerEvents: 'none',
    background: '#fff',
  });
  if (slide.design) {
    const designVars = designToCssVars(slide.design);
    for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
  }
  document.body.appendChild(host);

  let root: Root | null = null;
  try {
    root = createRoot(host);
    root.render(
      createElement(
        SlidePageProvider,
        { index: pageIndex, total: pages.length },
        createElement(Page),
      ),
    );

    await nextPaint();
    await nextPaint();

    await waitForFonts();
    await waitForDataWaitfor(host);

    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      if (isFrameAnimationSettled(host)) break;
      await sleep(POLL_INTERVAL_MS);
    }

    const clone = cloneWithInlinedStyles(host);
    await inlineGeistFonts(clone);
    await inlineSameOriginImages(clone);
    const svgUrl = nodeToSvgDataUrl(clone, CANVAS_WIDTH, CANVAS_HEIGHT);
    return await rasteriseSvgToPng(svgUrl, CANVAS_WIDTH, CANVAS_HEIGHT);
  } finally {
    if (root) root.unmount();
    host.remove();
  }
}

/**
 * Deep-clone `source` and, for every element in the clone, copy the source
 * element's computed style onto an inline `style` attribute. SVG
 * `<foreignObject>` only paints styles present in the serialised markup, so
 * flattening computed styles is the bridge between "looks right in the live
 * DOM" and "looks right after serialisation".
 */
function cloneWithInlinedStyles(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const srcAll = source.querySelectorAll<HTMLElement>('*');
  const dstAll = clone.querySelectorAll<HTMLElement>('*');
  copyComputedStyle(source, clone);
  const len = Math.min(srcAll.length, dstAll.length);
  for (let i = 0; i < len; i++) {
    const s = srcAll[i];
    const d = dstAll[i];
    if (s && d) copyComputedStyle(s, d);
  }
  return clone;
}

function copyComputedStyle(src: Element, dst: Element): void {
  if (!(src instanceof HTMLElement) || !(dst instanceof HTMLElement)) return;
  const cs = window.getComputedStyle(src);
  let cssText = '';
  for (let i = 0; i < cs.length; i++) {
    const prop = cs.item(i);
    const value = cs.getPropertyValue(prop);
    if (!value) continue;
    const priority = cs.getPropertyPriority(prop);
    cssText += `${prop}:${value}${priority ? ' !important' : ''};`;
  }
  dst.setAttribute('style', cssText);
}

/**
 * Embed open-slide's bundled Geist `@font-face` rules as `data:` URIs in a
 * `<style>` prepended to `clone`. Geist is shipped by open-slide itself, so
 * all the source URLs are same-origin and safe to fetch. Without this step
 * the serialised `<foreignObject>` renders Geist as a fallback system font
 * (the SVG image loader does not consult the page's font registry).
 */
async function inlineGeistFonts(clone: HTMLElement): Promise<void> {
  const cssChunks: string[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue('font-family');
      if (!/geist/i.test(family)) continue;
      const inlined = await inlineFontFaceSources(rule.cssText, seen);
      if (inlined) cssChunks.push(inlined);
    }
  }
  if (cssChunks.length === 0) return;
  const style = document.createElement('style');
  style.textContent = cssChunks.join('\n');
  clone.insertBefore(style, clone.firstChild);
}

async function inlineFontFaceSources(cssText: string, seen: Set<string>): Promise<string | null> {
  const urlRe = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  const matches: { full: string; url: string }[] = [];
  for (const m of cssText.matchAll(urlRe)) {
    matches.push({ full: m[0], url: m[2] });
  }
  let out = cssText;
  for (const { full, url } of matches) {
    if (url.startsWith('data:')) continue;
    const abs = toAbsoluteUrl(url);
    if (!abs) continue;
    try {
      const sameOrigin = new URL(abs).origin === window.location.origin;
      if (!sameOrigin) continue;
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      const res = await fetch(abs);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUri = await blobToDataUrl(blob);
      out = out.split(full).join(`url(${dataUri})`);
    } catch {}
  }
  return out;
}

/**
 * For each `<img>` in `clone` whose `src` is same-origin, fetch the bytes and
 * rewrite the `src` to a `data:` URI so the serialised SVG can paint the
 * image without a cross-origin canvas taint. Cross-origin `<img>` elements
 * are deliberately left untouched (documented limitation in the CR).
 */
async function inlineSameOriginImages(clone: HTMLElement): Promise<void> {
  const imgs = Array.from(clone.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const abs = toAbsoluteUrl(src);
      if (!abs) return;
      try {
        if (new URL(abs).origin !== window.location.origin) return;
      } catch {
        return;
      }
      try {
        const res = await fetch(abs);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUri = await blobToDataUrl(blob);
        img.setAttribute('src', dataUri);
      } catch {}
    }),
  );
}

/**
 * Wrap `node` in an SVG `<foreignObject>` of the canonical viewBox and return
 * a `data:image/svg+xml` URL ready to feed to an `Image`. Serialisation uses
 * the platform `XMLSerializer` so attribute escaping matches what the SVG
 * image decoder expects.
 */
function nodeToSvgDataUrl(node: HTMLElement, width: number, height: number): string {
  const xhtml = new XMLSerializer().serializeToString(node);
  const wrapped = xhtml.includes('xmlns="http://www.w3.org/1999/xhtml"')
    ? xhtml
    : xhtml.replace(/^<([a-zA-Z][\w-]*)/, '<$1 xmlns="http://www.w3.org/1999/xhtml"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${wrapped}</foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Load an SVG data URL into an `Image` and draw it onto an offscreen canvas
 * supersampled ×2 (backing-store 3840×2160, drawn down to the 1920×1080
 * output). The ×2 supersample mirrors the `zoom: 2` / `transform: scale(0.5)`
 * trick `export-pdf.ts` uses so the PNG matches the PDF's perceived
 * sharpness on filtered / composited layers.
 */
function rasteriseSvgToPng(url: string, width: number, height: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('export-png: 2d canvas context unavailable'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('export-png: canvas.toBlob produced no blob'));
            return;
          }
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error('export-png: SVG <foreignObject> image failed to load'));
    img.src = url;
  });
}

function toAbsoluteUrl(url: string): string | null {
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('FileReader failed'));
    fr.readAsDataURL(blob);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
