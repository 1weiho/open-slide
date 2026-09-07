import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect } from 'vite';
import { SLIDE_ID_RE } from '../slide-id.ts';

export type ApiContext = {
  userCwd: string;
  slidesDir: string;
  slidesRoot: string;
  globalAssetsRoot: string;
  manifestPath: string;
  coreVersion: string;
  entryFile: string;
};

export type ApiPluginOptions = {
  userCwd: string;
  slidesDir?: string;
  assetsDir?: string;
  coreVersion: string;
  entryFile?: string;
};

export function makeContext(opts: ApiPluginOptions): ApiContext {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const assetsDir = opts.assetsDir ?? 'assets';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = path.join(slidesRoot, '.folders.json');
  return {
    userCwd,
    slidesDir,
    slidesRoot,
    globalAssetsRoot,
    manifestPath,
    coreVersion: opts.coreVersion,
    entryFile: opts.entryFile ?? 'index.tsx',
  };
}

export async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
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

export function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function resolveSlidePath(
  userCwd: string,
  slidesDir: string,
  slideId: string,
  entryFile = 'index.tsx',
): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const full = path.resolve(slidesRoot, slideId, entryFile);
  if (!full.startsWith(slidesRoot + path.sep)) return null;
  return full;
}

export function resolveSlideEntryPath(ctx: ApiContext, slideId: string): string | null {
  return resolveSlidePath(ctx.userCwd, ctx.slidesDir, slideId, ctx.entryFile);
}

export async function readSlideSource(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
