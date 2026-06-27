import path from 'node:path';
import type { SlideMode } from '../config.ts';
import { SLIDE_ID_RE, STANDALONE_SLIDE_ID } from '../editing/slide-ops.ts';

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
  if (!validateAssetName(filename)) return null;
  const file = path.resolve(assetsDir, filename);
  if (!file.startsWith(assetsDir + path.sep)) return null;
  return file;
}

export function resolveScopedAssetsDir(
  slidesRoot: string,
  globalAssetsRoot: string,
  scope: string,
  mode: SlideMode = 'workspace',
): string | null {
  // A standalone deck has a single root `assets/` dir that doubles as both its
  // own scope and the global scope, so the synthetic slide maps straight to it.
  if (scope === GLOBAL_SCOPE) return globalAssetsRoot;
  if (mode === 'standalone') {
    return scope === STANDALONE_SLIDE_ID ? globalAssetsRoot : null;
  }
  return resolveAssetsDir(slidesRoot, scope);
}

export function resolveScopedAssetFile(
  slidesRoot: string,
  globalAssetsRoot: string,
  scope: string,
  filename: string,
  mode: SlideMode = 'workspace',
): string | null {
  if (scope === GLOBAL_SCOPE || (mode === 'standalone' && scope === STANDALONE_SLIDE_ID)) {
    if (!validateAssetName(filename)) return null;
    const file = path.resolve(globalAssetsRoot, filename);
    if (!file.startsWith(globalAssetsRoot + path.sep)) return null;
    return file;
  }
  if (mode === 'standalone') return null;
  return resolveAssetFile(slidesRoot, scope, filename);
}
