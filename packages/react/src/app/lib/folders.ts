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

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}`);
  return res;
}

async function request(method: string, path: string, body?: unknown): Promise<void> {
  await send(method, path, body);
}

async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body);
  return (await res.json()) as T;
}

function isFolderIcon(value: unknown): value is FolderIcon {
  if (!value || typeof value !== 'object') return false;
  const icon = value as { type?: unknown; value?: unknown };
  return (icon.type === 'emoji' || icon.type === 'color') && typeof icon.value === 'string';
}

function asFolder(value: unknown): Folder {
  const folder = value as Partial<Folder> | null;
  if (
    !folder ||
    typeof folder.id !== 'string' ||
    typeof folder.name !== 'string' ||
    !isFolderIcon(folder.icon)
  ) {
    throw new Error('malformed folder response');
  }
  return folder as Folder;
}

async function patchSlideName(slideId: string, name: string): Promise<void> {
  await request('PATCH', `/__slides/${slideId}`, { name });
}

async function duplicateSlideReq(slideId: string, newId?: string): Promise<string> {
  const body = await requestJson<{ slideId?: unknown }>(
    'POST',
    `/__slides/${slideId}/duplicate`,
    newId === undefined ? undefined : { newId },
  );
  if (typeof body.slideId !== 'string') throw new Error('duplicate response missing slideId');
  return body.slideId;
}

async function deleteSlideReq(slideId: string): Promise<void> {
  await request('DELETE', `/__slides/${slideId}`);
}

async function postFolder(name: string, icon: FolderIcon): Promise<Folder> {
  return asFolder(await requestJson('POST', '/__folders', { name, icon }));
}

async function patchFolder(
  id: string,
  patch: { name?: string; icon?: FolderIcon },
): Promise<Folder> {
  return asFolder(await requestJson('PATCH', `/__folders/${id}`, patch));
}

async function deleteFolder(id: string): Promise<void> {
  await request('DELETE', `/__folders/${id}`);
}

async function putAssign(slideId: string, folderId: string | null): Promise<void> {
  await request('PUT', '/__folders/assign', { slideId, folderId });
}

async function putReorder(ids: string[]): Promise<void> {
  await request('PUT', '/__folders/reorder', { ids });
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
  };
}
