import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { detectPackageManager, installCommand } from './pm-detect.ts';

export type RenderFn = (opts: {
  slideDir: string;
  onProgress?: (e: { phase: string; current: number; total: number }) => void;
}) => Promise<Buffer>;

export type HandleExportPptxOpts = {
  userCwd: string;
  body: { slideId?: unknown };
  res: ServerResponse;
  // Injectable seams (the route wrapper supplies the real implementations;
  // tests supply fakes). `probePlaywright` resolves false when Playwright (the
  // optional peer) or its Chromium binary is unavailable; `render` runs the
  // native export pipeline that ships inside @open-slide/core.
  probePlaywright: () => Promise<boolean>;
  render: RenderFn;
};

// The export engine itself is built into @open-slide/core — Playwright is the
// only thing the user has to install, so that is what the prompt offers.
const PLAYWRIGHT_PKG = 'playwright';

// POSIX-safe single-quote wrap: any inner ' becomes '\''.
function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

export async function handleExportPptx(opts: HandleExportPptxOpts): Promise<void> {
  const { userCwd, body, res, probePlaywright, render } = opts;

  const slideId = typeof body.slideId === 'string' ? body.slideId : '';
  if (!slideId) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'missing slideId' }));
    return;
  }

  // slideId is user-controlled; reject any value that, once joined under
  // `<userCwd>/slides/`, escapes that directory. path.resolve normalises
  // away `..`/`.` segments, and the resulting path must remain a strict
  // descendant of slidesRoot — otherwise a request body like
  // `{"slideId":"../../etc/passwd"}` could direct the engine at an
  // arbitrary directory on the dev's machine.
  const slidesRoot = path.resolve(userCwd, 'slides');
  const resolvedSlide = path.resolve(slidesRoot, slideId);
  const rel = path.relative(slidesRoot, resolvedSlide);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel === '') {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'invalid slideId' }));
    return;
  }

  // Preflight: Playwright is an optional peer dependency. When it (or its
  // Chromium binary) is missing, return a JSON prompt to install it BEFORE
  // committing to the SSE stream — the content-type can't change mid-response.
  const ready = await probePlaywright();
  if (!ready) {
    const pm = detectPackageManager(userCwd);
    const installCmd = installCommand(pm, PLAYWRIGHT_PKG);
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'playwright-missing',
        packageManager: pm.name,
        command: `cd ${shellQuote(userCwd)} && ${installCmd} && npx playwright install chromium`,
      }),
    );
    return;
  }

  const slideDir = resolvedSlide;
  res.statusCode = 200;
  res.setHeader('content-type', 'text/event-stream');
  res.setHeader('cache-control', 'no-cache');

  try {
    const buf = await render({
      slideDir,
      // Dev-server SSE: progress frames are tiny (~70 bytes) and far below the
      // socket high-water mark even for large decks, so res.write() is not
      // gated on a drain event here. The final base64 .pptx is one write below.
      onProgress: (p) => {
        res.write(`event: progress\ndata: ${JSON.stringify(p)}\n\n`);
      },
    });
    res.write(`event: done\ndata: ${buf.toString('base64')}\n\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.write(`event: error\ndata: ${JSON.stringify({ kind: 'unknown', message })}\n\n`);
  } finally {
    res.end();
  }
}
