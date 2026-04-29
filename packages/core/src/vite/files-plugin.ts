import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';

const FOLDER_ID_RE = /^f-[a-f0-9]{8}$/;
const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: explicit control-char block list for filename safety
const ASSET_FORBIDDEN_RE = /[\x00-\x1F\x7F/\\:*?"<>|]/;
const ASSET_MAX_BYTES = 25 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  json: 'application/json',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
};

export function mimeForFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  const ext = name.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export function validateAssetName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 120) return null;
  // No path separators, control chars, or characters Windows/macOS can't store.
  if (ASSET_FORBIDDEN_RE.test(trimmed)) return null;
  // Block leading dots / tildes (hidden files, home expansion) and any `..` segment.
  if (trimmed.startsWith('.') || trimmed.startsWith('~')) return null;
  if (trimmed === '..' || trimmed.split(/[/\\]/).includes('..')) return null;
  // Require an extension so authors get sensible MIME / dev-server behavior.
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0 || dot === trimmed.length - 1) return null;
  return trimmed;
}

export type FolderIcon = { type: 'emoji'; value: string } | { type: 'color'; value: string };

export type Folder = {
  id: string;
  name: string;
  icon: FolderIcon;
};

export type FoldersManifest = {
  folders: Folder[];
  assignments: Record<string, string>;
};

type CreateBody = { name?: unknown; icon?: unknown };
type PatchBody = { name?: unknown; icon?: unknown };
type AssignBody = { slideId?: unknown; folderId?: unknown };
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

function emptyManifest(): FoldersManifest {
  return { folders: [], assignments: {} };
}

async function readManifest(file: string): Promise<FoldersManifest> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoldersManifest>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? (parsed.assignments as Record<string, string>)
          : {},
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyManifest();
    throw err;
  }
}

async function writeManifest(file: string, manifest: FoldersManifest): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function newFolderId(): string {
  return `f-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export function validateName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 40) return null;
  return trimmed;
}

export function validateSlideName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;
  return trimmed;
}

async function rmSlideDir(slidesRoot: string, slideId: string): Promise<boolean> {
  if (!SLIDE_ID_RE.test(slideId)) return false;
  const dir = path.resolve(slidesRoot, slideId);
  if (!dir.startsWith(slidesRoot + path.sep)) return false;
  try {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function resolveAssetsDir(slidesRoot: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const slideDir = path.resolve(slidesRoot, slideId);
  if (!slideDir.startsWith(slidesRoot + path.sep)) return null;
  const assetsDir = path.resolve(slideDir, 'assets');
  if (assetsDir !== path.join(slideDir, 'assets')) return null;
  return assetsDir;
}

function resolveAssetFile(slidesRoot: string, slideId: string, filename: string): string | null {
  const assetsDir = resolveAssetsDir(slidesRoot, slideId);
  if (!assetsDir) return null;
  if (!validateAssetName(filename)) return null;
  const file = path.resolve(assetsDir, filename);
  if (!file.startsWith(assetsDir + path.sep)) return null;
  return file;
}

function resolveSlideEntry(slidesRoot: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const dir = path.resolve(slidesRoot, slideId);
  if (!dir.startsWith(slidesRoot + path.sep)) return null;
  // The SlideMeta contract says every slide has slides/<id>/index.tsx; we only
  // edit that file to keep the write surface tiny and predictable.
  return path.join(dir, 'index.tsx');
}

function escapeSingleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Rewrite (or insert) the `title` field in the slide module's `export const meta`.
 *
 * Strategy:
 *   1. Find `export const meta` and brace-match its object literal.
 *   2. If the object already has a `title: '...'` entry, replace the literal.
 *   3. If the object exists but has no title, inject a new `title: '...'` line
 *      as the first property (preserving the author's surrounding indentation).
 *   4. If there is no `meta` export at all, insert a fresh one right before
 *      `export default`.
 *
 * Returns the rewritten source, or `null` if the file shape was too surprising
 * to touch safely (e.g. `export default` missing when we'd need to inject meta).
 */
export function updateMetaTitleInSource(source: string, title: string): string | null {
  const newLiteral = `'${escapeSingleQuoted(title)}'`;

  const metaStart = source.search(/export\s+const\s+meta\b/);
  if (metaStart !== -1) {
    const eqIdx = source.indexOf('=', metaStart);
    if (eqIdx === -1) return null;
    const openBrace = source.indexOf('{', eqIdx);
    if (openBrace === -1) return null;

    let depth = 0;
    let closeBrace = -1;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          closeBrace = i;
          break;
        }
      }
    }
    if (closeBrace === -1) return null;

    const body = source.slice(openBrace + 1, closeBrace);
    const titleRe = /(^|[\s,{])(title\s*:\s*)(['"`])((?:\\.|(?!\3).)*)\3/;
    const match = body.match(titleRe);
    if (match) {
      const newBody = body.replace(titleRe, `${match[1]}${match[2]}${newLiteral}`);
      return source.slice(0, openBrace + 1) + newBody + source.slice(closeBrace);
    }

    // No title yet — inject as the first property, copying the indentation of
    // the first existing property (or a sensible default for an empty object).
    const firstIndentMatch = body.match(/\n([ \t]+)\S/);
    const indent = firstIndentMatch ? firstIndentMatch[1] : '  ';
    const trimmedBody = body.replace(/^\s*\n?/, '');
    const needsSeparator = trimmedBody.trim().length > 0;
    const insertion = `\n${indent}title: ${newLiteral}${needsSeparator ? ',' : ''}`;
    return source.slice(0, openBrace + 1) + insertion + body + source.slice(closeBrace);
  }

  const exportDefaultIdx = source.search(/export\s+default\b/);
  if (exportDefaultIdx === -1) return null;
  const insertion = `export const meta: SlideMeta = { title: ${newLiteral} };\n\n`;
  return source.slice(0, exportDefaultIdx) + insertion + source.slice(exportDefaultIdx);
}

