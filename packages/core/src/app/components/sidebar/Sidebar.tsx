import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { FolderItem } from './FolderItem';
import { PRESET_COLORS } from './IconPicker';

export const DRAFT_ID = 'draft';

export function Sidebar({
  folders,
  countFor,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onChangeIcon,
  onDelete,
  onDropToFolder,
  onDropToDraft,
}: {
  folders: Folder[];
  countFor: (folderId: string | null) => number;
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, icon: FolderIcon) => Promise<Folder> | undefined;
  onRename: (id: string, name: string) => void;
  onChangeIcon: (id: string, icon: FolderIcon) => void;
  onDelete: (id: string) => void;
  onDropToFolder: (folderId: string, slideId: string) => void;
  onDropToDraft: (slideId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const commitCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setCreating(false);
      setNewName('');
      return;
    }
    const color = PRESET_COLORS[folders.length % PRESET_COLORS.length];
    onCreate(trimmed, { type: 'color', value: color });
    setNewName('');
    setCreating(false);
  };

  return (
    <aside className="flex h-full w-[17rem] shrink-0 flex-col border-r bg-card/40">
      <div className="px-5 pt-6 pb-3">
        <h1 className="font-heading text-lg font-bold tracking-tight">open-slide</h1>
      </div>

      <div className="px-2">
        <FolderItem
          row={{ kind: 'draft' }}
          count={countFor(null)}
          selected={selectedId === DRAFT_ID}
          onSelect={() => onSelect(DRAFT_ID)}
          onDropSlide={onDropToDraft}
        />
      </div>

      <div className="mt-4 px-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground/70">
        FOLDERS
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            row={{
              kind: 'folder',
              folder,
              onRename: (name) => onRename(folder.id, name),
              onChangeIcon: (icon) => onChangeIcon(folder.id, icon),
              onDelete: () => onDelete(folder.id),
            }}
            count={countFor(folder.id)}
            selected={selectedId === folder.id}
            onSelect={() => onSelect(folder.id)}
            onDropSlide={(slideId) => onDropToFolder(folder.id, slideId)}
          />
        ))}

        {creating ? (
          <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed bg-background px-2 py-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={commitCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreate();
                if (e.key === 'Escape') {
                  setCreating(false);
                  setNewName('');
                }
              }}
              placeholder="Folder name"
              maxLength={40}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add folder
          </button>
        )}
      </div>
    </aside>
  );
}
