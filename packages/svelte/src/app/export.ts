import type { SlideModule } from '@open-slide/shared';
import { mount, unmount } from 'svelte';
import type { Page } from '../index.ts';

type MountedPage = { instance: ReturnType<typeof mount>; frame: HTMLElement };

const PRINT_STYLES = `
@page { size: 1920px 1080px; margin: 0; }
@media screen { #os-print-root { position: fixed; left: -99999px; top: 0; } }
@media print {
  html, body { margin: 0 !important; background: #fff !important; }
  body > *:not(#os-print-root) { display: none !important; }
  #os-print-root { position: static !important; display: block !important; }
  #os-print-root .os-print-frame {
    width: 1920px !important;
    height: 1080px !important;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  #os-print-root .os-print-frame:last-child { break-after: auto; page-break-after: auto; }
}`;

function mountPages(slide: SlideModule<Page>, root: HTMLElement): MountedPage[] {
  return slide.default.map((PageComponent) => {
    const frame = document.createElement('section');
    frame.className = 'os-print-frame';
    frame.style.width = '1920px';
    frame.style.height = '1080px';
    root.appendChild(frame);
    return { instance: mount(PageComponent, { target: frame }), frame };
  });
}

async function cleanupPages(pages: MountedPage[], root: HTMLElement): Promise<void> {
  await Promise.all(pages.map(({ instance }) => unmount(instance)));
  root.remove();
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

export async function exportPdf(slide: SlideModule<Page>, slideId: string): Promise<void> {
  const style = document.createElement('style');
  style.textContent = PRINT_STYLES;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'os-print-root';
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);
  const pages = mountPages(slide, root);
  const previousTitle = document.title;
  document.title = slide.meta?.title ?? slideId;
  await nextPaint();
  await document.fonts?.ready;

  try {
    const printed = new Promise<void>((resolve) => {
      window.addEventListener('afterprint', () => resolve(), { once: true });
      setTimeout(resolve, 2_000);
    });
    window.print();
    await printed;
  } finally {
    document.title = previousTitle;
    await cleanupPages(pages, root);
    style.remove();
  }
}

function collectCss(): string {
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) rules.push(rule.cssText);
    } catch {}
  }
  return rules.join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function exportHtml(slide: SlideModule<Page>, slideId: string): Promise<void> {
  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(root);
  const pages = mountPages(slide, root);
  await nextPaint();
  const title = slide.meta?.title ?? slideId;
  const pageHtml = pages
    .map(({ frame }) => `<section class="os-export-page">${frame.innerHTML}</section>`)
    .join('\n');
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title><style>${collectCss()}
html,body{margin:0;background:#111}.os-export-page{width:1920px;height:1080px;overflow:hidden;margin:0 auto 24px}</style>
</head><body>${pageHtml}</body></html>`;
  await cleanupPages(pages, root);

  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  anchor.download = `${slideId}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
}
