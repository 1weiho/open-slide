import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { designToCssVars } from './design';
import { SlidePageProvider } from './page-context';
import { waitForDataWaitfor, waitForFonts } from './print-ready';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from './sdk';

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_HEIGHT_IN = 7.5;

export async function exportSlideAsPptx(slide: SlideModule, slideId: string): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;

  const title = slide.meta?.title ?? slideId;
  const designVars = slide.design ? designToCssVars(slide.design) : null;
  const designBg = (designVars?.['--osd-bg'] && colorToHex(designVars['--osd-bg'])) || '';

  const contents = await renderAndCapture(pages, designVars, designBg);

  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.author = 'open-slide';
  pptx.title = title;
  pptx.defineLayout({
    name: 'WIDESCREEN',
    width: SLIDE_WIDTH_IN,
    height: SLIDE_HEIGHT_IN,
  });
  pptx.layout = 'WIDESCREEN';

  for (let i = 0; i < contents.length; i++) {
    const page = contents[i];
    const s = pptx.addSlide();

    if (page.imageDataUrl) {
      s.background = { data: page.imageDataUrl };
    } else if (page.background) {
      s.background = { color: page.background };
    }

    const note = slide.notes?.[i];
    if (note) s.addNotes(note);
  }

  await pptx.writeFile({ fileName: `${slideId}.pptx` });
}

interface CapturedPage {
  background: string;
  imageDataUrl: string;
}

async function renderAndCapture(
  pages: NonNullable<SlideModule['default']>,
  designVars: Record<string, string> | null,
  designBg: string,
): Promise<CapturedPage[]> {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const result: CapturedPage[] = [];
  try {
    for (let i = 0; i < pages.length; i++) {
      const Page = pages[i];
      if (!Page) {
        result.push({ background: designBg, imageDataUrl: '' });
        continue;
      }

      const host = document.createElement('div');
      host.id = `osd-pptx-capture-${i}`;
      host.style.width = `${CANVAS_WIDTH}px`;
      host.style.height = `${CANVAS_HEIGHT}px`;
      host.style.position = 'relative';
      host.style.overflow = 'hidden';
      if (designVars) {
        for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
      }
      container.appendChild(host);

      const root = createRoot(host);
      root.render(
        createElement(SlidePageProvider, { index: i, total: pages.length }, createElement(Page)),
      );
      await nextPaint();
      await waitForFonts();
      await waitForDataWaitfor(host);

      // Force all CSS animations to their end state so the browser resolves
      // the final visual state.
      const animStyle = document.createElement('style');
      animStyle.textContent = `#osd-pptx-capture-${i} *, #osd-pptx-capture-${i} *::before, #osd-pptx-capture-${i} *::after { animation-delay: -99999s !important; }`;
      // Must be appended INSIDE the host so snapDOM's subtree clone includes it.
      host.appendChild(animStyle);
      await nextPaint();

      // Strip animations entirely so snapDOM's renderer doesn't replay them
      // from the initial (hidden) keyframe. After the negative-delay trick above,
      // every element is at its final visual state; removing the animation
      // lets the element fall back to its base CSS (which matches the end state).
      const noAnimStyle = document.createElement('style');
      noAnimStyle.textContent = `#osd-pptx-capture-${i}, #osd-pptx-capture-${i} *, #osd-pptx-capture-${i} *::before, #osd-pptx-capture-${i} *::after { animation: none !important; transition: none !important; }`;
      host.appendChild(noAnimStyle);
      await nextPaint();

      let imageDataUrl = '';
      try {
        const { snapdom } = await import('@zumer/snapdom');
        const img = await snapdom.toPng(host, {
          scale: 2,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          embedFonts: true,
          backgroundColor: 'transparent',
        });
        imageDataUrl = img.src;
      } catch (err) {
        console.error('[open-slide] PPTX export: capture failed:', err);
      }

      const bg = detectBackground(host) || designBg;
      animStyle.remove();
      noAnimStyle.remove();
      root.unmount();
      result.push({ background: bg, imageDataUrl });
      container.removeChild(host);
    }
  } finally {
    container.remove();
  }
  return result;
}

function detectBackground(host: HTMLElement): string {
  let bg = colorToHex(getComputedStyle(host).backgroundColor);
  if (!bg) {
    for (const child of host.children) {
      if (!(child instanceof HTMLElement)) continue;
      bg = colorToHex(getComputedStyle(child).backgroundColor);
      if (bg) break;
    }
  }
  return bg;
}

function colorToHex(color: string): string {
  if (color === 'transparent' || !color) return '';
  if (/^#[0-9a-f]{3,8}$/i.test(color)) {
    const hex = color.slice(1);
    if (hex.length === 3) return `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    if (hex.length >= 6) return hex.slice(0, 6);
    return '';
  }
  const match = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `${r}${g}${b}`;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
