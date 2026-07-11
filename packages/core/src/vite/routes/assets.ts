import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { findAssetUsages, findReferencedAssets } from '../../editing/revert-asset.ts';
import { resolveSlideEntry, SLIDE_ID_RE } from '../../editing/slide-ops.ts';
import {
  ASSET_MAX_BYTES,
  GLOBAL_SCOPE,
  listAssetFilesRecursive,
  mimeForFilename,
  resolveScopedAssetFile,
  resolveScopedAssetsDir,
  validateAssetName,
  validateAssetPath,
} from '../../files/assets.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody } from './context.ts';

// GET    /__assets/:scope                     list assets in slide or @global
// GET    /__assets/:scope/:file               serve raw asset bytes
// POST   /__assets/:scope/:file               upload (multipart raw body)
// PATCH  /__assets/:scope/:file               rename { name }
// DELETE /__assets/:scope/:file               delete
// GET    /__assets/:scope/:file/usages        count <img src={import}> references

export function registerAssetRoutes(server: ViteDevServer, ctx: ApiContext): void {
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
        if (!validateAssetPath(filename)) return json(res, 400, { error: 'invalid path' });

        const isGlobal = scope === GLOBAL_SCOPE;
        const assetPath = isGlobal ? `@assets/${filename}` : `./assets/${filename}`;

        let slideIds: string[];
        if (isGlobal) {
          try {
            const entries = await fs.readdir(ctx.slidesRoot, { withFileTypes: true });
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
          const entry = resolveSlideEntry(ctx.slidesRoot, sid);
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
        const scopedDir = resolveScopedAssetsDir(ctx.slidesRoot, ctx.globalAssetsRoot, slideId);
        if (!scopedDir) return json(res, 400, { error: 'invalid slideId' });

        const entries = await listAssetFilesRecursive(scopedDir);
        if (entries === null) return json(res, 200, { assets: [] });

        const assets: Array<{
          name: string;
          size: number;
          mtime: number;
          mime: string;
          url: string;
          unused: boolean;
        }> = [];
        for (const name of entries) {
          if (!validateAssetPath(name)) continue;
          const stat = await fs.stat(path.join(scopedDir, name));
          if (!stat.isFile()) continue;
          assets.push({
            name,
            size: stat.size,
            mtime: stat.mtimeMs,
            mime: mimeForFilename(name),
            url: `/__assets/${slideId}/${encodeURIComponent(name)}`,
            unused: true,
          });
        }
        assets.sort((a, b) => a.name.localeCompare(b.name));

        if (assets.length > 0) {
          const isGlobal = slideId === GLOBAL_SCOPE;
          let scanIds: string[];
          if (isGlobal) {
            try {
              const dirs = await fs.readdir(ctx.slidesRoot, { withFileTypes: true });
              scanIds = dirs
                .filter((e) => e.isDirectory() && SLIDE_ID_RE.test(e.name))
                .map((e) => e.name);
            } catch {
              scanIds = [];
            }
          } else {
            scanIds = SLIDE_ID_RE.test(slideId) ? [slideId] : [];
          }
          const paths = assets.map((a) => (isGlobal ? `@assets/${a.name}` : `./assets/${a.name}`));
          const pathToAsset = new Map(paths.map((p, i) => [p, assets[i]]));
          for (const sid of scanIds) {
            const entry = resolveSlideEntry(ctx.slidesRoot, sid);
            if (!entry) continue;
            let source: string;
            try {
              source = await fs.readFile(entry, 'utf8');
            } catch {
              continue;
            }
            for (const p of findReferencedAssets(source, paths)) {
              const a = pathToAsset.get(p);
              if (a) a.unused = false;
            }
          }
        }

        return json(res, 200, { assets });
      }

      if (fileMatch) {
        const slideId = fileMatch[1];
        const filename = decodeURIComponent(fileMatch[2]);
        const file = resolveScopedAssetFile(
          ctx.slidesRoot,
          ctx.globalAssetsRoot,
          slideId,
          filename,
        );
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

          const scopedDir = resolveScopedAssetsDir(ctx.slidesRoot, ctx.globalAssetsRoot, slideId);
          if (!scopedDir) return json(res, 400, { error: 'invalid slideId' });
          await fs.mkdir(path.dirname(file), { recursive: true });

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
          // Rename in place: a nested asset keeps its directory.
          const slash = filename.lastIndexOf('/');
          const targetPath = slash >= 0 ? `${filename.slice(0, slash + 1)}${target}` : target;
          if (targetPath === filename) return json(res, 200, { ok: true, name: filename });

          const dest = resolveScopedAssetFile(
            ctx.slidesRoot,
            ctx.globalAssetsRoot,
            slideId,
            targetPath,
          );
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
          return json(res, 200, { ok: true, name: targetPath });
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
}
