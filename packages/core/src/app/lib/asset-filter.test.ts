import { describe, expect, it } from 'vitest';
import { filterAssets } from './asset-filter.ts';
import type { AssetEntry } from './assets.ts';

const assets: AssetEntry[] = [
  {
    name: 'Brand Hero.PNG',
    size: 100,
    mtime: 1,
    mime: 'image/png',
    url: '/brand-hero.png',
    unused: false,
  },
  {
    name: 'draft-hero.svg',
    size: 200,
    mtime: 2,
    mime: 'IMAGE/SVG+XML',
    url: '/draft-hero.svg',
    unused: true,
  },
  {
    name: 'display.woff2',
    size: 300,
    mtime: 3,
    mime: 'font/woff2',
    url: '/display.woff2',
    unused: true,
  },
  {
    name: 'intro.webm',
    size: 400,
    mtime: 4,
    mime: 'video/webm',
    url: '/intro.webm',
    unused: false,
  },
  {
    name: 'metadata.json',
    size: 500,
    mtime: 5,
    mime: 'application/json',
    url: '/metadata.json',
    unused: false,
  },
];

const names = (entries: AssetEntry[]) => entries.map((asset) => asset.name);

describe('filterAssets', () => {
  it('filters assets by usage', () => {
    expect(names(filterAssets(assets, { usage: 'used', type: 'all', search: '' }))).toEqual([
      'Brand Hero.PNG',
      'intro.webm',
      'metadata.json',
    ]);
    expect(names(filterAssets(assets, { usage: 'unused', type: 'all', search: '' }))).toEqual([
      'draft-hero.svg',
      'display.woff2',
    ]);
  });

  it.each([
    ['image', ['Brand Hero.PNG', 'draft-hero.svg']],
    ['font', ['display.woff2']],
    ['video', ['intro.webm']],
    ['other', ['metadata.json']],
  ] as const)('filters %s MIME types', (type, expected) => {
    expect(names(filterAssets(assets, { usage: 'all', type, search: '' }))).toEqual(expected);
  });

  it('matches trimmed filename searches case-insensitively', () => {
    expect(names(filterAssets(assets, { usage: 'all', type: 'all', search: '  HERO  ' }))).toEqual([
      'Brand Hero.PNG',
      'draft-hero.svg',
    ]);
  });

  it('applies usage, type, and search filters together', () => {
    expect(
      names(filterAssets(assets, { usage: 'unused', type: 'image', search: 'DRAFT' })),
    ).toEqual(['draft-hero.svg']);
  });

  it('returns all assets when every filter is inactive', () => {
    expect(filterAssets(assets, { usage: 'all', type: 'all', search: '   ' })).toEqual(assets);
  });
});
