import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEditBatch, type BatchEdit } from '../../editing/batch-edit.ts';
import { applyEdit, type EditOp } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// POST /__edit                applyEdit({ slideId, line, column, ops })
// POST /__edit/revert-asset   applyRevertAsset({ slideId, assetPath })
// POST /__edit/batch          applyEdit × N — single FS write per request

type EditBody = {
  slideId?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};

type EditBatchBody = {
  slideId?: string;
  edits?: BatchEdit[];
};

export function registerEditRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__edit', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    if (method !== 'POST') return next();
    const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
    if (!requestCheck.ok) return json(res, requestCheck.status, { error: requestCheck.error });

    try {
      if (url.pathname === '/') {
        const body = (await readBody(req)) as EditBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!Array.isArray(body.ops)) return json(res, 400, { error: 'missing ops' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyEdit(source, body.line, body.column ?? 0, body.ops);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
      }

      if (url.pathname === '/revert-asset') {
        const body = (await readBody(req)) as { slideId?: string; assetPath?: string };
        const slideId = body.slideId ?? '';
        const assetPath = body.assetPath;
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (typeof assetPath !== 'string' || !assetPath) {
          return json(res, 400, { error: 'missing assetPath' });
        }
        if (!assetPath.startsWith('./assets/') && !assetPath.startsWith('@assets/')) {
          return json(res, 400, { error: 'asset path must start with ./assets/ or @assets/' });
        }

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyRevertAsset(source, assetPath);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
      }

      // One read-modify-write per batch so a multi-element edit session
      // lands as a single HMR. Per-edit failures are reported but don't
      // abort the batch.
      if (url.pathname === '/batch') {
        const body = (await readBody(req)) as EditBatchBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const { source: updated, results } = applyEditBatch(source, body.edits);
        const changed = updated !== source;
        if (changed) await fs.writeFile(file, updated, 'utf8');
        return json(res, 200, { ok: true, changed, results });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
