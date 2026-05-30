/**
 * PNG export entry points for the open-slide viewer.
 *
 * This module is the Phase 1 skeleton: it declares the public surface
 * (`exportSlidePageAsPng`, `exportSlideAsPngZip`) and the progress contract
 * (`PngExportProgress`) shaped identically to `PdfExportProgress` so the
 * download dropdown and progress toast can render either pipeline through one
 * mental model. The rasterisation pipeline itself (offscreen mount,
 * `<foreignObject>` → canvas, ZIP bundling) lands in subsequent phases.
 *
 * @agents-index PNG export public API skeleton — signatures + progress type
 *               only; rasterisation pipeline is added in later phases.
 */

import type { SlideModule } from './sdk';

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

/**
 * Rasterise a single page of `slide` to a PNG and trigger a browser download
 * named `{slideId}-p{N}.png`, where `N` is `pageIndex + 1` zero-padded to the
 * width of the total page count. Resolves once the download has been
 * triggered; rejects on any rasterisation failure so the caller can surface
 * `slide.pngExportFailed`.
 *
 * Phase 1 skeleton: rasterisation pipeline lands in Phase 2.
 */
export async function exportSlidePageAsPng(
  _slide: SlideModule,
  _slideId: string,
  _pageIndex: number,
): Promise<void> {
  throw new Error('exportSlidePageAsPng is not implemented yet');
}

/**
 * Rasterise every page of `slide` to a PNG, bundle the results into a flat
 * `{slideId}.zip` via the existing `fflate` dependency, and trigger a browser
 * download. Reports progress through the optional `onProgress` callback using
 * the same shape as `PdfExportProgress` so the toast component can render
 * either pipeline.
 *
 * Phase 1 skeleton: rasterisation + ZIP pipeline lands in Phases 2 and 3.
 */
export async function exportSlideAsPngZip(
  _slide: SlideModule,
  _slideId: string,
  _onProgress?: (progress: PngExportProgress) => void,
): Promise<void> {
  throw new Error('exportSlideAsPngZip is not implemented yet');
}
