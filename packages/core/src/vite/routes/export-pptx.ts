import fs from 'node:fs';
import type { ViteDevServer } from 'vite';
import { renderSlideToPptx } from '../pptx/index.ts';
import { type ApiContext, readBody } from './context.ts';
import { handleExportPptx } from './export-pptx-handler.ts';

// POST /__os/api/export/pptx   { slideId }
//
// Renders a slide deck to an editable .pptx using the engine bundled inside
// @open-slide/core. The engine measures the laid-out DOM with Playwright
// (Chromium), which is an OPTIONAL peer dependency — see probePlaywright.

// Returns false when Playwright (the optional peer) or its Chromium binary is
// not available, so the handler can prompt the user to install it instead of
// crashing the export. Cheap: it resolves the executable path and stats it
// rather than launching a browser.
async function probePlaywright(): Promise<boolean> {
  try {
    const { chromium } = await import('playwright');
    const exe = chromium.executablePath();
    return typeof exe === 'string' && exe.length > 0 && fs.existsSync(exe);
  } catch {
    // Missing package (ERR_MODULE_NOT_FOUND) or any resolution failure → treat
    // as unavailable and let the handler surface the install prompt.
    return false;
  }
}

export function registerExportPptxRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__os/api/export/pptx', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'POST') return next();

    let body: { slideId?: unknown } = {};
    try {
      body = (await readBody(req)) as { slideId?: unknown };
    } catch {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ error: 'invalid json body' }));
    }

    await handleExportPptx({
      userCwd: ctx.userCwd,
      body,
      probePlaywright,
      render: (opts) => renderSlideToPptx({ slideDir: opts.slideDir, onProgress: opts.onProgress }),
      res,
    });
  });
}
