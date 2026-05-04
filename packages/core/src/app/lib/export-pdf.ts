import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from './print-ready';
import type { SlideModule } from './sdk';

const PRINT_ROOT_ID = 'os-print-root';
const PRINT_STYLE_ID = 'os-print-style';

const PRINT_STYLES = `
@page { size: 1920px 1080px; margin: 0; }

@media screen {
  #${PRINT_ROOT_ID} {
    position: fixed !important;
    left: -99999px !important;
    top: 0 !important;
    pointer-events: none !important;
  }
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  body > *:not(#${PRINT_ROOT_ID}) { display: none !important; }
  #${PRINT_ROOT_ID} {
    position: static !important;
    left: 0 !important;
    top: 0 !important;
    pointer-events: auto !important;
    display: block !important;
    background: #fff !important;
  }
  #${PRINT_ROOT_ID} .os-print-frame {
    width: 1920px !important;
    height: 1080px !important;
    background: #fff;
    color: #000;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #${PRINT_ROOT_ID} .os-print-frame:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  /* Supersample: Chrome rasterizes filtered/composited layers (e.g. filter:
     blur, mix-blend-mode) at the layer's CSS-pixel size, so a blurred
     gradient on a 1920×1080 page bakes in at ~1× DPI and bands when the PDF
     is viewed scaled up. zoom:2 doubles the layer raster size; scale(0.5)
     composites it back to 1920×1080. Vector content (text, plain CSS
     gradients, SVG) stays vector through both transforms. */
  #${PRINT_ROOT_ID} .os-print-supersample {
    width: 1920px !important;
    height: 1080px !important;
    zoom: 2;
    transform: scale(0.5);
    transform-origin: top left;
  }
}
`;

export type PdfExportProgress = {
  phase: 'processing' | 'printing' | 'done';
  /** Number of pages whose intro animations have finished (0..total). */
  current: number;
  total: number;
  /** 0–99 while processing, 99 during printing, 100 when done. */
  percent: number;
};

const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;

export async function exportSlideAsPdf(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PdfExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;

  const total = pages.length;

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = PRINT_STYLES;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = PRINT_ROOT_ID;
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);

  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const designVars = slide.design ? designToCssVars(slide.design) : null;

  const reactRoots: Root[] = [];
  const frames: HTMLElement[] = [];
  for (const Page of pages) {
    const host = document.createElement('div');
    host.className = 'os-print-frame';
    host.setAttribute('data-osd-canvas', '');
    host.style.width = '1920px';
    host.style.height = '1080px';
    if (designVars) {
      for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
    }
    const inner = document.createElement('div');
    inner.className = 'os-print-supersample';
    inner.style.width = '1920px';
    inner.style.height = '1080px';
    host.appendChild(inner);
    root.appendChild(host);
    frames.push(host);
    const r = createRoot(inner);
    r.render(createElement(Page));
    reactRoots.push(r);
  }
  // Yield once so React commits all pages and CSS animations actually start
  // (queued via Web Animations API on the first paint after mount).
  await nextPaint();

  const previousTitle = document.title;
  document.title = slide.meta?.title ?? slideId;

  try {
    await waitForFonts();

    // Poll per-page animation completion. The bar tracks how many pages have
    // settled, which matches "page X of N is being processed" mental model.
    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      const settled = frames.reduce((n, frame) => (isFrameAnimationSettled(frame) ? n + 1 : n), 0);
      onProgress?.({
        phase: 'processing',
        current: settled,
        total,
        percent: Math.min(99, (settled / total) * 99),
      });
      if (settled === total) break;
      await sleep(POLL_INTERVAL_MS);
    }

    await waitForDataWaitfor(root);
    await sleep(100); // flush layout

    onProgress?.({ phase: 'printing', current: total, total, percent: 99 });
    const printDone = waitForAfterPrint();
    window.print();
    await printDone;
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    document.title = previousTitle;
    for (const r of reactRoots) r.unmount();
    root.remove();
    style.remove();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPaint(): Promise<void> {
  // rAF in real tabs; setTimeout fallback for hidden/throttled headless tabs.
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

function waitForAfterPrint(timeoutMs = 60_000): Promise<void> {
  return new Promise((resolve) => {
    const cleanup = () => {
      window.removeEventListener('afterprint', onAfter);
      clearTimeout(timer);
      resolve();
    };
    const onAfter = () => cleanup();
    const timer = setTimeout(cleanup, timeoutMs);
    window.addEventListener('afterprint', onAfter, { once: true });
  });
}
