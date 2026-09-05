import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { clearThemeFromSlides } from '../../editing/slide-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { discoverThemes, fetchTheme, ThemeImportError, writeTheme } from '../../themes/import.ts';
import { buildThemeManifest, DEMO_EXTS, findThemeFiles } from '../../themes/scan.ts';
import { type ApiContext, json, readBody } from './context.ts';

// The GET routes exist so a running dev server serves the same theme URLs a
// built site does — letting `/themes/<id>` page links be imported directly,
// without first running `open-slide build`.

const STATUS_FOR_CODE: Record<ThemeImportError['code'], number> = {
  invalid: 400,
  forbidden: 403,
  'not-found': 404,
  network: 502,
};

// Keep the id part in sync with THEME_ID_RE (themes/import.ts) so every theme
// the importer accepts is also servable from the dev server.
const THEME_FILE_RE = /^([A-Za-z0-9][A-Za-z0-9_-]*)(\.md|\.demo\.(tsx|jsx|ts|js))$/;

const CONTENT_TYPES: Record<string, string> = {
  md: 'text/markdown; charset=utf-8',
  tsx: 'text/plain; charset=utf-8',
  jsx: 'text/plain; charset=utf-8',
  ts: 'text/plain; charset=utf-8',
  js: 'text/plain; charset=utf-8',
};

function registerThemeFileRoutes(server: ViteDevServer, ctx: ApiContext): void {
  // Mount under the resolved base so copied theme URLs (which carry BASE_URL)
  // resolve on the dev server exactly like they do on the built site.
  const base = server.config.base.replace(/\/+$/, '');
  server.middlewares.use(`${base}/themes`, async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const url = new URL(req.url ?? '/', 'http://local');

    try {
      const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (rel === 'index.json') {
        const manifest = await buildThemeManifest(ctx.themesRoot);
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.setHeader('cache-control', 'no-store');
        res.end(`${JSON.stringify(manifest, null, 2)}\n`);
        return;
      }

      const match = rel.match(THEME_FILE_RE);
      if (!match) return next();

      const file = path.join(ctx.themesRoot, rel);
      if (file !== path.join(ctx.themesRoot, path.basename(rel))) return next();

      const ext = (rel.split('.').pop() ?? '').toLowerCase();
      let buf: Buffer;
      try {
        buf = await fs.readFile(file);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return next();
        throw err;
      }
      res.statusCode = 200;
      res.setHeader('content-type', CONTENT_TYPES[ext] ?? 'text/plain; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
    } catch (err) {
      if (err instanceof URIError) {
        json(res, 400, { error: 'malformed path encoding' });
        return;
      }
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}

export function registerThemeRoutes(server: ViteDevServer, ctx: ApiContext): void {
  registerThemeFileRoutes(server, ctx);

  server.middlewares.use('/__themes', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    const deleteMatch = url.pathname.match(/^\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
      try {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = decodeURIComponent(deleteMatch[1]);
        // Resolve the id against the scanned file list rather than a path built
        // from user input — this both blocks traversal and accepts theme
        // filenames outside the import id grammar (e.g. "My Theme.md").
        const files = await findThemeFiles(ctx.themesRoot);
        const target = files.find((f) => path.basename(f, '.md') === id);
        if (!target) return json(res, 404, { error: 'theme not found' });

        await fs.rm(target, { force: true });
        await Promise.all(
          DEMO_EXTS.map((ext) =>
            fs.rm(path.join(ctx.themesRoot, `${id}.demo.${ext}`), { force: true }),
          ),
        );
        const clearedSlides = await clearThemeFromSlides(ctx.slidesRoot, id);
        return json(res, 200, { ok: true, id, clearedSlides });
      } catch (err) {
        if (err instanceof URIError) {
          return json(res, 400, { error: 'malformed path encoding' });
        }
        return json(res, 500, { error: String((err as Error).message ?? err) });
      }
    }

    if (method !== 'POST' || url.pathname !== '/import') return next();

    try {
      const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
      if (!requestCheck.ok) {
        return json(res, requestCheck.status, { error: requestCheck.error });
      }

      const body = (await readBody(req)) as {
        url?: unknown;
        id?: unknown;
        ids?: unknown;
        force?: unknown;
      };
      if (typeof body.url !== 'string' || body.url.length === 0) {
        return json(res, 400, { error: 'url is required' });
      }
      const id = typeof body.id === 'string' ? body.id : undefined;
      const ids = Array.isArray(body.ids)
        ? body.ids.filter((x): x is string => typeof x === 'string')
        : undefined;
      const force = body.force === true;

      const { origin, entries } = await discoverThemes(body.url, ctx.themeImportAllowedHosts);
      const wanted = id ? [id] : ids;
      // Mirror the CLI contract: importing several themes at once needs an
      // explicit selection, so a bare { url } against a multi-theme source
      // writes nothing and reports what's there instead.
      if (!wanted && entries.length > 1) {
        return json(res, 200, {
          ok: true,
          origin,
          discovered: entries.map((e) => ({ id: e.id, name: e.name, description: e.description })),
        });
      }
      const selected = wanted ? entries.filter((e) => wanted.includes(e.id)) : entries;
      if (selected.length === 0) {
        return json(res, 404, {
          error: wanted ? `theme(s) not found: ${wanted.join(', ')}` : 'no themes found',
        });
      }

      const written = [];
      for (const entry of selected) {
        const fetched = await fetchTheme(entry, ctx.themeImportAllowedHosts);
        written.push(await writeTheme(ctx.themesRoot, fetched, { force }));
      }

      return json(res, 200, { ok: true, origin, written });
    } catch (err) {
      if (err instanceof ThemeImportError) {
        return json(res, STATUS_FOR_CODE[err.code], { error: err.message, code: err.code });
      }
      return json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
