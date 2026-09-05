import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEdit, type EditOp } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { resolveSlideSourceFile } from '../../editing/slide-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// POST /__edit                applyEdit({ slideId, file?, line, column, ops })
// POST /__edit/revert-asset   applyRevertAsset({ slideId, assetPath })
// POST /__edit/batch          applyEdit x N, one FS write per source file

type EditBody = {
  slideId?: string;
  file?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};

type BatchEdit = { file?: string; line?: number; column?: number; ops?: EditOp[] };

type EditBatchBody = {
  slideId?: string;
  edits?: BatchEdit[];
};

function resolveEditFile(ctx: ApiContext, slideId: string, rel?: string): string | null {
  return resolveSlideSourceFile(ctx.slidesRoot, slideId, rel);
}

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
        if (body.file !== undefined && typeof body.file !== 'string') {
          return json(res, 400, { error: 'invalid file' });
        }
        const file = resolveEditFile(ctx, slideId, body.file);
        if (!file) return json(res, 400, { error: body.file ? 'invalid file' : 'invalid slideId' });
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
        if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

        const results: Array<{ ok: boolean; error?: string }> = Array.from(
          { length: body.edits.length },
          () => ({ ok: false, error: 'invalid edit' }),
        );
        const groups = new Map<string, Array<{ index: number; edit: BatchEdit }>>();
        for (let i = 0; i < body.edits.length; i++) {
          const edit = body.edits[i];
          if (edit == null || typeof edit !== 'object') continue;
          if (!edit.line || edit.line < 1 || !Array.isArray(edit.ops)) continue;
          if (edit.file !== undefined && typeof edit.file !== 'string') {
            results[i] = { ok: false, error: 'invalid file' };
            continue;
          }
          const abs = resolveEditFile(ctx, slideId, edit.file);
          if (!abs) {
            results[i] = { ok: false, error: edit.file ? 'invalid file' : 'invalid slideId' };
            continue;
          }
          const group = groups.get(abs);
          if (group) group.push({ index: i, edit });
          else groups.set(abs, [{ index: i, edit }]);
        }

        if (groups.size === 0) {
          const slideOk = resolveEditFile(ctx, slideId);
          if (!slideOk) return json(res, 400, { error: 'invalid slideId' });
          return json(res, 200, { ok: true, changed: false, results });
        }

        let changed = false;
        for (const [file, group] of groups) {
          const source = await readSlideSource(file);
          if (source === null) {
            for (const { index } of group) {
              results[index] = { ok: false, error: 'slide not found' };
            }
            continue;
          }
          let next = source;
          for (const { index, edit } of group) {
            const r = applyEdit(next, edit.line as number, edit.column ?? 0, edit.ops as EditOp[]);
            if (r.ok) {
              next = r.source;
              results[index] = { ok: true };
            } else {
              results[index] = { ok: false, error: r.error };
            }
          }
          if (next !== source) {
            await fs.writeFile(file, next, 'utf8');
            changed = true;
          }
        }
        return json(res, 200, { ok: true, changed, results });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
