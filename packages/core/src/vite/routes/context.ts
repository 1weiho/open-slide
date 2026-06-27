import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect } from 'vite';
import type { SlideMode } from '../../config.ts';
import { SLIDE_ID_RE, STANDALONE_SLIDE_ID } from '../../editing/slide-ops.ts';
import { resolveStandaloneEntry } from '../../files/standalone-entry.ts';

export type ApiContext = {
  userCwd: string;
  slidesDir: string;
  slidesRoot: string;
  globalAssetsRoot: string;
  manifestPath: string;
  coreVersion: string;
  mode: SlideMode;
};

export type ApiPluginOptions = {
  userCwd: string;
  slidesDir?: string;
  assetsDir?: string;
  coreVersion: string;
  mode?: SlideMode;
};

export function makeContext(opts: ApiPluginOptions): ApiContext {
  const userCwd = opts.userCwd;
  const mode = opts.mode ?? 'workspace';
  const slidesDir = opts.slidesDir ?? 'slides';
  const assetsDir = opts.assetsDir ?? 'assets';
  // Standalone decks have no `slides/` dir; the project root itself holds the
  // single slide entry, so slide-scoped resolution roots at userCwd.
  const slidesRoot = mode === 'standalone' ? userCwd : path.resolve(userCwd, slidesDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = path.join(slidesRoot, '.folders.json');
  return {
    userCwd,
    slidesDir,
    slidesRoot,
    globalAssetsRoot,
    manifestPath,
    coreVersion: opts.coreVersion,
    mode,
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
  mode: SlideMode = 'workspace',
): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  if (mode === 'standalone') {
    return slideId === STANDALONE_SLIDE_ID ? resolveStandaloneEntry(userCwd) : null;
  }
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const full = path.resolve(slidesRoot, slideId, 'index.tsx');
  if (!full.startsWith(slidesRoot + path.sep)) return null;
  return full;
}

export function resolveSlideEntryPath(ctx: ApiContext, slideId: string): string | null {
  return resolveSlidePath(ctx.userCwd, ctx.slidesDir, slideId, ctx.mode);
}
