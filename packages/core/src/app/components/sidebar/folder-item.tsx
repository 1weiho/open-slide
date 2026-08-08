import { ChevronRight, FolderInput, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { groupFoldersByParent } from '@/lib/folder-tree';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { IconPicker } from './icon-picker';

export const SLIDE_DND_MIME = 'application/x-slide-id';

function useSlideDragActive() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onStart = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes(SLIDE_DND_MIME)) setActive(true);
    };
    const onEnd = () => setActive(false);
    document.addEventListener('dragstart', onStart);
    document.addEventListener('dragend', onEnd);
    document.addEventListener('drop', onEnd);
    return () => {
      document.removeEventListener('dragstart', onStart);
      document.removeEventListener('dragend', onEnd);
      document.removeEventListener('drop', onEnd);
    };
  }, []);
  return active;
}

export function FolderIconChip({ icon, className }: { icon: FolderIcon; className?: string }) {
  if (icon.type === 'emoji') {
    return (
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center text-[15px] leading-none',
          className,
        )}
      >
        {icon.value}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-block size-3 rounded-[3px] ring-1 ring-foreground/15 shadow-[inset_0_1px_0_oklch(1_0_0/0.18)]',
        className,
      )}
      style={{ background: icon.value }}
    />
  );
}

type Row =
  | {
      kind: 'folder';
      folder: Folder;
      onRename: (name: string) => void;
      onChangeIcon: (icon: FolderIcon) => void;
      onDelete: () => void;
      onMove: (parentId: string | null) => void;
      allFolders: Folder[];
    }
  | {
      kind: 'all';
    }
  | {
      kind: 'draft';
    }
  | {
      kind: 'themes';
    }
  | {
      kind: 'assets';
    };

function isDescendant(candidateId: string, rootId: string, all: Folder[]): boolean {
  let current: string | null | undefined = candidateId;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current)) return false;
    seen.add(current);
    if (current === rootId) return true;
    const parent = all.find((f) => f.id === current)?.parentId;
    current = parent ?? null;
  }
  return false;
}

/**
 * Recursively renders the "Move under" targets as nested submenus: a folder with
 * children becomes a flyout containing a "Move into <name>" item plus its own
 * children. The moved folder and its subtree are skipped (they can't be targets
 * without creating a cycle).
 */