export function validateIcon(v: unknown): FolderIcon | null {
  if (!v || typeof v !== 'object') return null;
  const icon = v as { type?: unknown; value?: unknown };
  if (icon.type === 'emoji') {
    if (typeof icon.value !== 'string') return null;
    if (icon.value.length < 1 || icon.value.length > 8) return null;
    return { type: 'emoji', value: icon.value };
  }
  if (icon.type === 'color') {
    if (typeof icon.value !== 'string' || !COLOR_RE.test(icon.value)) return null;
    return { type: 'color', value: icon.value };
  }
  return null;
}

export type FilesPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function filesPlugin(opts: FilesPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const manifestPath = path.join(slidesRoot, '.folders.json');

  return {
    name: 'open-slide:files',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.watcher.add(manifestPath);
      server.watcher.on('change', (p) => {
        if (p === manifestPath) {
          server.ws.send({ type: 'custom', event: 'open-slide:files-changed' });
        }
      });

      // Surface asset directory mutations as an HMR ping so the editor's
      // <AssetPanel> can re-list without a full reload.
      const onAssetChange = (p: string) => {
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

      server.middlewares.use('/__slides', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          const idMatch = url.pathname.match(/^\/([^/]+)$/);
          if (!idMatch) return next();
          const slideId = idMatch[1];
          if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });

          if (method === 'PATCH') {
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

          if (listMatch && method === 'GET') {
            const slideId = listMatch[1];
            const assetsDir = resolveAssetsDir(slidesRoot, slideId);
            if (!assetsDir) return json(res, 400, { error: 'invalid slideId' });

            let entries: string[];
            try {
              entries = await fs.readdir(assetsDir);
            } catch (err) {
              if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                return json(res, 200, { assets: [] });
              }
              throw err;
            }

            const assets = [];
            for (const name of entries) {
              if (!validateAssetName(name)) continue;
              const stat = await fs.stat(path.join(assetsDir, name));
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
            const file = resolveAssetFile(slidesRoot, slideId, filename);
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

              const assetsDir = resolveAssetsDir(slidesRoot, slideId);
              if (!assetsDir) return json(res, 400, { error: 'invalid slideId' });
              await fs.mkdir(assetsDir, { recursive: true });

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
              const body = (await readBody(req)) as { name?: unknown };
              const target = validateAssetName(body.name);
              if (!target) return json(res, 400, { error: 'invalid name' });
              if (target === filename) return json(res, 200, { ok: true, name: filename });

              const dest = resolveAssetFile(slidesRoot, slideId, target);
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

      server.middlewares.use('/__folders', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/') {
            const manifest = await readManifest(manifestPath);
            return json(res, 200, manifest);
          }

          if (method === 'POST' && url.pathname === '/') {
            const body = (await readBody(req)) as CreateBody;
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
            const body = (await readBody(req)) as AssignBody;
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
              const body = (await readBody(req)) as PatchBody;
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
