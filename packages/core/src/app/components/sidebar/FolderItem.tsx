import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Folder, FolderIcon } from '@/lib/sdk';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconPicker } from './IconPicker';

export const SLIDE_DND_MIME = 'application/x-slide-id';

export function FolderIconChip({ icon, className }: { icon: FolderIcon; className?: string }) {
  if (icon.type === 'emoji') {
    return (
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center text-base leading-none',
          className,
        )}
      >
        {icon.value}
      </span>
    );
  }
  return (
    <span
      className={cn('inline-block size-4 rounded-[4px] ring-1 ring-black/10', className)}
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
    }
  | {
      kind: 'draft';
    };

export function FolderItem({
  row,
  count,
  selected,
  onSelect,
  onDropSlide,
}: {
  row: Row;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onDropSlide: (slideId: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draftName, setDraftName] = useState(row.kind === 'folder' ? row.folder.name : '');

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(SLIDE_DND_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    const slideId = e.dataTransfer.getData(SLIDE_DND_MIME);
    setDragOver(false);
    if (!slideId) return;
    e.preventDefault();
    onDropSlide(slideId);
  };

  const icon =
    row.kind === 'draft' ? ({ type: 'emoji', value: '📝' } satisfies FolderIcon) : row.folder.icon;
  const label = row.kind === 'draft' ? 'Draft' : row.folder.name;

  const commitRename = () => {
    if (row.kind !== 'folder') return;
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== row.folder.name) row.onRename(trimmed);
    setRenaming(false);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        selected ? 'bg-muted text-foreground' : 'text-foreground/80 hover:bg-muted/60',
        dragOver && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {row.kind === 'folder' ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex size-5 shrink-0 items-center justify-center rounded transition-transform hover:scale-110"
              aria-label="Change icon"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderIconChip icon={icon} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-auto p-2">
            <IconPicker
              value={row.folder.icon}
              onChange={(next) => row.onChangeIcon(next)}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center">
          <FolderIconChip icon={icon} />
        </span>
      )}

      {renaming && row.kind === 'folder' ? (
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setDraftName(row.folder.name);
              setRenaming(false);
            }
          }}
          maxLength={40}
          className="min-w-0 flex-1 rounded-sm bg-background px-1 text-sm outline-none ring-1 ring-ring/40"
        />
      ) : (
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
          {label}
        </button>
      )}

      <span
        className={cn(
          'shrink-0 text-xs tabular-nums text-muted-foreground',
          count === 0 && 'opacity-0 group-hover:opacity-100',
        )}
      >
        {count}
      </span>

      {row.kind === 'folder' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="size-5 shrink-0 rounded opacity-0 transition-opacity hover:bg-muted-foreground/10 group-hover:opacity-100 aria-expanded:opacity-100"
              aria-label="Folder actions"
            >
              <MoreHorizontal className="mx-auto size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem
              onSelect={() => {
                setDraftName(row.folder.name);
                setRenaming(true);
              }}
            >
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => row.onDelete()}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
