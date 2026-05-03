import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { useLocale } from '@/lib/use-locale';
import { FolderItem } from './folder-item';
import { PRESET_COLORS } from './icon-picker';

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
  const t = useLocale();

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
    <aside className="paper relative flex h-full w-[16.5rem] shrink-0 flex-col border-r border-hairline bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <h1 className="font-heading text-lg font-bold tracking-tight">{t.home.appTitle}</h1>
        <ThemeToggle />
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

      <div className="mt-5 flex items-center gap-2 px-4 pb-1.5">
        <span className="eyebrow">{t.home.folders}</span>
        <span className="h-px flex-1 bg-hairline" aria-hidden />
        <span className="folio">{folders.length.toString().padStart(2, '0')}</span>
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

        {import.meta.env.DEV &&
          (creating ? (
            <div className="mt-1 flex items-center gap-2 rounded-[5px] border border-dashed border-foreground/30 bg-card px-2 py-1.5">
              <span className="size-2 shrink-0 rounded-[2px] bg-brand" aria-hidden />
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
                placeholder={t.home.folderName}
                maxLength={40}
                className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-1 flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              <span>{t.home.newFolder}</span>
            </button>
          ))}
      </div>
    </aside>
  );
}
