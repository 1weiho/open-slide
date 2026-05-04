import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { format, useLocale } from '@/lib/use-locale';
import { FolderIconChip, FolderItem } from './folder-item';
import { IconPicker, PRESET_COLORS } from './icon-picker';

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
  const [newIcon, setNewIcon] = useState<FolderIcon>(() => ({
    type: 'color',
    value: PRESET_COLORS[0],
  }));
  const [iconOpen, setIconOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useLocale();

  const startCreating = () => {
    const color = PRESET_COLORS[folders.length % PRESET_COLORS.length];
    setNewIcon({ type: 'color', value: color });
    setNewName('');
    setCreating(true);
  };

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const stateRef = useRef({ name: newName, icon: newIcon, iconOpen });
  stateRef.current = { name: newName, icon: newIcon, iconOpen };

  const exitCreate = () => {
    setCreating(false);
    setNewName('');
    setIconOpen(false);
  };

  const commitCreate = async () => {
    const trimmed = stateRef.current.name.trim();
    const icon = stateRef.current.icon;
    if (!trimmed) {
      exitCreate();
      return;
    }
    exitCreate();
    try {
      const folder = await onCreate(trimmed, icon);
      toast.success(format(t.home.toastFolderCreated, { name: folder?.name ?? trimmed }));
    } catch {
      toast.error(t.home.toastFolderCreateFailed);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: commitCreate reads latest state via stateRef
  useEffect(() => {
    if (!creating) return;
    const onDown = (e: MouseEvent) => {
      if (stateRef.current.iconOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-folder-create]')) return;
      if (target.closest('[data-radix-popper-content-wrapper]')) return;
      commitCreate();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [creating]);

  return (
    <aside className="paper relative flex h-full w-[16.5rem] shrink-0 flex-col border-r border-hairline bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <h1 className="font-heading text-lg font-bold tracking-tight">{t.home.appTitle}</h1>
        <div className="-mr-1.5">
          <ThemeToggle />
        </div>
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
            <div
              data-folder-create
              className="mt-1 flex items-center gap-2.5 rounded-[5px] border border-dashed border-foreground/30 bg-card px-2 py-[5px]"
            >
              <Popover open={iconOpen} onOpenChange={setIconOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex size-5 shrink-0 items-center justify-center rounded transition-transform hover:scale-110"
                    aria-label={t.home.pickIcon}
                  >
                    <FolderIconChip icon={newIcon} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-auto p-2">
                  <IconPicker value={newIcon} onChange={setNewIcon} />
                </PopoverContent>
              </Popover>
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitCreate();
                  if (e.key === 'Escape') exitCreate();
                }}
                placeholder={t.home.folderName}
                maxLength={40}
                className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={startCreating}
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
