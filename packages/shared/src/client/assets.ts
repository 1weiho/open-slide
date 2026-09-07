export type AssetEntry = {
  name: string;
  size: number;
  createdAt: number;
  mtime: number;
  mime: string;
  url: string;
  unused: boolean;
};

export async function listAssets(slideId: string): Promise<AssetEntry[]> {
  const response = await fetch(`/__assets/${slideId}`);
  if (!response.ok) throw new Error(`GET /__assets/${slideId} ${response.status}`);
  const data = (await response.json()) as { assets?: AssetEntry[] };
  return data.assets ?? [];
}

export function uploadAsset(
  slideId: string,
  file: File,
  options: { overwrite?: boolean } = {},
): Promise<Response> {
  const query = options.overwrite ? '?overwrite=1' : '';
  return fetch(`/__assets/${slideId}/${encodeURIComponent(file.name)}${query}`, {
    method: 'POST',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'content-length': String(file.size),
    },
    body: file,
  });
}

export function renameAsset(slideId: string, from: string, to: string): Promise<Response> {
  return fetch(`/__assets/${slideId}/${encodeURIComponent(from)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: to }),
  });
}

export function deleteAsset(slideId: string, name: string): Promise<Response> {
  return fetch(`/__assets/${slideId}/${encodeURIComponent(name)}`, { method: 'DELETE' });
}
