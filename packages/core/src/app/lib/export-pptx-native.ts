import type { PptxExportProgress } from './export-pptx';

// Native (editable) PPTX export. Unlike exportSlideAsImagePptx (in
// ./export-pptx), which rasterises each slide to a PNG, this streams the deck
// to the dev server where @open-slide/core renders it to real, editable shapes
// via Playwright. Progress arrives over Server-Sent Events and is mapped onto
// the shared PptxProgressToast's processing/generating/done vocabulary.

export type PptxExportHooks = {
  onProgress?: (p: PptxExportProgress) => void;
  onPlaywrightMissing?: (info: { packageManager: string; command: string }) => void;
};

// Server-side pipeline phases, in order, from @open-slide/core's ProgressEvent.
type ServerPhase = 'loading' | 'measuring' | 'rendering' | 'building' | 'postprocessing' | 'done';

// rendering occupies [RENDERING_START, RENDERING_END) and interpolates by
// current / total so the progress bar advances per page instead of holding
// at the start value for the whole render phase.
const RENDERING_START = 10;
const RENDERING_END = 80;

function computePercent(phase: ServerPhase, current: number, total: number): number {
  switch (phase) {
    case 'loading':
      return 5;
    case 'measuring':
      return RENDERING_START;
    case 'rendering': {
      if (total <= 0) return RENDERING_START;
      const t = Math.min(1, Math.max(0, current / total));
      return RENDERING_START + (RENDERING_END - RENDERING_START) * t;
    }
    case 'building':
      return RENDERING_END;
    case 'postprocessing':
      return 92;
    case 'done':
      return 100;
    default:
      // Unrecognised phase — keep the bar advancing forward (not NaN) rather
      // than freezing it at an undefined value.
      return RENDERING_END;
  }
}

// Collapse the granular server phases onto the toast's three display states.
function toToastProgress(phase: ServerPhase, current: number, total: number): PptxExportProgress {
  const percent = computePercent(phase, current, total);
  if (phase === 'done') return { phase: 'done', current, total, percent };
  if (phase === 'building' || phase === 'postprocessing') {
    return { phase: 'generating', current, total, percent };
  }
  // loading / measuring / rendering → per-page "processing"
  return { phase: 'processing', current, total, percent };
}

export async function exportSlideAsPptx(slideId: string, hooks: PptxExportHooks): Promise<void> {
  const res = await fetch('/__os/api/export/pptx', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId }),
  });

  const ct = res.headers.get('content-type') ?? '';
  if (ct.startsWith('application/json')) {
    const payload = await res.json();
    if (payload.status === 'playwright-missing') {
      hooks.onPlaywrightMissing?.(payload);
      return;
    }
    throw new Error(`unexpected json: ${JSON.stringify(payload)}`);
  }
  if (!ct.startsWith('text/event-stream')) {
    throw new Error(`unexpected content-type: ${ct}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('no response body');
  const decoder = new TextDecoder();
  let buf = '';
  let pptxBase64: string | null = null;

  // Anything inside this try MUST flow through the finally so the reader
  // is cancelled. Without that, an exception inside JSON.parse /
  // toToastProgress / the inner state machine leaves the underlying HTTP
  // connection open and pinned to the GC heap until the browser cleans
  // it up — observable as a hung backend on repeated failures.
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      while (true) {
        const idx = buf.indexOf('\n\n');
        if (idx < 0) break;
        const msg = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const eventLine = msg.split('\n').find((l) => l.startsWith('event: '));
        const dataLine = msg.split('\n').find((l) => l.startsWith('data: '));
        if (!eventLine || !dataLine) continue;
        const ev = eventLine.slice('event: '.length);
        const data = dataLine.slice('data: '.length);
        if (ev === 'progress') {
          const payload = JSON.parse(data) as {
            phase: ServerPhase;
            current: number;
            total: number;
          };
          hooks.onProgress?.(toToastProgress(payload.phase, payload.current, payload.total));
        } else if (ev === 'done') {
          pptxBase64 = data;
        } else if (ev === 'error') {
          // The server sends a JSON {kind, message}; surface the message
          // rather than the raw JSON blob.
          let message = data;
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.message === 'string') message = parsed.message;
          } catch {}
          throw new Error(message);
        }
      }
    }
  } finally {
    // cancel() returns a Promise; ignore failures (reader may already be
    // closed). The goal is to free the underlying connection promptly.
    void reader.cancel().catch(() => {});
  }

  if (!pptxBase64) throw new Error('stream ended without done event');

  const bytes = Uint8Array.from(atob(pptxBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  downloadBlob(blob, `${slideId}.pptx`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
