import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from '../design';
import { nextPaint, sleep } from '../dom';
import { SlidePageProvider } from '../page-context';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from '../print-ready';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from '../sdk';

const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;

export type MountedDeck = {
  container: HTMLElement;
  frames: HTMLElement[];
  dispose: () => void;
};

// Fast-forward every animation to its end frame in the live DOM: a large negative
// delay lands past a 1ms duration, so even pseudo-elements paint their final state
// on the first frame, and html-to-image clones never replay the hidden 0% keyframe.
function captureStyleText(captureClass: string): string {
  return `.${captureClass} *, .${captureClass} *::before, .${captureClass} *::after {
    animation-delay: -1s !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    animation-fill-mode: forwards !important;
    transition: none !important;
  }`;
}

export async function mountDeckOffscreen(
  slide: SlideModule,
  captureClass: string,
): Promise<MountedDeck> {
  const pages = slide.default ?? [];
  const container = document.createElement('div');
  container.className = captureClass;
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const captureStyle = document.createElement('style');
  captureStyle.textContent = captureStyleText(captureClass);
  document.head.appendChild(captureStyle);

  const designVars = slide.design ? designToCssVars(slide.design) : null;
  const roots: Root[] = [];
  const frames: HTMLElement[] = [];
  const dispose = () => {
    for (const root of roots) root.unmount();
    container.remove();
    captureStyle.remove();
  };

  try {
    for (let i = 0; i < pages.length; i++) {
      const Page = pages[i];
      if (!Page) continue;
      const host = document.createElement('div');
      host.setAttribute('data-osd-canvas', '');
      host.style.width = `${CANVAS_WIDTH}px`;
      host.style.height = `${CANVAS_HEIGHT}px`;
      host.style.overflow = 'hidden';
      host.style.background = designVars?.['--osd-bg'] ?? '#fff';
      if (designVars) {
        for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
      }
      container.appendChild(host);
      frames.push(host);
      const root = createRoot(host);
      roots.push(root);
      // Commit synchronously: measurement starts right after mounting, and a
      // concurrent render could otherwise leave later pages empty at that point.
      flushSync(() => {
        root.render(
          createElement(SlidePageProvider, { index: i, total: pages.length }, createElement(Page)),
        );
      });
    }

    await nextPaint();
    await waitForFonts();
    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      if (frames.every((frame) => isFrameAnimationSettled(frame))) break;
      await sleep(POLL_INTERVAL_MS);
    }
    await waitForDataWaitfor(container);
    await waitForFonts();
  } catch (err) {
    dispose();
    throw err;
  }

  return { container, frames, dispose };
}
