import { useCallback, useEffect, useState } from 'react';
import type { Folder, FolderIcon, FoldersManifest } from './sdk';

const EMPTY: FoldersManifest = { folders: [], assignments: {} };

async function getManifest(): Promise<FoldersManifest> {
  const res = await fetch('/__folders');
  if (!res.ok) throw new Error(`GET /__folders ${res.status}`);
  return (await res.json()) as FoldersManifest;
}

async function postFolder(name: string, icon: FolderIcon): Promise<Folder> {
  const res = await fetch('/__folders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, icon }),
  });
  if (!res.ok) throw new Error(`POST /__folders ${res.status}`);
  return (await res.json()) as Folder;
}

async function patchFolder(
  id: string,
  patch: { name?: string; icon?: FolderIcon },
): Promise<Folder> {
  const res = await fetch(`/__folders/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH /__folders/${id} ${res.status}`);
  return (await res.json()) as Folder;
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/__folders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /__folders/${id} ${res.status}`);
}

async function putAssign(slideId: string, folderId: string | null): Promise<void> {
  const res = await fetch('/__folders/assign', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId, folderId }),
  });
  if (!res.ok) throw new Error(`PUT /__folders/assign ${res.status}`);
}

export type UseFoldersResult = {
  manifest: FoldersManifest;
  loading: boolean;
  create: (name: string, icon: FolderIcon) => Promise<Folder>;
  update: (id: string, patch: { name?: string; icon?: FolderIcon }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  assign: (slideId: string, folderId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useFolders(): UseFoldersResult {
  const [manifest, setManifest] = useState<FoldersManifest>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const m = await getManifest();
    setManifest(m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getManifest()
      .then((m) => {
        if (!cancelled) {
          setManifest(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => {
      refresh().catch(() => {});
    };
    import.meta.hot.on('open-slide:folders-changed', handler);
    return () => {
      import.meta.hot?.off('open-slide:folders-changed', handler);
    };
  }, [refresh]);

  const create = useCallback(
    async (name: string, icon: FolderIcon) => {
      const folder = await postFolder(name, icon);
      await refresh();
      return folder;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: { name?: string; icon?: FolderIcon }) => {
      await patchFolder(id, patch);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteFolder(id);
      await refresh();
    },
    [refresh],
  );

  const assign = useCallback(
    async (slideId: string, folderId: string | null) => {
      await putAssign(slideId, folderId);
      await refresh();
    },
    [refresh],
  );

  return { manifest, loading, create, update, remove, assign, refresh };
}
