import type { AssetEntry } from './assets';

export type AssetUsageFilter = 'all' | 'used' | 'unused';
export type AssetTypeFilter = 'all' | 'image' | 'font' | 'video' | 'other';
export type AssetSortKey = 'name' | 'modified' | 'size' | 'type';
export type AssetSortDirection = 'asc' | 'desc';

export type AssetFilterOptions = {
  usage: AssetUsageFilter;
  type: AssetTypeFilter;
  search: string;
};

export type AssetSortOptions = {
  key: AssetSortKey;
  direction: AssetSortDirection;
};

type SpecificAssetType = Exclude<AssetTypeFilter, 'all'>;

function assetType(mime: string): SpecificAssetType {
  const normalizedMime = mime.toLowerCase();
  if (normalizedMime.startsWith('image/')) return 'image';
  if (normalizedMime.startsWith('font/')) return 'font';
  if (normalizedMime.startsWith('video/')) return 'video';
  return 'other';
}

export function filterAssets(
  assets: readonly AssetEntry[],
  { usage, type, search }: AssetFilterOptions,
): AssetEntry[] {
  const query = search.trim().toLowerCase();
  const filtered: AssetEntry[] = [];

  for (const asset of assets) {
    if (usage === 'used' && asset.unused) continue;
    if (usage === 'unused' && !asset.unused) continue;
    if (type !== 'all' && assetType(asset.mime) !== type) continue;
    if (query && !asset.name.toLowerCase().includes(query)) continue;
    filtered.push(asset);
  }

  return filtered;
}

const nameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function compareNames(left: AssetEntry, right: AssetEntry): number {
  return nameCollator.compare(left.name, right.name);
}

function comparePrimary(left: AssetEntry, right: AssetEntry, key: AssetSortKey): number {
  switch (key) {
    case 'name':
      return compareNames(left, right);
    case 'modified':
      return left.mtime - right.mtime;
    case 'size':
      return left.size - right.size;
    case 'type':
      return left.mime.toLowerCase().localeCompare(right.mime.toLowerCase());
  }
}

export function sortAssets(
  assets: readonly AssetEntry[],
  { key, direction }: AssetSortOptions,
): AssetEntry[] {
  return [...assets].sort((left, right) => {
    const primaryComparison = comparePrimary(left, right, key);
    if (primaryComparison !== 0) {
      return direction === 'asc' ? primaryComparison : -primaryComparison;
    }
    return compareNames(left, right);
  });
}
