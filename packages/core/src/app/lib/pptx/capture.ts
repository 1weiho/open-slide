import { Component, createElement, type ReactNode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultDesign, designToCssVars } from '../design';
import { SlidePageProvider } from '../page-context';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from '../sdk';
import { StepHost } from '../step-context';
import { EditablePptxError, type PptxDiagnostic } from './model';

export function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

export function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  checkAbort(signal);
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Export cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

function paint(signal: AbortSignal): Promise<void> {
  return abortable(new Promise((resolve) => setTimeout(resolve, 30)), signal);
}

class CaptureBoundary extends Component<
  {
    children?: ReactNode;
    failed: (error: unknown) => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.failed(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Committed({ children, done }: { children?: ReactNode; done: () => void }) {
  useLayoutEffect(done, [done]);
  return children;
}

export async function capturePage(
  slide: SlideModule,
  index: number,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<{ host: HTMLDivElement; diagnostics: PptxDiagnostic[]; dispose: () => void }> {
  checkAbort(signal);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const local = controller.signal;
  const diagnostics: PptxDiagnostic[] = [];
  const host = document.createElement('div');
  host.dataset.osdPptxVersion = '1';
  host.dataset.osdPptxCapture = '';
  host.setAttribute('data-osd-canvas', '');
  host.setAttribute('aria-hidden', 'true');
  host.inert = true;
  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
    overflow: 'hidden',
    background: '#ffffff',
    pointerEvents: 'none',
  });
  for (const [name, value] of Object.entries(designToCssVars(slide.design ?? defaultDesign))) {
    host.style.setProperty(name, value);
  }
  document.body.appendChild(host);
  const root = createRoot(host);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    root.unmount();
    host.remove();
  };
  try {
    const Page = slide.default[index];
    if (!Page) throw new Error('The requested page is missing.');
    let renderError: unknown;
    await abortable(
      new Promise<void>((resolve, reject) => {
        root.render(
          createElement(
            CaptureBoundary,
            {
              failed: (error) => {
                renderError = error;
                reject(error);
              },
            },
            createElement(
              Committed,
              { done: resolve },
              createElement(
                SlidePageProvider,
                { index, total: slide.default.length },
                createElement(
                  StepHost,
                  {
                    isActivePage: false,
                    entryDirection: 'jump',
                    controllerRef: { current: null },
                  },
                  createElement(Page),
                ),
              ),
            ),
          ),
        );
      }),
      local,
    );
    await paint(local);
    for (const element of host.querySelectorAll<HTMLElement>('[data-waitfor]')) {
      const selector = element.dataset.waitfor;
      if (!selector) throw new Error('An empty data-waitfor selector cannot become ready.');
      while (!element.querySelector(selector)) await paint(local);
    }
    await abortable(document.fonts.ready, local);
    await Promise.all(
      Array.from(host.querySelectorAll('img'), async (img) => {
        img.loading = 'eager';
        if (!img.currentSrc && !img.src) throw new Error('An image has no source.');
        await abortable(img.decode(), local);
        if (!img.naturalWidth || !img.naturalHeight)
          throw new Error('An image could not be decoded.');
      }),
    );
    for (const animation of host.getAnimations({ subtree: true })) {
      const timing = animation.effect?.getComputedTiming();
      if (timing?.iterations === Infinity) {
        animation.currentTime = 0;
        animation.pause();
        diagnostics.push({
          severity: 'warning',
          code: 'animation-static',
          page: index + 1,
          source: 'page',
          message: 'A looping animation uses its first static frame.',
          suggestion: 'Provide a static presentation state if another frame carries the content.',
        });
      } else {
        animation.finish();
      }
    }
    await paint(local);
    for (const step of host.querySelectorAll('[data-osd-step]')) {
      const style = getComputedStyle(step);
      if (
        step.getAttribute('data-osd-step') === 'pending' ||
        style.visibility !== 'visible' ||
        Number(style.opacity) === 0
      ) {
        throw new Error('A presentation step is still hidden.');
      }
    }
    checkAbort(local);
    if (renderError) throw renderError;
    clearTimeout(timer);
    return { host, diagnostics, dispose };
  } catch (error) {
    dispose();
    if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
    throw new EditablePptxError('The page could not be prepared.', [
      {
        severity: 'error',
        code: timedOut ? 'readiness-timeout' : 'render-failed',
        page: index + 1,
        source: 'page',
        message: timedOut ? 'Page readiness timed out.' : String(error),
        suggestion: 'Check page rendering, fonts, images and data-waitfor readiness, then retry.',
      },
    ]);
  }
}
