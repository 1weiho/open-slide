import fs from 'node:fs/promises';
import path from 'node:path';
import { SLIDE_ID_RE } from '../editing/slide-ops.ts';

export const GLOBAL_SCOPE = '@global';
export const ASSET_MAX_BYTES = 25 * 1024 * 1024;

// biome-ignore lint/suspicious/noControlCharactersInRegex: explicit control-char block list for filename safety
const ASSET_FORBIDDEN_RE = /[\x00-\x1F\x7F/\\:*?"<>|]/;

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

// A single path segment: no separators / control chars / characters
// Windows/macOS can't store, no leading dot or tilde (hidden files, home
// expansion), no `..`. `requireExt` enforces a sensible MIME / dev-server
// extension on the final filename segment.
function isValidAssetSegment(seg: string, requireExt: boolean): boolean {
  if (seg.length < 1 || seg.length > 120) return false;
  if (ASSET_FORBIDDEN_RE.test(seg)) return false;
  if (seg.startsWith('.') || seg.startsWith('~')) return false;
  if (seg === '..') return false;
  if (requireExt) {
    const dot = seg.lastIndexOf('.');
    if (dot <= 0 || dot === seg.length - 1) return false;
  }
  return true;
}

export function validateAssetName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return isValidAssetSegment(trimmed, true) ? trimmed : null;
}

// Like validateAssetName but accepts forward-slash-separated nested paths (e.g.
// `logos/brand.svg`). Every segment is validated and only the final one needs
// an extension. Path traversal is still blocked at resolution time by the
// `startsWith(dir + sep)` containment check.
export function validateAssetPath(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 255) return null;
  if (trimmed.includes('\\')) return null;
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) return null;
  const segments = trimmed.split('/');
  for (let i = 0; i < segments.length; i++) {
    if (!isValidAssetSegment(segments[i], i === segments.length - 1)) return null;
  }
  return trimmed;
}

// Forward-slash-relative paths of every file under `dir`, recursing into
// subdirectories. Returns `null` when `dir` does not exist.
export async function listAssetFilesRecursive(dir: string): Promise<string[] | null> {
  const out: string[] = [];
  const walk = async (current: string, prefix: string): Promise<void> => {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(path.join(current, entry.name), rel);
      } else if (entry.isFile()) {
        out.push(rel);
      }
    }
  };
  try {
    await walk(dir, '');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  return out;
}

export function resolveAssetsDir(slidesRoot: string, slideId: string): string | null {
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
  if (!validateAssetPath(filename)) return null;
  const file = path.resolve(assetsDir, filename);
  if (!file.startsWith(assetsDir + path.sep)) return null;
  return file;
}

export function resolveScopedAssetsDir(
  slidesRoot: string,
  globalAssetsRoot: string,
  scope: string,
): string | null {
  if (scope === GLOBAL_SCOPE) return globalAssetsRoot;
  return resolveAssetsDir(slidesRoot, scope);
}

export function resolveScopedAssetFile(
  slidesRoot: string,
  globalAssetsRoot: string,
  scope: string,
  filename: string,
): string | null {
  if (scope === GLOBAL_SCOPE) {
    if (!validateAssetPath(filename)) return null;
    const file = path.resolve(globalAssetsRoot, filename);
    if (!file.startsWith(globalAssetsRoot + path.sep)) return null;
    return file;
  }
  return resolveAssetFile(slidesRoot, scope, filename);
}
