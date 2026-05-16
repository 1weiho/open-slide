import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import {
  ASSET_MAX_BYTES,
  GLOBAL_SCOPE,
  mimeForFilename,
  resolveScopedAssetFile,
  resolveScopedAssetsDir,
  validateAssetName,
} from './assets.ts';
import {
  b64urlEncode,
  findInsertion,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from './comments.ts';
import { applyEdit, type EditOp } from './edit-ops.ts';
import {
  FOLDER_ID_RE,
  type Folder,
  newFolderId,
  readManifest,
  validateIcon,
  validateName,
  writeManifest,
} from './folders.ts';
import { validateMutationRequest } from './request-guard.ts';
import { applyRevertAsset, findAssetUsages } from './revert-asset.ts';
import {
  duplicatePageInDefaultExportInSource,
  removePageFromDefaultExportInSource,
  reorderDefaultExportPagesInSource,
  reorderNotesArrayInSource,
  resolveSlideEntry,
  rmSlideDir,
  SLIDE_ID_RE,
  updateMetaTitleInSource,
  validateSlideName,
} from './slide-ops.ts';

type AddCommentBody = {
  slideId?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
};

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

type CreateFolderBody = { name?: unknown; icon?: unknown };
type PatchFolderBody = { name?: unknown; icon?: unknown };
type AssignFolderBody = { slideId?: unknown; folderId?: unknown };
type SlidePatchBody = { name?: unknown };

async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function resolveSlidePath(userCwd: string, slidesDir: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const full = path.resolve(slidesRoot, slideId, 'index.tsx');
  if (!full.startsWith(slidesRoot + path.sep)) return null;
  return full;
}

export type ApiPluginOptions = {
  userCwd: string;
  slidesDir?: string;
  assetsDir?: string;
};

export function apiPlugin(opts: ApiPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const assetsDir = opts.assetsDir ?? 'assets';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = path.join(slidesRoot, '.folders.json');

  return {
    name: 'open-slide:api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // Watchers: surface folder-manifest and asset-tree mutations as HMR
      // pings so the editor's panels can refresh without a full reload.
      server.watcher.add(manifestPath);
      server.watcher.on('change', (p) => {
        if (p === manifestPath) {
          server.ws.send({ type: 'custom', event: 'open-slide:files-changed' });
        }
      });

      server.watcher.add(globalAssetsRoot);
      const onAssetChange = (p: string) => {
        if (p.startsWith(globalAssetsRoot + path.sep) || p === globalAssetsRoot) {
          server.ws.send({
            type: 'custom',
            event: 'open-slide:assets-changed',
            data: { slideId: GLOBAL_SCOPE },
          });
          return;
        }
        if (!p.startsWith(slidesRoot + path.sep)) return;
        const rel = p.slice(slidesRoot.length + 1);
        const parts = rel.split(path.sep);
        if (parts.length < 3 || parts[1] !== 'assets') return;
        const slideId = parts[0];
        if (!SLIDE_ID_RE.test(slideId)) return;
        server.ws.send({
          type: 'custom',
          event: 'open-slide:assets-changed',
          data: { slideId },
        });
      };
      server.watcher.on('add', onAssetChange);
      server.watcher.on('change', onAssetChange);
      server.watcher.on('unlink', onAssetChange);

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
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
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
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
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

          // One read-modify-write per batch so a multi-element edit
          // session lands as a single HMR. Per-edit failures are
          // reported but don't abort the batch.
          if (url.pathname === '/batch') {
            const body = (await readBody(req)) as EditBatchBody;
            const slideId = body.slideId ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
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

      server.middlewares.use('/__comments', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/') {
            const slideId = url.searchParams.get('slideId') ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }
            return json(res, 200, { comments: parseMarkers(source) });
          }

          if (method === 'POST' && url.pathname === '/add') {
            const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
            if (!requestCheck.ok) {
              return json(res, requestCheck.status, { error: requestCheck.error });
            }
            const body = (await readBody(req)) as AddCommentBody;
            const slideId = body.slideId ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
            if (!body.text || typeof body.text !== 'string') {
              return json(res, 400, { error: 'missing text' });
            }

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const plan = findInsertion(source, body.line, body.column);
            if (!plan) {
              return json(res, 422, {
                error:
                  'could not find a JSX container around line ' +
                  `${body.line}. Try clicking a different element.`,
              });
            }

            const id = newCommentId();
            const ts = new Date().toISOString();
            const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
            const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

            const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
            await fs.writeFile(file, next, 'utf8');
            const markerLine = offsetToLine(next, plan.offset + 1);
            return json(res, 200, { id, line: markerLine });
          }

          if (method === 'DELETE' && url.pathname.startsWith('/')) {
            const requestCheck = validateMutationRequest(req);
            if (!requestCheck.ok) {
              return json(res, requestCheck.status, { error: requestCheck.error });
            }
            const id = url.pathname.slice(1);
            if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
            const slideId = url.searchParams.get('slideId') ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const lines = source.split('\n');
            const idRe = markerDeleteRegex(id);
            const hit = lines.findIndex((l) => idRe.test(l));
            if (hit === -1) return json(res, 404, { error: 'marker not found' });
            lines.splice(hit, 1);
            await fs.writeFile(file, lines.join('\n'), 'utf8');
            return json(res, 200, { ok: true });
          }

          next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });

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

            const entry = resolveSlideEntry(slidesRoot, slideId);
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
                error:
                  'could not reorder pages — order must be a permutation of the existing array',
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

            const entry = resolveSlideEntry(slidesRoot, slideId);
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
            if (updated !== source) {
              await fs.writeFile(entry, updated, 'utf8');
            }
            return json(res, 200, { ok: true, slideId, index: pageIndex });
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

            const entry = resolveSlideEntry(slidesRoot, slideId);
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
            const removed = await rmSlideDir(slidesRoot, slideId);
            if (!removed) return json(res, 404, { error: 'slide not found' });

            const manifest = await readManifest(manifestPath);
            delete manifest.assignments[slideId];
            await writeManifest(manifestPath, manifest);
            return json(res, 200, { ok: true });
          }

          return next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });

      server.middlewares.use('/__assets', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          const listMatch = url.pathname.match(/^\/([^/]+)\/?$/);
          const fileMatch = url.pathname.match(/^\/([^/]+)\/([^/]+)$/);
          const usagesMatch = url.pathname.match(/^\/([^/]+)\/([^/]+)\/usages$/);

          if (usagesMatch && method === 'GET') {
            const scope = usagesMatch[1];
            const filename = decodeURIComponent(usagesMatch[2]);
            if (!validateAssetName(filename)) return json(res, 400, { error: 'invalid path' });

            const isGlobal = scope === GLOBAL_SCOPE;
            const assetPath = isGlobal ? `@assets/${filename}` : `./assets/${filename}`;

            let slideIds: string[];
            if (isGlobal) {
              try {
                const entries = await fs.readdir(slidesRoot, { withFileTypes: true });
                slideIds = entries
                  .filter((e) => e.isDirectory() && SLIDE_ID_RE.test(e.name))
                  .map((e) => e.name);
              } catch {
                slideIds = [];
              }
            } else {
              if (!SLIDE_ID_RE.test(scope)) return json(res, 400, { error: 'invalid slideId' });
              slideIds = [scope];
            }

            const usages: Array<{ slideId: string; count: number }> = [];
            let totalCount = 0;
            for (const sid of slideIds) {
              const entry = resolveSlideEntry(slidesRoot, sid);
              if (!entry) continue;
              let source: string;
              try {
                source = await fs.readFile(entry, 'utf8');
              } catch {
                continue;
              }
              const count = findAssetUsages(source, assetPath);
              if (count > 0) {
                usages.push({ slideId: sid, count });
                totalCount += count;
              }
            }
            return json(res, 200, { usages, totalCount });
          }

          if (listMatch && method === 'GET') {
            const slideId = listMatch[1];
            const scopedDir = resolveScopedAssetsDir(slidesRoot, globalAssetsRoot, slideId);
            if (!scopedDir) return json(res, 400, { error: 'invalid slideId' });

            let entries: string[];
            try {
              entries = await fs.readdir(scopedDir);
            } catch (err) {
              if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                return json(res, 200, { assets: [] });
              }
              throw err;
            }

            const assets = [];
            for (const name of entries) {
              if (!validateAssetName(name)) continue;
              const stat = await fs.stat(path.join(scopedDir, name));
              if (!stat.isFile()) continue;
              assets.push({
                name,
                size: stat.size,
                mtime: stat.mtimeMs,
                mime: mimeForFilename(name),
                url: `/__assets/${slideId}/${encodeURIComponent(name)}`,
              });
            }
            assets.sort((a, b) => a.name.localeCompare(b.name));
            return json(res, 200, { assets });
          }

          if (fileMatch) {
            const slideId = fileMatch[1];
            const filename = decodeURIComponent(fileMatch[2]);
            const file = resolveScopedAssetFile(slidesRoot, globalAssetsRoot, slideId, filename);
            if (!file) return json(res, 400, { error: 'invalid path' });

            if (method === 'GET') {
              try {
                const buf = await fs.readFile(file);
                res.statusCode = 200;
                res.setHeader('content-type', mimeForFilename(filename));
                res.setHeader('cache-control', 'no-store');
                res.end(buf);
                return;
              } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                  return json(res, 404, { error: 'asset not found' });
                }
                throw err;
              }
            }

            if (method === 'POST') {
              const requestCheck = validateMutationRequest(req);
              if (!requestCheck.ok) {
                return json(res, requestCheck.status, { error: requestCheck.error });
              }
              const overwrite = url.searchParams.get('overwrite') === '1';
              const lenHeader = req.headers['content-length'];
              const len = typeof lenHeader === 'string' ? Number(lenHeader) : NaN;
              if (Number.isFinite(len) && len > ASSET_MAX_BYTES) {
                return json(res, 413, { error: 'file too large' });
              }

              if (!overwrite) {
                try {
                  await fs.access(file);
                  return json(res, 409, { error: 'asset exists' });
                } catch {
                  // fall through — file does not exist, OK to write
                }
              }

              const scopedDir = resolveScopedAssetsDir(slidesRoot, globalAssetsRoot, slideId);
              if (!scopedDir) return json(res, 400, { error: 'invalid slideId' });
              await fs.mkdir(scopedDir, { recursive: true });

              const chunks: Buffer[] = [];
              let total = 0;
              let oversized = false;
              await new Promise<void>((resolve, reject) => {
                req.on('data', (c: Buffer) => {
                  total += c.length;
                  if (total > ASSET_MAX_BYTES) {
                    oversized = true;
                    req.destroy();
                    return;
                  }
                  chunks.push(c);
                });
                req.on('end', () => resolve());
                req.on('error', reject);
              });
              if (oversized) return json(res, 413, { error: 'file too large' });

              await fs.writeFile(file, Buffer.concat(chunks));
              return json(res, 200, {
                ok: true,
                name: filename,
                size: total,
                mime: mimeForFilename(filename),
                url: `/__assets/${slideId}/${encodeURIComponent(filename)}`,
              });
            }

            if (method === 'PATCH') {
              const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
              if (!requestCheck.ok) {
                return json(res, requestCheck.status, { error: requestCheck.error });
              }
              const body = (await readBody(req)) as { name?: unknown };
              const target = validateAssetName(body.name);
              if (!target) return json(res, 400, { error: 'invalid name' });
              if (target === filename) return json(res, 200, { ok: true, name: filename });

              const dest = resolveScopedAssetFile(slidesRoot, globalAssetsRoot, slideId, target);
              if (!dest) return json(res, 400, { error: 'invalid name' });

              try {
                await fs.access(dest);
                return json(res, 409, { error: 'target exists' });
              } catch {
                // OK
              }

              try {
                await fs.rename(file, dest);
              } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                  return json(res, 404, { error: 'asset not found' });
                }
                throw err;
              }
              return json(res, 200, { ok: true, name: target });
            }

            if (method === 'DELETE') {
              const requestCheck = validateMutationRequest(req);
              if (!requestCheck.ok) {
                return json(res, requestCheck.status, { error: requestCheck.error });
              }
              try {
                await fs.unlink(file);
              } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                  return json(res, 404, { error: 'asset not found' });
                }
                throw err;
              }
              return json(res, 200, { ok: true });
            }
          }

          return next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });

      server.middlewares.use('/__svgl', async (req, res, next) => {
        const reqUrl = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';
        if (method !== 'GET') return next();

        try {
          let target: string | null = null;
          if (reqUrl.pathname === '/search') {
            const params = new URLSearchParams();
            const q = reqUrl.searchParams.get('q');
            const limit = reqUrl.searchParams.get('limit');
            if (q) params.set('search', q);
            if (limit) params.set('limit', limit);
            const qs = params.toString();
            target = `https://api.svgl.app/${qs ? `?${qs}` : ''}`;
          } else if (reqUrl.pathname === '/svg') {
            const u = reqUrl.searchParams.get('u');
            if (!u) return json(res, 400, { error: 'missing u' });
            let parsed: URL;
            try {
              parsed = new URL(u);
            } catch {
              return json(res, 400, { error: 'invalid u' });
            }
            if (parsed.protocol !== 'https:') return json(res, 400, { error: 'https only' });
            const host = parsed.hostname.toLowerCase();
            if (host !== 'svgl.app' && !host.endsWith('.svgl.app')) {
              return json(res, 400, { error: 'host not allowed' });
            }
            target = parsed.toString();
          } else {
            return next();
          }

          const upstream = await fetch(target);
          const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';
          res.statusCode = upstream.status;
          res.setHeader('content-type', ct);
          res.setHeader('cache-control', 'no-store');
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.end(buf);
        } catch (err) {
          json(res, 502, { error: String((err as Error).message ?? err) });
        }
      });

      server.middlewares.use('/__folders', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/') {
            const manifest = await readManifest(manifestPath);
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

            const manifest = await readManifest(manifestPath);
            const folder: Folder = { id: newFolderId(), name, icon };
            manifest.folders.push(folder);
            await writeManifest(manifestPath, manifest);
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

            const manifest = await readManifest(manifestPath);
            if (folderId && !manifest.folders.some((f) => f.id === folderId)) {
              return json(res, 404, { error: 'folder not found' });
            }
            if (folderId === null) {
              delete manifest.assignments[slideId];
            } else {
              manifest.assignments[slideId] = folderId;
            }
            await writeManifest(manifestPath, manifest);
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
              const manifest = await readManifest(manifestPath);
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
              await writeManifest(manifestPath, manifest);
              return json(res, 200, folder);
            }

            if (method === 'DELETE') {
              const requestCheck = validateMutationRequest(req);
              if (!requestCheck.ok) {
                return json(res, requestCheck.status, { error: requestCheck.error });
              }
              const manifest = await readManifest(manifestPath);
              const before = manifest.folders.length;
              manifest.folders = manifest.folders.filter((f) => f.id !== id);
              if (manifest.folders.length === before) {
                return json(res, 404, { error: 'folder not found' });
              }
              for (const [slideId, folderId] of Object.entries(manifest.assignments)) {
                if (folderId === id) delete manifest.assignments[slideId];
              }
              await writeManifest(manifestPath, manifest);
              return json(res, 200, { ok: true });
            }
          }

          next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });
    },
  };
}
