import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import type { PdfExportProgress } from './export-pdf';
import { SlidePageProvider } from './page-context';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from './print-ready';
import type { SlideModule } from './sdk';

const IMAGE_SOURCE_ROOT_ID = 'os-image-pdf-source-root';
const IMAGE_PRINT_ROOT_ID = 'os-image-pdf-print-root';
const IMAGE_PRINT_STYLE_ID = 'os-image-pdf-print-style';
const IMAGE_PDF_SCALE = 1;
const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;

const IMAGE_PRINT_STYLES = `
@page { size: 1920px 1080px; margin: 0; }

@media screen {
  #${IMAGE_SOURCE_ROOT_ID} {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    z-index: -1 !important;
    pointer-events: none !important;
  }
  #${IMAGE_PRINT_ROOT_ID} {
    position: fixed !important;
    left: -99999px !important;
    top: 0 !important;
    pointer-events: none !important;
  }
  #${IMAGE_SOURCE_ROOT_ID} .os-image-pdf-source-frame {
    width: 1920px !important;
    height: 1080px !important;
    background: #fff;
    color: #000;
    overflow: hidden;
  }
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  body > *:not(#${IMAGE_PRINT_ROOT_ID}) { display: none !important; }
  #${IMAGE_PRINT_ROOT_ID} {
    position: static !important;
    left: 0 !important;
    top: 0 !important;
    pointer-events: auto !important;
    display: block !important;
    background: #fff !important;
  }
  #${IMAGE_PRINT_ROOT_ID} .os-image-pdf-frame {
    width: 1920px !important;
    height: 1080px !important;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  #${IMAGE_PRINT_ROOT_ID} .os-image-pdf-frame:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  #${IMAGE_PRINT_ROOT_ID} .os-image-pdf-page {
    display: block;
    width: 1920px !important;
    height: 1080px !important;
    object-fit: fill;
  }
}
`;

export async function exportSlideAsImagePdf(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PdfExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;

  const total = pages.length;

  const style = document.createElement('style');
  style.id = IMAGE_PRINT_STYLE_ID;
  style.textContent = IMAGE_PRINT_STYLES;
  document.head.appendChild(style);

  const sourceRoot = document.createElement('div');
  sourceRoot.id = IMAGE_SOURCE_ROOT_ID;
  sourceRoot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sourceRoot);

  const printRoot = document.createElement('div');
  printRoot.id = IMAGE_PRINT_ROOT_ID;
  printRoot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(printRoot);

  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const designVars = slide.design ? designToCssVars(slide.design) : null;

  const reactRoots: Root[] = [];
  const frames: HTMLElement[] = [];
  for (let i = 0; i < pages.length; i++) {
    const Page = pages[i];
    if (!Page) continue;
    const host = document.createElement('div');
    host.className = 'os-image-pdf-source-frame';
    host.setAttribute('data-osd-canvas', '');
    host.style.width = '1920px';
    host.style.height = '1080px';
    if (designVars) {
      for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
    }
    sourceRoot.appendChild(host);
    frames.push(host);
    const r = createRoot(host);
    r.render(
      createElement(SlidePageProvider, { index: i, total: pages.length }, createElement(Page)),
    );
    reactRoots.push(r);
  }

  await nextPaint();

  const previousTitle = document.title;
  document.title = slide.meta?.title ?? slideId;

  try {
    await waitForFonts();

    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      const settled = frames.reduce((n, frame) => (isFrameAnimationSettled(frame) ? n + 1 : n), 0);
      onProgress?.({
        phase: 'processing',
        current: settled,
        total,
        percent: Math.min(75, (settled / total) * 75),
      });
      if (settled === total) break;
      await sleep(POLL_INTERVAL_MS);
    }

    await waitForDataWaitfor(sourceRoot);
    await sleep(100);

    const { default: html2canvas } = await import('html2canvas-pro');
    for (let i = 0; i < frames.length; i++) {
      const canvas = await html2canvas(frames[i], {
        allowTaint: false,
        backgroundColor: '#ffffff',
        height: 1080,
        logging: false,
        scale: IMAGE_PDF_SCALE,
        useCORS: true,
        width: 1920,
        windowHeight: 1080,
        windowWidth: 1920,
      });
      appendImagePage(printRoot, canvas.toDataURL('image/png'));
      onProgress?.({
        phase: 'processing',
        current: i + 1,
        total,
        percent: 75 + ((i + 1) / total) * 24,
      });
    }

    await waitForImages(printRoot);
    await sleep(100);

    onProgress?.({ phase: 'printing', current: total, total, percent: 99 });
    const printDone = waitForAfterPrint();
    window.print();
    await printDone;
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    document.title = previousTitle;
    for (const r of reactRoots) r.unmount();
    sourceRoot.remove();
    printRoot.remove();
    style.remove();
  }
}

function appendImagePage(root: HTMLElement, dataUrl: string): void {
  const page = document.createElement('div');
  page.className = 'os-image-pdf-frame';
  const img = document.createElement('img');
  img.className = 'os-image-pdf-page';
  img.alt = '';
  img.src = dataUrl;
  page.appendChild(img);
  root.appendChild(page);
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

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error('Failed to load image PDF page')), {
          once: true,
        });
      });
    }),
  ).then(() => undefined);
}
