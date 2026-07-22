import type { Folder } from './sdk';

/**
 * Group folders by parent id for tree rendering. A folder whose `parentId` is
 * null/undefined — or points at an id that no folder actually has (a hand-typed
 * `.folders.json` mistake) — is bucketed under `null`, so it surfaces as a
 * top-level folder instead of silently disappearing from every view.
 */
export function groupFoldersByParent(folders: Folder[]): Map<string | null, Folder[]> {
  const ids = new Set(folders.map((f) => f.id));
  const byParent = new Map<string | null, Folder[]>();
  for (const f of folders) {
    const parent = f.parentId != null && ids.has(f.parentId) ? f.parentId : null;
    const list = byParent.get(parent) ?? [];
    list.push(f);
    byParent.set(parent, list);
  }
  return byParent;
}
