import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEdit, type EditOp, probeElementSharing } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody, resolveSlideEntryPath } from './context.ts';

// GET  /__edit/element-info   probeElementSharing — ?slideId&line&column
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
  edits?: Array<{ line?: number; column?: number; ops?: EditOp[] }>;
};

export function registerEditRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__edit', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    if (method === 'GET' && url.pathname === '/element-info') {
      try {
        const slideId = url.searchParams.get('slideId') ?? '';
        const line = Number(url.searchParams.get('line') ?? '');
        const columnRaw = Number(url.searchParams.get('column') ?? '0');
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!Number.isFinite(line) || line < 1) return json(res, 400, { error: 'invalid line' });

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const info = probeElementSharing(source, line, Number.isFinite(columnRaw) ? columnRaw : 0);
        if (!info) return json(res, 422, { error: 'no JSX element at location' });
        return json(res, 200, info);
      } catch (err) {
        return json(res, 500, { error: String((err as Error).message ?? err) });
      }
    }

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

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

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

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

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

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const original = source;
        const results: Array<{ ok: boolean; error?: string }> = [];
        for (const edit of body.edits) {
          if (!edit.line || edit.line < 1 || !Array.isArray(edit.ops)) {
            results.push({ ok: false, error: 'invalid edit' });
            continue;
          }
          const r = applyEdit(source, edit.line, edit.column ?? 0, edit.ops);
          if (r.ok) {
            source = r.source;
            results.push({ ok: true });
          } else {
            results.push({ ok: false, error: r.error });
          }
        }
        const changed = source !== original;
        if (changed) await fs.writeFile(file, source, 'utf8');
        return json(res, 200, { ok: true, changed, results });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
