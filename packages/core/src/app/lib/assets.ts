import { useCallback, useEffect, useState } from 'react';

export type AssetEntry = {
  name: string;
  size: number;
  createdAt: number;
  mtime: number;
  mime: string;
  url: string;
  unused: boolean;
};

export type UploadOptions = { overwrite?: boolean };

export async function listAssets(slideId: string): Promise<AssetEntry[]> {
  const res = await fetch(`/__assets/${slideId}`);
  if (!res.ok) throw new Error(`GET /__assets/${slideId} ${res.status}`);
  const data = (await res.json()) as { assets?: AssetEntry[] };
  return data.assets ?? [];
}

export async function uploadAsset(
  slideId: string,
  file: File,
  opts: UploadOptions = {},
): Promise<Response> {
  const qs = opts.overwrite ? '?overwrite=1' : '';
  return fetch(`/__assets/${slideId}/${encodeURIComponent(file.name)}${qs}`, {
    method: 'POST',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'content-length': String(file.size),
    },
    body: file,
  });
}

async function renameAsset(slideId: string, from: string, to: string): Promise<Response> {
  return fetch(`/__assets/${slideId}/${encodeURIComponent(from)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: to }),
  });
}

async function deleteAsset(slideId: string, name: string): Promise<Response> {
  return fetch(`/__assets/${slideId}/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export type AssetUsage = { slideId: string; count: number };

export async function listAssetUsages(slideId: string, name: string): Promise<AssetUsage[]> {
  const res = await fetch(`/__assets/${slideId}/${encodeURIComponent(name)}/usages`);
  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as { usages?: AssetUsage[] } | null;
  return data?.usages ?? [];
}

export async function revertAssetUsage(
  slideId: string,
  assetPath: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch('/__edit/revert-asset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId, assetPath }),
  });
  return { ok: res.ok, status: res.status };
}

export async function uploadWithAutoRename(
  slideId: string,
  file: File,
): Promise<{ ok: boolean; status: number; entry: AssetEntry | null }> {
  // Vite's default `assetsInclude` matches asset extensions case-sensitively,
  // so `<img src="./assets/foo.JPG" />` (which the placeholder edit rewrites
  // into a real `import`) fails to parse. Lowercase the extension so the
  // import path is always one Vite recognizes.
  let uploaded = lowercaseExtension(file);
  let res = await uploadAsset(slideId, uploaded);
  if (res.status === 409) {
    const list = await listAssets(slideId);
    const taken = new Set(list.map((a) => a.name));
    uploaded = renamedCopy(uploaded, taken);
    res = await uploadAsset(slideId, uploaded);
  }
  if (!res.ok) return { ok: false, status: res.status, entry: null };
  const body = (await res.json().catch(() => null)) as Partial<AssetEntry> | null;
  const now = Date.now();
  const entry: AssetEntry = {
    name: body?.name ?? uploaded.name,
    size: body?.size ?? uploaded.size,
    createdAt: body?.createdAt ?? now,
    mtime: body?.mtime ?? now,
    mime: body?.mime ?? uploaded.type ?? 'application/octet-stream',
    url: body?.url ?? `/__assets/${slideId}/${encodeURIComponent(uploaded.name)}`,
    unused: body?.unused ?? false,
  };
  return { ok: true, status: res.status, entry };
}

function lowercaseExtension(file: File): File {
  const dot = file.name.lastIndexOf('.');
  if (dot <= 0) return file;
  const ext = file.name.slice(dot);
  const lower = ext.toLowerCase();
  if (ext === lower) return file;
  return new File([file], file.name.slice(0, dot) + lower, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export function renamedCopy(file: File, taken: Set<string>): File {
  const dot = file.name.lastIndexOf('.');
  const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot) : '';
  let i = 1;
  let next = `${stem}-${i}${ext}`;
  while (taken.has(next)) {
    i += 1;
    next = `${stem}-${i}${ext}`;
  }
  return new File([file], next, { type: file.type, lastModified: file.lastModified });
}

export type SvglItem = {
  id: number;
  title: string;
  category: string | string[];
  route: string | { light: string; dark: string };
  url: string;
};

export async function searchSvgl(query: string, signal?: AbortSignal): Promise<SvglItem[]> {
  const q = query.trim();
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  else params.set('limit', '24');
  const res = await fetch(`/__svgl/search?${params.toString()}`, { signal });
  // svgl returns 404 when a search has no matches — treat it as an empty list,
  // not an error.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`svgl ${res.status}`);
  return (await res.json()) as SvglItem[];
}

export function svgProxyUrl(routeUrl: string): string {
  return `/__svgl/svg?u=${encodeURIComponent(routeUrl)}`;
}

export async function fetchSvgAsFile(routeUrl: string, filename: string): Promise<File> {
  const res = await fetch(svgProxyUrl(routeUrl));
  if (!res.ok) throw new Error(`svgl route ${res.status}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/svg+xml' });
}

export type UseAssetsResult = {
  assets: AssetEntry[];
  loading: boolean;
  available: boolean;
  upload: (file: File, opts?: UploadOptions) => Promise<{ ok: boolean; status: number }>;
  rename: (from: string, to: string) => Promise<{ ok: boolean; status: number }>;
  remove: (name: string) => Promise<{ ok: boolean; status: number }>;
  refresh: () => Promise<void>;
};

const NOOP_RESULT = { ok: false, status: 0 } as const;

export function useAssets(slideId: string): UseAssetsResult {
  const available = import.meta.env.DEV;
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [loading, setLoading] = useState(available);

  const refresh = useCallback(async () => {
    if (!available) return;
    const next = await listAssets(slideId);
    setAssets(next);
  }, [slideId]);

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    setLoading(true);
    listAssets(slideId)
      .then((next) => {
        if (!cancelled) {
          setAssets(next);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slideId]);

  useEffect(() => {
    if (!available || !import.meta.hot) return;
    const assetHandler = (data: { slideId?: string } | undefined) => {
      if (!data || data.slideId === slideId) {
        refresh().catch(() => {});
      }
    };
    const slideHandler = (data: { slideId?: unknown; slideIds?: unknown } | undefined) => {
      const changedIds = Array.isArray(data?.slideIds)
        ? data.slideIds
        : typeof data?.slideId === 'string'
          ? [data.slideId]
          : [];
      if (slideId === '@global' ? changedIds.length > 0 : changedIds.includes(slideId)) {
        refresh().catch(() => {});
      }
    };
    import.meta.hot.on('open-slide:assets-changed', assetHandler);
    import.meta.hot.on('open-slide:slide-changed', slideHandler);
    return () => {
      import.meta.hot?.off('open-slide:assets-changed', assetHandler);
      import.meta.hot?.off('open-slide:slide-changed', slideHandler);
    };
  }, [slideId, refresh]);

  const upload = useCallback(
    async (file: File, opts?: UploadOptions) => {
      if (!available) return NOOP_RESULT;
      const res = await uploadAsset(slideId, file, opts);
      if (res.ok) await refresh();
      return { ok: res.ok, status: res.status };
    },
    [slideId, refresh],
  );

  const rename = useCallback(
    async (from: string, to: string) => {
      if (!available) return NOOP_RESULT;
      const res = await renameAsset(slideId, from, to);
      if (res.ok) await refresh();
      return { ok: res.ok, status: res.status };
    },
    [slideId, refresh],
  );

  const remove = useCallback(
    async (name: string) => {
      if (!available) return NOOP_RESULT;
      const res = await deleteAsset(slideId, name);
      if (res.ok) await refresh();
      return { ok: res.ok, status: res.status };
    },
    [slideId, refresh],
  );

  return { assets, loading, available, upload, rename, remove, refresh };
}
