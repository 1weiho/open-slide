import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  listAssetFilesRecursive,
  mimeForFilename,
  validateAssetName,
  validateAssetPath,
} from './assets.ts';

describe('validateAssetName', () => {
  it('accepts simple filenames with extensions', () => {
    expect(validateAssetName('logo.svg')).toBe('logo.svg');
    expect(validateAssetName('a-b_c.1.png')).toBe('a-b_c.1.png');
  });

  it('accepts spaces, parens, and unicode in names', () => {
    expect(validateAssetName('hello world.png')).toBe('hello world.png');
    expect(validateAssetName('IMG (1).jpg')).toBe('IMG (1).jpg');
    expect(validateAssetName('café.png')).toBe('café.png');
    expect(validateAssetName('截圖.png')).toBe('截圖.png');
  });

  it('rejects names without an extension', () => {
    expect(validateAssetName('README')).toBeNull();
    expect(validateAssetName('foo.')).toBeNull();
  });

  it('rejects path-traversal and separators', () => {
    expect(validateAssetName('../foo.png')).toBeNull();
    expect(validateAssetName('foo/bar.png')).toBeNull();
    expect(validateAssetName('foo\\bar.png')).toBeNull();
  });

  it('rejects leading dots, tildes, and shell-unsafe characters', () => {
    expect(validateAssetName('.hidden.png')).toBeNull();
    expect(validateAssetName('~foo.png')).toBeNull();
    expect(validateAssetName('foo\x00bar.png')).toBeNull();
    expect(validateAssetName('foo*.png')).toBeNull();
    expect(validateAssetName('foo?.png')).toBeNull();
  });

  it('rejects empty / non-string / overlong names', () => {
    expect(validateAssetName('')).toBeNull();
    expect(validateAssetName(null)).toBeNull();
    expect(validateAssetName(42)).toBeNull();
    expect(validateAssetName(`${'x'.repeat(120)}.png`)).toBeNull();
  });
});

describe('validateAssetPath', () => {
  it('accepts simple filenames and nested paths', () => {
    expect(validateAssetPath('logo.svg')).toBe('logo.svg');
    expect(validateAssetPath('logos/brand.svg')).toBe('logos/brand.svg');
    expect(validateAssetPath('a/b/c/photo.png')).toBe('a/b/c/photo.png');
  });

  it('only requires an extension on the final segment', () => {
    expect(validateAssetPath('2024/q1/chart.png')).toBe('2024/q1/chart.png');
    expect(validateAssetPath('dir/noext')).toBeNull();
  });

  it('rejects traversal, absolute, and backslash paths', () => {
    expect(validateAssetPath('../foo.png')).toBeNull();
    expect(validateAssetPath('a/../b.png')).toBeNull();
    expect(validateAssetPath('/abs.png')).toBeNull();
    expect(validateAssetPath('a/.png')).toBeNull();
    expect(validateAssetPath('dir/')).toBeNull();
    expect(validateAssetPath('a//b.png')).toBeNull();
    expect(validateAssetPath('a\\b.png')).toBeNull();
  });

  it('rejects hidden segments and shell-unsafe characters', () => {
    expect(validateAssetPath('.git/config.json')).toBeNull();
    expect(validateAssetPath('dir/.hidden.png')).toBeNull();
    expect(validateAssetPath('dir/foo\x00.png')).toBeNull();
  });

  it('rejects empty / non-string input', () => {
    expect(validateAssetPath('')).toBeNull();
    expect(validateAssetPath(null)).toBeNull();
    expect(validateAssetPath(42)).toBeNull();
  });
});

describe('listAssetFilesRecursive', () => {
  it('returns forward-slash paths for files in nested folders', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-assets-'));
    try {
      await fs.mkdir(path.join(dir, 'logos', 'brand'), { recursive: true });
      await fs.writeFile(path.join(dir, 'top.png'), 'x');
      await fs.writeFile(path.join(dir, 'logos', 'a.svg'), 'x');
      await fs.writeFile(path.join(dir, 'logos', 'brand', 'b.svg'), 'x');

      const out = await listAssetFilesRecursive(dir);
      expect(out).not.toBeNull();
      expect(new Set(out)).toEqual(new Set(['top.png', 'logos/a.svg', 'logos/brand/b.svg']));
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('returns null when the directory does not exist', async () => {
    expect(await listAssetFilesRecursive('/no/such/dir/open-slide')).toBeNull();
  });
});

describe('mimeForFilename', () => {
  it('maps known extensions', () => {
    expect(mimeForFilename('a.png')).toBe('image/png');
    expect(mimeForFilename('a.JPG')).toBe('image/jpeg');
    expect(mimeForFilename('a.svg')).toBe('image/svg+xml');
    expect(mimeForFilename('a.woff2')).toBe('font/woff2');
    expect(mimeForFilename('a.mp4')).toBe('video/mp4');
  });

  it('falls back to octet-stream for unknown / missing extensions', () => {
    expect(mimeForFilename('a.xyz')).toBe('application/octet-stream');
    expect(mimeForFilename('noext')).toBe('application/octet-stream');
  });
});
