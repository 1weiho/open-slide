import { describe, expect, it } from 'vitest';
import { mimeForFilename, validateAssetName } from './assets.ts';

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
