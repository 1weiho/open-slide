import type { AssetEntry } from './assets';

export type AssetUsageFilter = 'all' | 'used' | 'unused';
export type AssetTypeFilter = 'all' | 'image' | 'font' | 'video' | 'other';

export type AssetFilterOptions = {
  usage: AssetUsageFilter;
  type: AssetTypeFilter;
  search: string;
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
