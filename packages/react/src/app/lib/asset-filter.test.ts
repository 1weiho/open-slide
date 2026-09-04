import { describe, expect, it } from 'vitest';
import { filterAssets, sortAssets } from './asset-filter.ts';
import type { AssetEntry } from './assets.ts';

const assets: AssetEntry[] = [
  {
    name: 'Brand Hero.PNG',
    size: 100,
    createdAt: 1,
    mtime: 1,
    mime: 'image/png',
    url: '/brand-hero.png',
    unused: false,
  },
  {
    name: 'draft-hero.svg',
    size: 200,
    createdAt: 2,
    mtime: 2,
    mime: 'IMAGE/SVG+XML',
    url: '/draft-hero.svg',
    unused: true,
  },
  {
    name: 'display.woff2',
    size: 300,
    createdAt: 3,
    mtime: 3,
    mime: 'font/woff2',
    url: '/display.woff2',
    unused: true,
  },
  {
    name: 'intro.webm',
    size: 400,
    createdAt: 4,
    mtime: 4,
    mime: 'video/webm',
    url: '/intro.webm',
    unused: false,
  },
  {
    name: 'metadata.json',
    size: 500,
    createdAt: 5,
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

describe('sortAssets', () => {
  const sortableAssets: AssetEntry[] = [
    {
      name: 'image-10.png',
      size: 300,
      createdAt: 1,
      mtime: 200,
      mime: 'image/png',
      url: '/image-10.png',
      unused: false,
    },
    {
      name: 'Image-2.svg',
      size: 100,
      createdAt: 2,
      mtime: 300,
      mime: 'IMAGE/SVG+XML',
      url: '/image-2.svg',
      unused: false,
    },
    {
      name: 'clip.webm',
      size: 200,
      createdAt: 3,
      mtime: 100,
      mime: 'video/webm',
      url: '/clip.webm',
      unused: false,
    },
  ];

  it.each([
    ['name', 'asc', ['clip.webm', 'Image-2.svg', 'image-10.png']],
    ['name', 'desc', ['image-10.png', 'Image-2.svg', 'clip.webm']],
    ['modified', 'asc', ['clip.webm', 'image-10.png', 'Image-2.svg']],
    ['modified', 'desc', ['Image-2.svg', 'image-10.png', 'clip.webm']],
    ['size', 'asc', ['Image-2.svg', 'clip.webm', 'image-10.png']],
    ['size', 'desc', ['image-10.png', 'clip.webm', 'Image-2.svg']],
    ['type', 'asc', ['image-10.png', 'Image-2.svg', 'clip.webm']],
    ['type', 'desc', ['clip.webm', 'Image-2.svg', 'image-10.png']],
  ] as const)('sorts by %s %s', (key, direction, expected) => {
    expect(names(sortAssets(sortableAssets, { key, direction }))).toEqual(expected);
  });

  it('sorts names naturally and case-insensitively', () => {
    const naturalNames = [
      { ...sortableAssets[0], name: 'Slide 11.png' },
      { ...sortableAssets[0], name: 'slide 2.png' },
      { ...sortableAssets[0], name: 'SLIDE 1.png' },
    ];

    expect(names(sortAssets(naturalNames, { key: 'name', direction: 'asc' }))).toEqual([
      'SLIDE 1.png',
      'slide 2.png',
      'Slide 11.png',
    ]);
  });

  it('breaks primary-value ties by name ascending for both directions', () => {
    const tiedAssets = [
      { ...sortableAssets[0], name: 'zebra.png', size: 100 },
      { ...sortableAssets[1], name: 'alpha.svg', size: 100 },
    ];

    expect(names(sortAssets(tiedAssets, { key: 'size', direction: 'asc' }))).toEqual([
      'alpha.svg',
      'zebra.png',
    ]);
    expect(names(sortAssets(tiedAssets, { key: 'size', direction: 'desc' }))).toEqual([
      'alpha.svg',
      'zebra.png',
    ]);
  });

  it('does not mutate the input', () => {
    const originalOrder = [...sortableAssets];
    const sorted = sortAssets(sortableAssets, { key: 'name', direction: 'asc' });

    expect(sortableAssets).toEqual(originalOrder);
    expect(sorted).not.toBe(sortableAssets);
  });
});
