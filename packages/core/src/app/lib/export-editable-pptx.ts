import { capturePage, checkAbort } from './pptx/capture';
import { extractPage } from './pptx/extract';
import {
  EditablePptxError,
  type EditablePptxOptions,
  type EditablePptxReport,
  type PptxDeck,
  type PptxDiagnostic,
  type PptxWriteResult,
} from './pptx/model';
import { qualityReport } from './pptx/report';
import { validateDeck } from './pptx/validate';
import type { SlideModule } from './sdk';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './sdk';

export type {
  EditablePptxOptions,
  EditablePptxProgress,
  EditablePptxReport,
  PptxDiagnostic,
} from './pptx/model';
export { EditablePptxError } from './pptx/model';

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function cancellationError(): DOMException {
  return new DOMException('Export cancelled', 'AbortError');
}

function errorDetail(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return undefined;
}

function writerFailure(error: unknown): EditablePptxError {
  if (error instanceof EditablePptxError) return error;
  const detail = errorDetail(error);
  const diagnostic: PptxDiagnostic = {
    severity: 'error',
    code: 'writer-error',
    page: 0,
    source: 'deck',
    message: detail ? `The PowerPoint writer failed: ${detail}` : 'The PowerPoint writer failed.',
    suggestion:
      'Retry the export. If it continues, verify the deck data and browser worker support.',
  };
  return new EditablePptxError('The PowerPoint file could not be generated.', [diagnostic]);
}

function pageFailure(
  index: number,
  phase: 'capture' | 'extract',
  error: unknown,
): EditablePptxError {
  const detail = errorDetail(error);
  const diagnostic: PptxDiagnostic = {
    severity: 'error',
    code: `${phase}-failed`,
    page: index + 1,
    source: 'page',
    message: detail ? `The page ${phase} failed: ${detail}` : `The page ${phase} failed.`,
    suggestion: 'Check page rendering, fonts, images and source content, then retry the export.',
  };
  return new EditablePptxError('The page could not be prepared for editable PowerPoint.', [
    diagnostic,
  ]);
}

function writeInWorker(deck: PptxDeck, signal: AbortSignal): Promise<PptxWriteResult> {
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./pptx/write.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (error) {
      reject(signal.aborted ? cancellationError() : writerFailure(error));
      return;
    }

    let settled = false;
    const cleanup = () => {
      worker.terminate();
      signal.removeEventListener('abort', abort);
    };
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const fail = (error: unknown) => {
      settle(() => {
        if (signal.aborted || isAbortError(error)) reject(cancellationError());
        else reject(writerFailure(error));
      });
    };
    const abort = () => fail(cancellationError());
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<unknown>) => {
      const payload =
        data && typeof data === 'object'
          ? (data as {
              blob?: unknown;
              error?: unknown;
              pages?: PptxWriteResult['pages'];
              diagnostics?: PptxDiagnostic[];
            })
          : undefined;
      const blob = payload?.blob;
      const pages = payload?.pages;
      if (
        blob instanceof Blob &&
        blob.size > 0 &&
        Array.isArray(pages) &&
        pages.length === deck.pages.length &&
        pages.every(
          (page, index) =>
            page.index === deck.pages[index].index &&
            [page.nativeLeafObjects, page.writerExtraObjects, page.groupContainers].every(
              (count) => Number.isInteger(count) && count >= 0,
            ),
        )
      ) {
        settle(() => resolve({ blob, pages, diagnostics: payload?.diagnostics ?? [] }));
        return;
      }
      const message = typeof payload?.error === 'string' ? payload.error : undefined;
      fail(
        message && Array.isArray(payload?.diagnostics)
          ? new EditablePptxError(message, payload.diagnostics)
          : new Error(message || 'The PowerPoint writer returned an invalid file or report.'),
      );
    };
    worker.onerror = (event) =>
      fail(new Error(event.message || 'The PowerPoint writer worker failed.'));
    worker.onmessageerror = () =>
      fail(new Error('The PowerPoint writer response could not be read.'));
    if (signal.aborted) {
      abort();
      return;
    }
    try {
      worker.postMessage(deck);
    } catch (error) {
      fail(error);
    }
  });
}

export async function exportSlideAsEditablePptx(
  slide: SlideModule,
  slideId: string,
  options: EditablePptxOptions = {},
): Promise<{ blob: Blob; report: EditablePptxReport }> {
  const started = performance.now();
  checkAbort(options.signal);
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 180_000);
  const signal = controller.signal;
  const indices = options.pageIndices ?? slide.default.map((_, index) => index);
  const deck: PptxDeck = {
    version: 2,
    id: slideId,
    title: slide.meta?.title ?? slideId,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    pages: [],
  };
  const progress = (
    phase: 'preparing' | 'processing' | 'generating' | 'generated',
    current: number,
    percent: number,
  ) => {
    options.onProgress?.({ phase, current, total: indices.length, percent });
  };
  try {
    if (
      !indices.length ||
      new Set(indices).size !== indices.length ||
      indices.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= slide.default.length,
      )
    ) {
      throw new EditablePptxError('No valid pages were selected.', [
        {
          severity: 'error',
          code: 'invalid-page-selection',
          page: 0,
          source: 'deck',
          message: 'Select at least one existing page without duplicate indices.',
          suggestion: 'Export the complete deck or a valid page selection.',
        },
      ]);
    }
    progress('preparing', 0, 0);
    for (const [position, index] of indices.entries()) {
      checkAbort(signal);
      let captured: Awaited<ReturnType<typeof capturePage>>;
      try {
        captured = await capturePage(slide, index, signal, options.pageTimeoutMs ?? 20_000);
      } catch (error) {
        if (error instanceof EditablePptxError || isAbortError(error)) throw error;
        throw pageFailure(index, 'capture', error);
      }
      try {
        const page = await extractPage(captured.host, index, signal, slide.notes?.[index]);
        page.diagnostics.unshift(...captured.diagnostics);
        deck.pages.push(page);
      } catch (error) {
        if (error instanceof EditablePptxError || isAbortError(error)) throw error;
        throw pageFailure(index, 'extract', error);
      } finally {
        captured.dispose();
      }
      progress('processing', position + 1, Math.round(((position + 1) / indices.length) * 85));
    }
    const diagnostics = validateDeck(deck);
    if (diagnostics.some((entry) => entry.severity === 'error'))
      throw new EditablePptxError(
        'Some content cannot be exported as editable PowerPoint objects.',
        diagnostics,
      );
    progress('generating', indices.length, 90);
    const written = await writeInWorker(deck, signal);
    const { blob } = written;
    checkAbort(signal);
    const report: EditablePptxReport = {
      version: 1,
      slideId,
      writer: 'PptxGenJS 4.0.1',
      pages: deck.pages.map((page) => ({
        index: page.index,
        objects: page.objects.length,
        text: page.objects.filter((object) => object.kind === 'text').length,
        tables: page.objects.filter((object) => object.kind === 'table').length,
        images: page.objects.filter((object) => object.kind === 'image').length,
      })),
      diagnostics,
      elapsedMs: Math.round(performance.now() - started),
      quality: qualityReport(deck, written.pages, diagnostics),
    };
    progress('generated', indices.length, 100);
    return { blob, report };
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    if (timedOut)
      throw new EditablePptxError('PowerPoint export timed out.', [
        {
          severity: 'error',
          code: 'export-timeout',
          page: 0,
          source: 'deck',
          message: 'The export exceeded its time limit.',
          suggestion: 'Check assets and page readiness, then retry.',
        },
      ]);
    if (isAbortError(error)) throw error;
    if (error instanceof EditablePptxError) throw error;
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
