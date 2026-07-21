import buildManifest from 'virtual:open-slide/folders';
import { useCallback, useEffect, useState } from 'react';
import type { Folder, FolderIcon, FoldersManifest } from './sdk';

const EMPTY: FoldersManifest = { folders: [], assignments: {} };

async function getManifest(): Promise<FoldersManifest> {
  // In dev the manifest is mutable: read live from the plugin endpoint so
  // edits made in the sidebar reflect immediately. In a static build there
  // is no server, so fall back to the bundled snapshot from the virtual
  // module (populated at build time from slides/.folders.json).
  if (import.meta.env.DEV) {
    const res = await fetch('/__folders');
    if (!res.ok) throw new Error(`GET /__folders ${res.status}`);
    const raw = (await res.json()) as Partial<FoldersManifest>;
    return {
      folders: raw.folders ?? [],
      assignments: raw.assignments ?? {},
    };
  }
  return {
    folders: buildManifest.folders ?? [],
    assignments: buildManifest.assignments ?? {},
  };
}

async function patchSlideName(slideId: string, name: string): Promise<void> {
  const res = await fetch(`/__slides/${slideId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`PATCH /__slides/${slideId} ${res.status}`);
}

async function duplicateSlideReq(slideId: string, newId?: string): Promise<string> {
  const init: RequestInit = { method: 'POST' };
  if (newId !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify({ newId });
  }
  const res = await fetch(`/__slides/${slideId}/duplicate`, init);
  if (!res.ok) throw new Error(`POST /__slides/${slideId}/duplicate ${res.status}`);
  const body = (await res.json()) as { slideId?: unknown };
  if (typeof body.slideId !== 'string') throw new Error('duplicate response missing slideId');
  return body.slideId;
}

async function deleteSlideReq(slideId: string): Promise<void> {
  const res = await fetch(`/__slides/${slideId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /__slides/${slideId} ${res.status}`);
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

async function putReorder(ids: string[]): Promise<void> {
  const res = await fetch('/__folders/reorder', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`PUT /__folders/reorder ${res.status}`);
}

export type UseFoldersResult = {
  manifest: FoldersManifest;
  loading: boolean;
  create: (name: string, icon: FolderIcon) => Promise<Folder>;
  update: (id: string, patch: { name?: string; icon?: FolderIcon }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
  assign: (slideId: string, folderId: string | null) => Promise<void>;
  renameSlide: (slideId: string, name: string) => Promise<void>;
  duplicateSlide: (slideId: string, newId?: string) => Promise<string>;
  deleteSlide: (slideId: string) => Promise<void>;
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
    import.meta.hot.on('open-slide:files-changed', handler);
    return () => {
      import.meta.hot?.off('open-slide:files-changed', handler);
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

  const reorder = useCallback(
    async (ids: string[]) => {
      const prev = manifest;
      const byId = new Map(prev.folders.map((f) => [f.id, f]));
      const next = ids.map((id) => byId.get(id)).filter((f): f is Folder => Boolean(f));
      if (next.length !== prev.folders.length) return;
      setManifest({ ...prev, folders: next });
      try {
        await putReorder(ids);
      } catch (err) {
        setManifest(prev);
        throw err;
      }
    },
    [manifest],
  );

  const assign = useCallback(
    async (slideId: string, folderId: string | null) => {
      await putAssign(slideId, folderId);
      await refresh();
    },
    [refresh],
  );

  const renameSlide = useCallback(
    async (slideId: string, name: string) => {
      await patchSlideName(slideId, name);
      await refresh();
    },
    [refresh],
  );

  const duplicateSlide = useCallback(
    async (slideId: string, newId?: string) => {
      const duplicatedId = await duplicateSlideReq(slideId, newId);
      await refresh();
      return duplicatedId;
    },
    [refresh],
  );

  const deleteSlide = useCallback(
    async (slideId: string) => {
      await deleteSlideReq(slideId);
      await refresh();
    },
    [refresh],
  );

  return {
    manifest,
    loading,
    create,
    update,
    remove,
    reorder,
    assign,
    renameSlide,
    duplicateSlide,
    deleteSlide,
    refresh,
  };
}
