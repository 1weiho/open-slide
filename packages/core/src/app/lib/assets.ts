import { useCallback, useEffect, useState } from 'react';

export type AssetEntry = {
  name: string;
  size: number;
  mtime: number;
  mime: string;
  url: string;
};

export type UploadOptions = { overwrite?: boolean };

async function listAssets(slideId: string): Promise<AssetEntry[]> {
  const res = await fetch(`/__assets/${slideId}`);
  if (!res.ok) throw new Error(`GET /__assets/${slideId} ${res.status}`);
  const data = (await res.json()) as { assets?: AssetEntry[] };
  return data.assets ?? [];
}

async function uploadAsset(
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
    const handler = (data: { slideId?: string } | undefined) => {
      if (!data || data.slideId === slideId) {
        refresh().catch(() => {});
      }
    };
    import.meta.hot.on('open-slide:assets-changed', handler);
    return () => {
      import.meta.hot?.off('open-slide:assets-changed', handler);
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
