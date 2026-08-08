import { Plus } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { groupFoldersByParent } from '@/lib/folder-tree';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { CommandMenuTrigger } from '../command/command-menu';
import { FolderIconChip, FolderItem } from './folder-item';
import { IconPicker, PRESET_COLORS } from './icon-picker';
import { SidebarFooter } from './sidebar-footer';

export const ALL_SLIDES_ID = '__all__';
export const DRAFT_ID = 'draft';
export const THEMES_ID = '__themes__';
export const ASSETS_ID = '__assets__';

export const FOLDER_DND_MIME = 'application/x-folder-id';

const EXPANDED_STORAGE_KEY = 'open-slide:folders-expanded';

function readExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((v) => typeof v === 'string'));
  } catch {}
  return new Set();
}

function writeExpanded(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function Sidebar({
  folders,
  countFor,
  allCount,
  themesCount,
  assetsCount,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onChangeIcon,
  onDelete,
  onMove,
  onDropToFolder,
  onDropToDraft,
  onReorder,
  onOpenCommandMenu,
}: {
  folders: Folder[];
  countFor: (folderId: string | null) => number;
  allCount: number;
  themesCount: number;
  assetsCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, icon: FolderIcon) => Promise<Folder> | undefined;
  onRename: (id: string, name: string) => void;
  onChangeIcon: (id: string, icon: FolderIcon) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onDropToFolder: (folderId: string, slideId: string) => void;
  onDropToDraft: (slideId: string) => void;
  onReorder: (ids: string[]) => void;
  onOpenCommandMenu: () => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; before: boolean } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => readExpanded());
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeExpanded(next);
      return next;
    });
  };

  const childrenByParent = groupFoldersByParent(folders);
  const parentKeyById = new Map<string, string | null>();
  for (const [key, list] of childrenByParent) {
    for (const f of list) parentKeyById.set(f.id, key);
  }
  const sameSiblingGroup = (a: string, b: string) => parentKeyById.get(a) === parentKeyById.get(b);

  // Drag-reorder only permutes folders within one sibling group: the tree is
  // grouped by parent, so a global splice would drop a folder into an unrelated
  // subtree. Positions of folders under other parents stay put.
  const finishReorder = (toId: string, before: boolean) => {
    const fromId = dragId;
    setDragId(null);
    setDropTarget(null);
    if (!fromId || fromId === toId || !sameSiblingGroup(fromId, toId)) return;
    const parentKey = parentKeyById.get(fromId) ?? null;
    const sibIds = (childrenByParent.get(parentKey) ?? []).map((f) => f.id);
    if (!sibIds.includes(fromId) || !sibIds.includes(toId)) return;
    const nextSib = sibIds.filter((id) => id !== fromId);
    nextSib.splice(nextSib.indexOf(toId) + (before ? 0 : 1), 0, fromId);
    if (nextSib.every((id, i) => id === sibIds[i])) return;
    const sibSet = new Set(sibIds);
    let cursor = 0;
    const next = folders.map((f) => (sibSet.has(f.id) ? nextSib[cursor++] : f.id));
    onReorder(next);
  };
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
      if (target.closest('[data-slot="popover-content"]')) return;
      commitCreate();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [creating]);

  const renderTree = (parentId: string | null, depth: number): ReactNode[] => {
    const kids = childrenByParent.get(parentId) ?? [];
    const out: ReactNode[] = [];
    for (const folder of kids) {
      const hasChildren = (childrenByParent.get(folder.id) ?? []).length > 0;
      const isExpanded = expanded.has(folder.id);
      const isDropTarget = dropTarget?.id === folder.id;
      const before = isDropTarget && dropTarget.before;
      const after = isDropTarget && !dropTarget.before;
      out.push(
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop handle wraps the row
        <div
          key={folder.id}
          className={cn(
            'relative',
            before &&
              'before:absolute before:inset-x-2 before:-top-px before:h-[2px] before:rounded-full before:bg-brand',
            after &&
              'after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-brand',
            dragId === folder.id && 'opacity-50',
          )}
          draggable={import.meta.env.DEV}
          onDragStart={(e) => {
            if (!import.meta.env.DEV) return;
            e.dataTransfer.setData(FOLDER_DND_MIME, folder.id);
            e.dataTransfer.effectAllowed = 'move';
            setDragId(folder.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setDropTarget(null);
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(FOLDER_DND_MIME)) return;
            // Reject drops from a different sibling group so the indicator never
            // promises a move the flat reorder can't honour.
            if (dragId && !sameSiblingGroup(dragId, folder.id)) {
              if (dropTarget?.id === folder.id) setDropTarget(null);
              return;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = e.currentTarget.getBoundingClientRect();
            const isBefore = e.clientY < rect.top + rect.height / 2;
            if (!dropTarget || dropTarget.id !== folder.id || dropTarget.before !== isBefore) {
              setDropTarget({ id: folder.id, before: isBefore });
            }
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            if (dropTarget?.id === folder.id) setDropTarget(null);
          }}
          onDrop={(e) => {
            const fromId = e.dataTransfer.getData(FOLDER_DND_MIME);
            if (!fromId) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const isBefore = e.clientY < rect.top + rect.height / 2;
            finishReorder(folder.id, isBefore);
          }}
        >
          <FolderItem
            row={{
              kind: 'folder',
              folder,
              onRename: (name) => onRename(folder.id, name),
              onChangeIcon: (icon) => onChangeIcon(folder.id, icon),
              onDelete: () => onDelete(folder.id),
              onMove: (parent) => onMove(folder.id, parent),
              allFolders: folders,
            }}
            count={countFor(folder.id)}
            selected={selectedId === folder.id}
            depth={depth}
            hasChildren={hasChildren}
            expanded={isExpanded}
            onToggleExpand={() => toggleExpand(folder.id)}
            onSelect={() => onSelect(folder.id)}
            onDropSlide={(slideId) => onDropToFolder(folder.id, slideId)}
          />
        </div>,
      );
      if (hasChildren && isExpanded) {
        out.push(...renderTree(folder.id, depth + 1));
      }
    }
    return out;
  };

  return (
    <aside className="relative flex h-full w-[16.5rem] shrink-0 flex-col border-r border-hairline bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <h1 className="font-heading text-lg font-bold tracking-tight">{t.home.appTitle}</h1>
        <div className="-mr-1.5 flex items-center">
          <CommandMenuTrigger onClick={onOpenCommandMenu} />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="px-2">
        <FolderItem
          row={{ kind: 'all' }}
          count={allCount}
          selected={selectedId === ALL_SLIDES_ID}
          onSelect={() => onSelect(ALL_SLIDES_ID)}
          onDropSlide={() => {}}
        />
        <FolderItem
          row={{ kind: 'themes' }}
          count={themesCount}
          selected={selectedId === THEMES_ID}
          onSelect={() => onSelect(THEMES_ID)}
          onDropSlide={() => {}}
        />
        {import.meta.env.DEV && (
          <FolderItem
            row={{ kind: 'assets' }}
            count={assetsCount}
            selected={selectedId === ASSETS_ID}
            onSelect={() => onSelect(ASSETS_ID)}
            onDropSlide={() => {}}
          />
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 px-4 pb-1.5">
        <span className="eyebrow">{t.home.folders}</span>
        <span className="h-px flex-1 bg-hairline" aria-hidden />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <FolderItem
          row={{ kind: 'draft' }}
          count={countFor(null)}
          selected={selectedId === DRAFT_ID}
          onSelect={() => onSelect(DRAFT_ID)}
          onDropSlide={onDropToDraft}
        />
        {renderTree(null, 0)}

        {import.meta.env.DEV &&
          (creating ? (
            <div
              data-folder-create
              className="mt-1 flex items-center gap-2.5 rounded-[5px] border border-dashed border-foreground/30 bg-card px-2 py-[5px]"
            >
              <Popover open={iconOpen} onOpenChange={setIconOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="flex size-5 shrink-0 items-center justify-center rounded transition-transform hover:scale-110"
                      aria-label={t.home.pickIcon}
                    >
                      <FolderIconChip icon={newIcon} />
                    </button>
                  }
                />
                <PopoverContent side="right" align="start" className="w-auto p-2">
                  <IconPicker value={newIcon} onChange={setNewIcon} />
                </PopoverContent>
              </Popover>
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
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

      <div className="border-t border-hairline">
        <SidebarFooter />
      </div>
    </aside>
  );
}
