import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { collectDomPptxScene, logPptxDiagnostics } from './pptx/dom-collector';
import { createPptxExportReport, logPptxExportReport } from './pptx/report';
import { writePptxFile } from './pptx/write-pptx';
import { waitForDataWaitfor, waitForFonts } from './print-ready';
import type { SlideModule } from './sdk';

const PPTX_ROOT_ID = 'os-pptx-export-root';
const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export type ExportPptxOptions = {
  downloadBlob?: (blob: Blob, filename: string) => void;
};

export async function exportSlideAsPptx(
  slide: SlideModule,
  slideId: string,
  options: ExportPptxOptions = {},
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;

  const root = document.createElement('div');
  root.id = PPTX_ROOT_ID;
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, {
    height: '1080px',
    left: '-99999px',
    pointerEvents: 'none',
    position: 'fixed',
    top: '0',
    width: '1920px',
  });
  document.body.appendChild(root);

  const reactRoots: Root[] = [];

  try {
    const scenes = [];
    const designVars = slide.design ? designToCssVars(slide.design) : null;

    for (const [index, Page] of pages.entries()) {
      const host = document.createElement('div');
      host.setAttribute('data-osd-canvas', '');
      Object.assign(host.style, {
        background: '#fff',
        color: '#000',
        height: '1080px',
        overflow: 'hidden',
        position: 'relative',
        width: '1920px',
      });
      if (designVars) {
        for (const [key, value] of Object.entries(designVars)) {
          host.style.setProperty(key, value);
        }
      }
      root.appendChild(host);

      const reactRoot = createRoot(host);
      reactRoot.render(createElement(Page));
      reactRoots.push(reactRoot);

      await nextPaint();
      await nextPaint();
      await waitForFonts();
      await waitForDataWaitfor(host);

      const canvas = findCanvas(host);
      const scene = collectDomPptxScene(canvas);
      logPptxDiagnostics(index, scene.diagnostics);
      scenes.push(scene);

      reactRoot.unmount();
      reactRoots.pop();
      host.remove();
    }

    logPptxExportReport(createPptxExportReport(scenes));

    const blob = await writePptxFile({
      title: slide.meta?.title ?? slideId,
      slides: scenes,
      notes: slide.notes?.map((note) => note ?? ''),
    });
    (options.downloadBlob ?? downloadBlob)(blob, `${slideId}.pptx`);
  } finally {
    for (const reactRoot of reactRoots) reactRoot.unmount();
    root.remove();
  }
}

function findCanvas(host: HTMLElement): HTMLElement {
  if (host.matches('[data-osd-canvas]')) {
    return host;
  }

  const canvas = host.querySelector<HTMLElement>('[data-osd-canvas]');
  return canvas ?? host;
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
  const file = blob.type === PPTX_MIME_TYPE ? blob : blob.slice(0, blob.size, PPTX_MIME_TYPE);
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