function MoveTargetItems({
  parentId,
  all,
  childrenByParent,
  movedId,
  currentParentId,
  onMove,
}: {
  parentId: string | null;
  all: Folder[];
  childrenByParent: Map<string | null, Folder[]>;
  movedId: string;
  currentParentId: string | null;
  onMove: (parentId: string | null) => void;
}) {
  const t = useLocale();
  const kids = (childrenByParent.get(parentId) ?? []).filter((f) => f.id !== movedId);
  return (
    <>
      {kids.map((f) => {
        if (isDescendant(f.id, movedId, all)) return null;
        const current = currentParentId === f.id;
        const grandKids = (childrenByParent.get(f.id) ?? []).filter((c) => c.id !== movedId);
        if (grandKids.length === 0) {
          return (
            <DropdownMenuItem key={f.id} disabled={current} onClick={() => onMove(f.id)}>
              <FolderIconChip icon={f.icon} />
              <span className="truncate">{f.name}</span>
            </DropdownMenuItem>
          );
        }
        return (
          <DropdownMenuSub key={f.id}>
            <DropdownMenuSubTrigger>
              <FolderIconChip icon={f.icon} />
              <span className="truncate">{f.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-[300px] min-w-[180px] overflow-y-auto">
              <DropdownMenuItem disabled={current} onClick={() => onMove(f.id)}>
                <FolderInput />
                <span className="truncate">{format(t.home.moveInto, { name: f.name })}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <MoveTargetItems
                parentId={f.id}
                all={all}
                childrenByParent={childrenByParent}
                movedId={movedId}
                currentParentId={currentParentId}
                onMove={onMove}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      })}
    </>
  );
}

export function FolderItem({
  row,
  count,
  selected,
  depth = 0,
  hasChildren = false,
  expanded = false,
  onToggleExpand,
  onSelect,
  onDropSlide,
}: {
  row: Row;
  count: number;
  selected: boolean;
  depth?: number;
  hasChildren?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onSelect: () => void;
  onDropSlide: (slideId: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const [draftName, setDraftName] = useState(row.kind === 'folder' ? row.folder.name : '');
  const slideDragActive = useSlideDragActive();
  const t = useLocale();

  const acceptsSlideDrop = row.kind === 'draft' || row.kind === 'folder';
  const isSlideDrag = (e: React.DragEvent) =>
    acceptsSlideDrop && e.dataTransfer.types.includes(SLIDE_DND_MIME);
  const handleDragEnter = (e: React.DragEvent) => {
    if (!isSlideDrag(e)) return;
    dragDepth.current += 1;
    if (dragDepth.current === 1) setDragOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (!isSlideDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!isSlideDrag(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!acceptsSlideDrop) return;
    const slideId = e.dataTransfer.getData(SLIDE_DND_MIME);
    dragDepth.current = 0;
    setDragOver(false);
    if (!slideId) return;
    e.preventDefault();
    onDropSlide(slideId);
  };

  const icon: FolderIcon =
    row.kind === 'all'
      ? { type: 'emoji', value: '🎞️' }
      : row.kind === 'draft'
        ? { type: 'emoji', value: '📝' }
        : row.kind === 'themes'
          ? { type: 'emoji', value: '🎨' }
          : row.kind === 'assets'
            ? { type: 'emoji', value: '🗂️' }
            : row.folder.icon;
  const label =
    row.kind === 'all'
      ? t.home.slides
      : row.kind === 'draft'
        ? t.home.draft
        : row.kind === 'themes'
          ? t.home.themes
          : row.kind === 'assets'
            ? t.home.assets
            : row.folder.name;

  const commitRename = () => {
    if (row.kind !== 'folder') return;
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== row.folder.name) row.onRename(trimmed);
    setRenaming(false);
  };

  const isFolder = row.kind === 'folder';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target wraps interactive children
    <div
      className={cn(
        'group relative flex items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-[12.5px] transition-colors',
        selected
          ? 'bg-muted text-foreground before:absolute before:inset-y-1.5 before:-left-0.5 before:w-[2px] before:rounded-full before:bg-brand'
          : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
        slideDragActive && acceptsSlideDrop && !dragOver && 'ring-1 ring-foreground/10',
        dragOver &&
          'bg-brand/10 text-foreground ring-1 ring-brand ring-offset-1 ring-offset-sidebar motion-safe:scale-[1.01] motion-safe:transition-transform',
      )}
      style={isFolder && depth > 0 ? { paddingLeft: `${8 + depth * 12}px` } : undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isFolder &&
        (hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            aria-label={expanded ? t.home.folderCollapse : t.home.folderExpand}
            className="-ml-1 flex size-4 shrink-0 items-center justify-center rounded text-foreground/50 transition-transform hover:bg-foreground/10 hover:text-foreground"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight className="size-3" />
          </button>
        ) : (
          <span className="-ml-1 inline-block size-4 shrink-0" aria-hidden />
        ))}

      {row.kind === 'folder' && import.meta.env.DEV ? (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded transition-transform hover:scale-110"
                aria-label={t.home.changeIcon}
                onClick={(e) => e.stopPropagation()}
              >
                <FolderIconChip icon={icon} />
              </button>
            }
          />
          <PopoverContent side="right" align="start" className="w-auto p-2">
            <IconPicker value={row.folder.icon} onChange={(next) => row.onChangeIcon(next)} />
          </PopoverContent>
        </Popover>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          aria-label={label}
          className="flex size-5 shrink-0 items-center justify-center"
        >
          <FolderIconChip icon={icon} />
        </button>
      )}

      {renaming && row.kind === 'folder' ? (
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setDraftName(row.folder.name);
              setRenaming(false);
            }
          }}
          maxLength={40}
          className="min-w-0 flex-1 rounded-[3px] bg-card px-1 text-[12.5px] outline-none ring-1 ring-foreground/20"
        />
      ) : (
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
          {label}
        </button>
      )}

      <span
        className={cn(
          'folio ml-auto shrink-0 transition-opacity',
          row.kind === 'folder' &&
            import.meta.env.DEV &&
            'group-hover:opacity-0 group-has-[[aria-expanded=true]]:opacity-0',
        )}
      >
        {count.toString().padStart(2, '0')}
      </span>

      {row.kind === 'folder' && import.meta.env.DEV && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-1/2 size-5 -translate-y-1/2 rounded opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100 aria-expanded:opacity-100"
                aria-label={t.home.folderActions}
              >
                <MoreHorizontal className="mx-auto size-3.5" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem
              onClick={() => {
                setDraftName(row.folder.name);
                setRenaming(true);
              }}
            >
              <Pencil />
              {t.common.rename}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput />
                {t.home.moveUnder}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[300px] min-w-[180px] overflow-y-auto">
                <DropdownMenuItem
                  disabled={(row.folder.parentId ?? null) === null}
                  onClick={() => row.onMove(null)}
                >
                  <span className="inline-block size-3 shrink-0" aria-hidden />
                  <span className="text-muted-foreground">{t.home.moveTopLevel}</span>
                </DropdownMenuItem>
                <MoveTargetItems
                  parentId={null}
                  all={row.allFolders}
                  childrenByParent={groupFoldersByParent(row.allFolders)}
                  movedId={row.folder.id}
                  currentParentId={row.folder.parentId ?? null}
                  onMove={row.onMove}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem variant="destructive" onClick={() => row.onDelete()}>
              <Trash2 />
              {t.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
