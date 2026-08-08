import type { ViteDevServer } from 'vite';
import { SLIDE_ID_RE } from '../../editing/slide-ops.ts';
import {
  FOLDER_ID_RE,
  type Folder,
  newFolderId,
  readManifest,
  validateIcon,
  validateName,
  validateReorder,
  writeManifest,
} from '../../files/folders.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody } from './context.ts';

// GET    /__folders            list manifest
// POST   /__folders            create folder { name, icon }
// PUT    /__folders/assign     assign slide to folder { slideId, folderId | null }
// PUT    /__folders/reorder    reorder folders { ids: string[] } (permutation)
// PATCH  /__folders/:id        rename / re-icon folder { name?, icon? }
// DELETE /__folders/:id        delete folder + drop its assignments

type CreateFolderBody = { name?: unknown; icon?: unknown };
type PatchFolderBody = { name?: unknown; icon?: unknown };
type AssignFolderBody = { slideId?: unknown; folderId?: unknown };
type ReorderFoldersBody = { ids?: unknown };

export function registerFolderRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__folders', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const manifest = await readManifest(ctx.manifestPath);
        return json(res, 200, manifest);
      }

      if (method === 'POST' && url.pathname === '/') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as CreateFolderBody;
        const name = validateName(body.name);
        if (!name) return json(res, 400, { error: 'invalid name' });
        const icon = validateIcon(body.icon);
        if (!icon) return json(res, 400, { error: 'invalid icon' });

        const manifest = await readManifest(ctx.manifestPath);
        const folder: Folder = { id: newFolderId(), name, icon };
        manifest.folders.push(folder);
        await writeManifest(ctx.manifestPath, manifest);
        return json(res, 200, folder);
      }

      if (method === 'PUT' && url.pathname === '/assign') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AssignFolderBody;
        if (typeof body.slideId !== 'string' || !SLIDE_ID_RE.test(body.slideId)) {
          return json(res, 400, { error: 'invalid slideId' });
        }
        const slideId = body.slideId;
        let folderId: string | null;
        if (body.folderId === null) {
          folderId = null;
        } else if (typeof body.folderId === 'string' && FOLDER_ID_RE.test(body.folderId)) {
          folderId = body.folderId;
        } else {
          return json(res, 400, { error: 'invalid folderId' });
        }

        const manifest = await readManifest(ctx.manifestPath);
        if (folderId && !manifest.folders.some((f) => f.id === folderId)) {
          return json(res, 404, { error: 'folder not found' });
        }
        if (folderId === null) {
          delete manifest.assignments[slideId];
        } else {
          manifest.assignments[slideId] = folderId;
        }
        await writeManifest(ctx.manifestPath, manifest);
        return json(res, 200, { ok: true });
      }

      if (method === 'PUT' && url.pathname === '/reorder') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as ReorderFoldersBody;
        const manifest = await readManifest(ctx.manifestPath);
        const ids = validateReorder(body.ids, manifest.folders);
        if (!ids) return json(res, 400, { error: 'invalid ids' });
        const byId = new Map(manifest.folders.map((f) => [f.id, f]));
        manifest.folders = ids.map((id) => byId.get(id) as Folder);
        await writeManifest(ctx.manifestPath, manifest);
        return json(res, 200, { ok: true });
      }

      const idMatch = url.pathname.match(/^\/([^/]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        if (!FOLDER_ID_RE.test(id)) return json(res, 400, { error: 'invalid id' });

        if (method === 'PATCH') {
          const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
          if (!requestCheck.ok) {
            return json(res, requestCheck.status, { error: requestCheck.error });
          }
          const body = (await readBody(req)) as PatchFolderBody;
          const manifest = await readManifest(ctx.manifestPath);
          const folder = manifest.folders.find((f) => f.id === id);
          if (!folder) return json(res, 404, { error: 'folder not found' });

          if (body.name !== undefined) {
            const name = validateName(body.name);
            if (!name) return json(res, 400, { error: 'invalid name' });
            folder.name = name;
          }
          if (body.icon !== undefined) {
            const icon = validateIcon(body.icon);
            if (!icon) return json(res, 400, { error: 'invalid icon' });
            folder.icon = icon;
          }
          await writeManifest(ctx.manifestPath, manifest);
          return json(res, 200, folder);
        }

        if (method === 'DELETE') {
          const requestCheck = validateMutationRequest(req);
          if (!requestCheck.ok) {
            return json(res, requestCheck.status, { error: requestCheck.error });
          }
          const manifest = await readManifest(ctx.manifestPath);
          const before = manifest.folders.length;
          manifest.folders = manifest.folders.filter((f) => f.id !== id);
          if (manifest.folders.length === before) {
            return json(res, 404, { error: 'folder not found' });
          }
          for (const [slideId, folderId] of Object.entries(manifest.assignments)) {
            if (folderId === id) delete manifest.assignments[slideId];
          }
          await writeManifest(ctx.manifestPath, manifest);
          return json(res, 200, { ok: true });
        }
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
