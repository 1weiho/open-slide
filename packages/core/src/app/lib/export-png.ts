/**
 * PNG export entry points for the open-slide viewer.
 *
 * Phase 2 adds the single-page rasterisation pipeline: a page is mounted into
 * a hidden 1920×1080 host (mirroring the offscreen-mount pattern from
 * `export-pdf.ts`), readiness is gated on fonts / `data-waitfor` / animation
 * settle, then the mounted subtree is rasterised through the hand-rolled
 * `<foreignObject>` → canvas helpers in `export-png.rasterize.ts`. Phase 3
 * layers the full-deck ZIP path on top: pages are rasterised one at a time
 * and bundled flat via the existing `fflate` dependency, with progress
 * reported through `onProgress`.
 *
 * The rasterisation helpers (clone+style inlining, font/image inlining, SVG
 * wrap, supersampled canvas encode) live in the sibling
 * `export-png.rasterize.ts` per the CR's NFR-1 "helpers may be split into
 * sibling files in the same namespace if the count is exceeded" escape hatch,
 * so this entry-point module stays focused on orchestration.
 *
 * @agents-index PNG export entry points — orchestration for single-page +
 *               full-deck ZIP export; rasteriser helpers live in the sibling.
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { downloadBlob } from './download';
import {
  cloneWithInlinedStyles,
  defaultRasteriseSvgToPng,
  inlineGeistFonts,
  inlineSameOriginImages,
  nodeToSvgDataUrl,
  type Rasteriser,
} from './export-png.rasterize';
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

let rasteriserImpl: Rasteriser = (url, width, height) =>
  defaultRasteriseSvgToPng(url, width, height);

/**
 * Test-only seam: swap the SVG-to-PNG rasteriser so unit tests can simulate
 * success or failure without depending on a real `Image`/`canvas.toBlob`
 * pipeline. Production code paths never call this.
 */
export function __setRasteriserForTesting(next: Rasteriser | null): void {
  rasteriserImpl = next ?? ((url, w, h) => defaultRasteriseSvgToPng(url, w, h));
}

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
 * Pages are mounted and torn down one at a time (rather than concurrently
 * like the PDF exporter) to bound peak DOM size to a single 1920×1080 host
 * plus one in-flight PNG `Blob`, per Risk 5 of the CR.
 */
export async function exportSlideAsPngZip(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PngExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  const total = pages.length;
  if (total === 0) return;

  const emit = (phase: PngExportProgress['phase'], current: number): void => {
    if (!onProgress) return;
    onProgress({ phase, current, total, percent: computePercent(phase, current, total) });
  };

  const blobs: { name: string; bytes: Uint8Array }[] = [];
  emit('processing', 0);

  for (let i = 0; i < total; i++) {
    emit('processing', i);
    const blob = await renderPageToPng(slide, i);
    emit('rasterising', i + 1);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    blobs.push({ name: pngFilenameFor(slideId, i, total), bytes });
  }

  emit('zipping', total);
  const { zipSync } = await import('fflate');
  const zipTree: Record<string, Uint8Array> = {};
  for (const { name, bytes } of blobs) zipTree[name] = bytes;
  const zipped = zipSync(zipTree);
  downloadBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), `${slideId}.zip`);
  emit('done', total);
}

/**
 * Map a `{phase, current, total}` tuple onto a monotonically non-decreasing
 * 0–100 percent. Processing and rasterising share the per-page band so the
 * bar advances as each page completes; zipping pins to 99 until the archive
 * is built, and `done` snaps to 100.
 */
export function computePercent(
  phase: PngExportProgress['phase'],
  current: number,
  total: number,
): number {
  if (phase === 'done') return 100;
  if (phase === 'zipping') return 99;
  if (total <= 0) return 0;
  const clamped = Math.max(0, Math.min(current, total));
  return Math.min(98, Math.floor((clamped / total) * 98));
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
    return await rasteriserImpl(svgUrl, CANVAS_WIDTH, CANVAS_HEIGHT);
  } finally {
    if (root) root.unmount();
    host.remove();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
