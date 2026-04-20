import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';

const FOLDER_ID_RE = /^f-[a-f0-9]{8}$/;
const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export type FolderIcon =
  | { type: 'emoji'; value: string }
  | { type: 'color'; value: string };

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

function validateName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 40) return null;
  return trimmed;
}

function validateIcon(v: unknown): FolderIcon | null {
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

export type FoldersPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function foldersPlugin(opts: FoldersPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const manifestPath = path.join(slidesRoot, '.folders.json');

  return {
    name: 'open-slide:folders',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.watcher.add(manifestPath);
      server.watcher.on('change', (p) => {
        if (p === manifestPath) {
          server.ws.send({ type: 'custom', event: 'open-slide:folders-changed' });
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
