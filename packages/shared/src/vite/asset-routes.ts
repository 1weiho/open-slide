import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import {
  ASSET_MAX_BYTES,
  assetCreatedAt,
  GLOBAL_SCOPE,
  mimeForFilename,
  resolveScopedAssetFile,
  resolveScopedAssetsDir,
  validateAssetName,
} from '../files/assets.ts';
import { validateMutationRequest } from '../http/request-guard.ts';
import { SLIDE_ID_RE } from '../slide-id.ts';
import { type ApiContext, json, readBody } from './api-context.ts';

export type AssetReferenceAdapter = {
  findAssetUsages: (source: string, assetPath: string) => number;
  findReferencedAssets: (source: string, assetPaths: string[]) => Set<string>;
  readSlideSources?: (ctx: ApiContext, slideId: string) => Promise<string[]>;
};

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.svelte', '.ts', '.tsx']);

async function readSourceTree(dir: string): Promise<string[]> {
  const sources: string[] = [];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return sources;
  }
  for (const entry of entries) {
    if (entry.name === 'assets' || entry.name.startsWith('.')) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sources.push(...(await readSourceTree(file)));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      try {
        sources.push(await fs.readFile(file, 'utf8'));
      } catch {}
    }
  }
  return sources;
}

async function defaultReadSlideSources(ctx: ApiContext, slideId: string): Promise<string[]> {
  if (!SLIDE_ID_RE.test(slideId)) return [];
  return readSourceTree(path.join(ctx.slidesRoot, slideId));
}

const defaultAssetReferenceAdapter: AssetReferenceAdapter = {
  findAssetUsages(source, assetPath) {
    let count = 0;
    let offset = 0;
    let match = source.indexOf(assetPath, offset);
    while (match !== -1) {
      count++;
      offset = match + assetPath.length;
      match = source.indexOf(assetPath, offset);
    }
    return count;
  },
  findReferencedAssets(source, assetPaths) {
    return new Set(assetPaths.filter((assetPath) => source.includes(assetPath)));
  },
};

// GET    /__assets/:scope                     list assets in slide or @global
// GET    /__assets/:scope/:file               serve raw asset bytes
// POST   /__assets/:scope/:file               upload (multipart raw body)
// PATCH  /__assets/:scope/:file               rename { name }
// DELETE /__assets/:scope/:file               delete
// GET    /__assets/:scope/:file/usages        count <img src={import}> references

export function registerAssetRoutes(
  server: ViteDevServer,
  ctx: ApiContext,
  adapter: AssetReferenceAdapter = defaultAssetReferenceAdapter,
): void {
  const readSlideSources = adapter.readSlideSources ?? defaultReadSlideSources;
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
          const sources = await readSlideSources(ctx, sid);
          const count = sources.reduce(
            (total, source) => total + adapter.findAssetUsages(source, assetPath),
            0,
          );
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

        let entries: string[];
        try {
          entries = await fs.readdir(scopedDir);
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            return json(res, 200, { assets: [] });
          }
          throw err;
        }

        const assets: Array<{
          name: string;
          size: number;
          createdAt: number;
          mtime: number;
          mime: string;
          url: string;
          unused: boolean;
        }> = [];
        for (const name of entries) {
          if (!validateAssetName(name)) continue;
          const stat = await fs.stat(path.join(scopedDir, name));
          if (!stat.isFile()) continue;
          assets.push({
            name,
            size: stat.size,
            createdAt: assetCreatedAt(stat.birthtimeMs, stat.mtimeMs),
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
            for (const source of await readSlideSources(ctx, sid)) {
              for (const p of adapter.findReferencedAssets(source, paths)) {
                const a = pathToAsset.get(p);
                if (a) a.unused = false;
              }
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
          const stat = await fs.stat(file);
          return json(res, 200, {
            ok: true,
            name: filename,
            size: stat.size,
            createdAt: assetCreatedAt(stat.birthtimeMs, stat.mtimeMs),
            mtime: stat.mtimeMs,
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

          const dest = resolveScopedAssetFile(
            ctx.slidesRoot,
            ctx.globalAssetsRoot,
            slideId,
            target,
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
}
