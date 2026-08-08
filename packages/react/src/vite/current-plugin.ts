import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { SLIDE_ID_RE } from '../editing/slide-ops.ts';

const TEXT_SNIPPET_MAX = 120;

export type CurrentPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

type IncomingPayload = {
  slideId?: unknown;
  pageIndex?: unknown;
  totalPages?: unknown;
  slideTitle?: unknown;
  view?: unknown;
  selection?: unknown;
};

type IncomingSelection = {
  line?: unknown;
  column?: unknown;
  tagName?: unknown;
  text?: unknown;
};

type Selection = {
  line: number;
  column: number;
  tagName: string;
  text: string;
};

type Cached = {
  slideId: string;
  pageIndex: number;
  pageNumber: number;
  totalPages: number;
  slideTitle: string;
  view: 'slides' | 'assets';
  pagePath: string;
  selection: Selection | null;
};

function parseSelection(raw: unknown): Selection | null {
  if (raw == null || typeof raw !== 'object') return null;
  const sel = raw as IncomingSelection;
  if (typeof sel.line !== 'number' || !Number.isFinite(sel.line)) return null;
  if (typeof sel.column !== 'number' || !Number.isFinite(sel.column)) return null;
  const tagName =
    typeof sel.tagName === 'string' ? sel.tagName.toLowerCase().slice(0, 32) : 'unknown';
  const text =
    typeof sel.text === 'string'
      ? sel.text.replace(/\s+/g, ' ').trim().slice(0, TEXT_SNIPPET_MAX)
      : '';
  return {
    line: Math.max(1, Math.floor(sel.line)),
    column: Math.max(0, Math.floor(sel.column)),
    tagName,
    text,
  };
}

export function currentPlugin(opts: CurrentPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const outDir = path.join(userCwd, 'node_modules', '.open-slide');
  const outFile = path.join(outDir, 'current.json');
  const tmpFile = `${outFile}.tmp`;

  let cached: Cached | null = null;

  return {
    name: 'open-slide:current',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.ws.on('open-slide:current', async (raw: IncomingPayload) => {
        const next: Cached = cached
          ? { ...cached }
          : {
              slideId: '',
              pageIndex: 0,
              pageNumber: 1,
              totalPages: 1,
              slideTitle: '',
              view: 'slides',
              pagePath: '',
              selection: null,
            };

        if (typeof raw?.slideId === 'string') {
          if (!SLIDE_ID_RE.test(raw.slideId)) return;

          const totalPages =
            typeof raw.totalPages === 'number' &&
            Number.isFinite(raw.totalPages) &&
            raw.totalPages > 0
              ? Math.floor(raw.totalPages)
              : 1;
          const rawIndex =
            typeof raw.pageIndex === 'number' && Number.isFinite(raw.pageIndex)
              ? Math.floor(raw.pageIndex)
              : 0;
          const pageIndex = Math.max(0, Math.min(totalPages - 1, rawIndex));
          const slideTitle = typeof raw.slideTitle === 'string' ? raw.slideTitle : raw.slideId;
          const view = raw.view === 'assets' ? 'assets' : 'slides';
          const pagePath = path.join(slidesDir, raw.slideId, 'index.tsx').split(path.sep).join('/');

          if (cached?.slideId !== raw.slideId || cached?.pageIndex !== pageIndex) {
            next.selection = null;
          }

          next.slideId = raw.slideId;
          next.pageIndex = pageIndex;
          next.pageNumber = pageIndex + 1;
          next.totalPages = totalPages;
          next.slideTitle = slideTitle;
          next.view = view;
          next.pagePath = pagePath;
        }

        if ('selection' in raw) {
          next.selection = parseSelection(raw.selection);
        }

        if (!next.slideId) return;

        cached = next;

        const body = { ...next, updatedAt: new Date().toISOString() };
        try {
          await fs.mkdir(outDir, { recursive: true });
          await fs.writeFile(tmpFile, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
          await fs.rename(tmpFile, outFile);
        } catch {
          // Best-effort: a transient FS error here shouldn't crash the dev server.
        }
      });
    },
  };
}
