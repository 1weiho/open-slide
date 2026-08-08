import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import {
  duplicateNotesElementInSource,
  duplicatePageInDefaultExportInSource,
  duplicateSlideDir,
  removeNotesElementInSource,
  removePageFromDefaultExportInSource,
  reorderDefaultExportPagesInSource,
  reorderNotesArrayInSource,
  resolveSlideEntry,
  rmSlideDir,
  SLIDE_ID_RE,
  updateMetaTitleInSource,
  validateSlideName,
} from '../../editing/slide-ops.ts';
import { readManifest, writeManifest } from '../../files/folders.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody } from './context.ts';

// PUT    /__slides/:id/reorder            reorder pages { order: number[] }
// DELETE /__slides/:id/pages/:i           remove page
// POST   /__slides/:id/pages/:i/duplicate duplicate page
// POST   /__slides/:id/duplicate          duplicate slide directory { newId? }
// PATCH  /__slides/:id                    rename slide (writes meta.title)
// DELETE /__slides/:id                    delete slide directory + folder assignment

type DuplicateSlideBody = { newId?: unknown };
type SlidePatchBody = { name?: unknown };

export function registerSlideRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__slides', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      const reorderMatch = url.pathname.match(/^\/([^/]+)\/reorder$/);
      if (reorderMatch && method === 'PUT') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const slideId = reorderMatch[1];
        if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });

        const body = (await readBody(req)) as { order?: unknown };
        if (!Array.isArray(body.order)) return json(res, 400, { error: 'invalid order' });
        const order: number[] = [];
        for (const v of body.order) {
          if (!Number.isInteger(v)) return json(res, 400, { error: 'invalid order' });
          order.push(v as number);
        }

        const entry = resolveSlideEntry(ctx.slidesRoot, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });

        let source: string;
        try {
          source = await fs.readFile(entry, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const reordered = reorderDefaultExportPagesInSource(source, order);
        if (reordered === null) {
          return json(res, 422, {
            error: 'could not reorder pages — order must be a permutation of the existing array',
          });
        }
        const withNotes = reorderNotesArrayInSource(reordered, order);
        if (withNotes === null) {
          return json(res, 422, {
            error: 'could not reorder pages — `notes` export has an unexpected shape',
          });
        }
        if (withNotes !== source) {
          await fs.writeFile(entry, withNotes, 'utf8');
        }
        return json(res, 200, { ok: true, slideId, order });
      }

      const pageOpMatch = url.pathname.match(/^\/([^/]+)\/pages\/(\d+)(?:\/([a-z]+))?$/);
      if (pageOpMatch) {
        const slideId = pageOpMatch[1];
        const pageIndex = Number.parseInt(pageOpMatch[2], 10);
        const op = pageOpMatch[3];
        if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });
        if (!Number.isInteger(pageIndex) || pageIndex < 0)
          return json(res, 400, { error: 'invalid page index' });

        const isDelete = method === 'DELETE' && !op;
        const isDuplicate = method === 'POST' && op === 'duplicate';
        if (!isDelete && !isDuplicate) return next();
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }

        const entry = resolveSlideEntry(ctx.slidesRoot, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });

        let source: string;
        try {
          source = await fs.readFile(entry, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const updated = isDelete
          ? removePageFromDefaultExportInSource(source, pageIndex)
          : duplicatePageInDefaultExportInSource(source, pageIndex);
        if (updated === null) {
          return json(res, 422, {
            error: isDelete
              ? 'could not delete page — index out of range or default export is not an array'
              : 'could not duplicate page — index out of range or default export is not an array',
          });
        }
        const withNotes = isDelete
          ? removeNotesElementInSource(updated, pageIndex)
          : duplicateNotesElementInSource(updated, pageIndex);
        if (withNotes === null) {
          return json(res, 422, {
            error: isDelete
              ? 'could not delete page — `notes` export has an unexpected shape'
              : 'could not duplicate page — `notes` export has an unexpected shape',
          });
        }
        if (withNotes !== source) {
          await fs.writeFile(entry, withNotes, 'utf8');
        }
        return json(res, 200, { ok: true, slideId, index: pageIndex });
      }

      const duplicateMatch = url.pathname.match(/^\/([^/]+)\/duplicate$/);
      if (duplicateMatch && method === 'POST') {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const slideId = duplicateMatch[1];
        if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });

        const body = (await readBody(req)) as DuplicateSlideBody;
        if (body.newId !== undefined && typeof body.newId !== 'string') {
          return json(res, 400, { error: 'invalid newId' });
        }

        const duplicated = await duplicateSlideDir(ctx.slidesRoot, slideId, body.newId);
        if (!duplicated.ok) return json(res, duplicated.status, { error: duplicated.error });

        const manifest = await readManifest(ctx.manifestPath);
        const folderId = manifest.assignments[slideId];
        if (folderId) {
          manifest.assignments[duplicated.slideId] = folderId;
          await writeManifest(ctx.manifestPath, manifest);
        }
        return json(res, 200, { ok: true, slideId: duplicated.slideId });
      }

      const idMatch = url.pathname.match(/^\/([^/]+)$/);
      if (!idMatch) return next();
      const slideId = idMatch[1];
      if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });

      if (method === 'PATCH') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as SlidePatchBody;
        const name = validateSlideName(body.name);
        if (!name) return json(res, 400, { error: 'invalid name' });

        const entry = resolveSlideEntry(ctx.slidesRoot, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });

        let source: string;
        try {
          source = await fs.readFile(entry, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const updated = updateMetaTitleInSource(source, name);
        if (updated === null) {
          return json(res, 422, {
            error: 'could not locate a safe place to write meta.title in index.tsx',
          });
        }
        if (updated !== source) {
          await fs.writeFile(entry, updated, 'utf8');
        }
        // The TSX edit lands through Vite's normal HMR pipeline, but the
        // React state holding `slide.meta` in the editor won't re-fetch on
        // its own — tell every client to refresh so the new title shows up.
        server.ws.send({ type: 'full-reload' });
        return json(res, 200, { ok: true, slideId, name });
      }

      if (method === 'DELETE') {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const removed = await rmSlideDir(ctx.slidesRoot, slideId);
        if (!removed) return json(res, 404, { error: 'slide not found' });

        const manifest = await readManifest(ctx.manifestPath);
        delete manifest.assignments[slideId];
        await writeManifest(ctx.manifestPath, manifest);
        return json(res, 200, { ok: true });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
