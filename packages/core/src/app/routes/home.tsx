import {
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFolders } from '@/lib/folders';
import { cn } from '@/lib/utils';
import { FolderIconChip, SLIDE_DND_MIME } from '../components/sidebar/folder-item';
import { DRAFT_ID, Sidebar } from '../components/sidebar/sidebar';
import { SlideCanvas } from '../components/slide-canvas';
import type { Folder, FolderIcon, SlideModule } from '../lib/sdk';
import { loadSlide, slideIds } from '../lib/slides';

export function Home() {
  const { manifest, create, update, remove, assign, renameSlide, deleteSlide } = useFolders();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('f') ?? DRAFT_ID;

  const selectFolder = (id: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === DRAFT_ID) next.delete('f');
        else next.set('f', id);
        return next;
      },
      { replace: true },
    );
  };

  const { draftSlides, slidesByFolder } = useMemo(() => {
    const byFolder: Record<string, string[]> = {};
    const draft: string[] = [];
    const known = new Set(manifest.folders.map((f) => f.id));
    for (const id of slideIds) {
      const folderId = manifest.assignments[id];
      if (folderId && known.has(folderId)) {
        byFolder[folderId] ??= [];
        byFolder[folderId].push(id);
      } else {
        draft.push(id);
      }
    }
    return { draftSlides: draft, slidesByFolder: byFolder };
  }, [manifest]);

  const countFor = (folderId: string | null) =>
    folderId === null ? draftSlides.length : (slidesByFolder[folderId]?.length ?? 0);

  const selectedFolder =
    selectedId === DRAFT_ID ? null : (manifest.folders.find((f) => f.id === selectedId) ?? null);
  const visibleSlides = selectedId === DRAFT_ID ? draftSlides : (slidesByFolder[selectedId] ?? []);

  const title = selectedFolder?.name ?? 'Draft';
  const headerIcon = selectedFolder?.icon ?? { type: 'emoji' as const, value: '📝' };
  const isDraft = selectedId === DRAFT_ID;

  const [query, setQuery] = useState('');
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const reportTitle = useCallback((slideId: string, slideTitle: string) => {
    setTitleMap((prev) => (prev[slideId] === slideTitle ? prev : { ...prev, [slideId]: slideTitle }));
  }, []);

  const trimmedQuery = query.trim().toLowerCase();
  const filteredSlides = useMemo(() => {
    if (!trimmedQuery) return visibleSlides;
    return visibleSlides.filter((id) => {
      if (id.toLowerCase().includes(trimmedQuery)) return true;
      const t = titleMap[id]?.toLowerCase();
      return t ? t.includes(trimmedQuery) : false;
    });
  }, [visibleSlides, titleMap, trimmedQuery]);
  const isSearching = trimmedQuery.length > 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          folders={manifest.folders}
          countFor={countFor}
          selectedId={selectedId}
          onSelect={selectFolder}
          onCreate={(name, icon) => create(name, icon)}
          onRename={(id, name) => update(id, { name })}
          onChangeIcon={(id, icon) => update(id, { icon })}
          onDelete={(id) => {
            if (selectedId === id) selectFolder(DRAFT_ID);
            remove(id);
          }}
          onDropToFolder={(folderId, slideId) => assign(slideId, folderId)}
          onDropToDraft={(slideId) => assign(slideId, null)}
        />
      </div>

      <div className="paper relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
        {/* Mobile chrome */}
        <div className="flex items-center justify-between border-b border-hairline bg-sidebar px-4 py-3 md:hidden">
          <h1 className="font-heading text-lg font-bold tracking-tight">open-slide</h1>
        </div>
        <div className="border-b border-hairline bg-sidebar px-4 py-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <MobileFolderPill
              icon={{ type: 'emoji', value: '📝' }}
              label="Draft"
              count={countFor(null)}
              active={selectedId === DRAFT_ID}
              onClick={() => selectFolder(DRAFT_ID)}
            />
            {manifest.folders.map((f) => (
              <MobileFolderPill
                key={f.id}
                icon={f.icon}
                label={f.name}
                count={countFor(f.id)}
                active={selectedId === f.id}
                onClick={() => selectFolder(f.id)}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-10 md:py-12">
          <header className="mb-8 md:mb-12">
            <div className="flex flex-wrap items-center gap-3">
              <FolderIconChip icon={headerIcon} className="size-7 text-2xl" />
              <h1 className="font-heading text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[44px]">
                {title}
              </h1>
              <span className="folio ml-1 self-end pb-2">
                {(isSearching ? filteredSlides.length : visibleSlides.length)
                  .toString()
                  .padStart(2, '0')}
                {isSearching && (
                  <span className="opacity-40">/{visibleSlides.length.toString().padStart(2, '0')}</span>
                )}
              </span>
              <div className="ml-auto w-full md:w-auto">
                <SearchInput value={query} onChange={setQuery} />
              </div>
            </div>
          </header>

          {visibleSlides.length === 0 ? (
            <EmptyState isDraft={isDraft} folderName={selectedFolder?.name} />
          ) : filteredSlides.length === 0 ? (
            <NoResultsState query={query} onClear={() => setQuery('')} />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-9 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
              {filteredSlides.map((id) => (
                <li key={id}>
                  <SlideCard
                    id={id}
                    folders={manifest.folders}
                    currentFolderId={manifest.assignments[id] ?? null}
                    onRename={(name) => renameSlide(id, name)}
                    onMove={(folderId) => assign(id, folderId)}
                    onDelete={() => deleteSlide(id)}
                    onTitleResolved={reportTitle}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileFolderPill({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: FolderIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
        active
          ? 'border-foreground/40 bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <FolderIconChip icon={icon} className="size-3.5 text-sm" />
      <span className="truncate max-w-[8rem]">{label}</span>
      <span className="folio nums">{count.toString().padStart(2, '0')}</span>
    </button>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full md:w-[240px]">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search slides"
        className="h-8 w-full rounded-[6px] border border-border bg-background pl-8 pr-7 text-[12.5px] outline-none placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

function NoResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-card/60 px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">No matches</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Nothing matches{' '}
          <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span> in this folder.
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onClear}>
          Clear search
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ isDraft, folderName }: { isDraft: boolean; folderName?: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-card/60 px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
          <FolderPlus className="size-5" />
        </div>
        {isDraft ? (
          <>
            <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">
              No slides yet
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Create{' '}
              <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
                slides/my-slide/index.tsx
              </code>{' '}
              that{' '}
              <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
                export default [Page1, Page2]
              </code>
              .
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">
              {folderName ?? 'This folder'} is empty
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Drag a slide from Draft into this folder in the sidebar.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function createDragChip(title: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const chip = document.createElement('div');
  chip.style.cssText = [
    'position: fixed',
    'top: -9999px',
    'left: -9999px',
    'display: inline-flex',
    'align-items: center',
    'gap: 8px',
    'padding: 6px 10px 6px 6px',
    'border-radius: 6px',
    'background: var(--card)',
    'color: var(--foreground)',
    'border: 1px solid var(--border)',
    'box-shadow: 0 12px 32px -8px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.08)',
    'font: 500 12.5px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    'white-space: nowrap',
    'pointer-events: none',
    'z-index: 9999',
  ].join(';');

  const thumb = document.createElement('span');
  thumb.style.cssText = [
    'display: inline-block',
    'width: 30px',
    'height: 18px',
    'border-radius: 3px',
    'background: var(--muted)',
    'border: 1px solid var(--border)',
    'flex: 0 0 auto',
  ].join(';');

  const label = document.createElement('span');
  label.textContent = title;
  label.style.cssText = 'overflow: hidden; text-overflow: ellipsis; max-width: 220px;';

  chip.appendChild(thumb);
  chip.appendChild(label);
  document.body.appendChild(chip);
  return chip;
}

type DialogKind = null | 'rename' | 'move' | 'delete';

function SlideCard({
  id,
  folders,
  currentFolderId,
  onRename,
  onMove,
  onDelete,
  onTitleResolved,
}: {
  id: string;
  folders: Folder[];
  currentFolderId: string | null;
  onRename: (name: string) => Promise<void> | void;
  onMove: (folderId: string | null) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onTitleResolved?: (id: string, title: string) => void;
}) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);

  useEffect(() => {
    let cancelled = false;
    loadSlide(id)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const FirstPage = slide?.default[0];
  const displayTitle = slide?.meta?.title ?? id;

  useEffect(() => {
    if (slide && onTitleResolved) onTitleResolved(id, displayTitle);
  }, [id, slide, displayTitle, onTitleResolved]);

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag source wraps an interactive Link */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(SLIDE_DND_MIME, id);
          e.dataTransfer.effectAllowed = 'move';
          const chip = createDragChip(displayTitle);
          if (chip) {
            e.dataTransfer.setDragImage(chip, 14, 14);
            setTimeout(() => chip.remove(), 0);
          }
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={cn(
          'group relative motion-safe:transition-opacity',
          dragging && 'opacity-40',
        )}
      >
        <Link to={`/s/${id}`} className="block focus-visible:outline-none">
          {/* Slide thumb — tight border, grey baseboard, no shadcn rounded-xl */}
          <div className="relative aspect-video overflow-hidden rounded-[6px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04] group-hover:shadow-floating group-hover:ring-foreground/20 motion-safe:transition-[box-shadow,--tw-ring-color] motion-safe:duration-200">
            {FirstPage ? (
              <div className="h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
                <SlideCanvas flat freezeMotion design={slide?.design}>
                  <FirstPage />
                </SlideCanvas>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center text-[10px] tracking-[0.16em] uppercase text-muted-foreground/60">
                Loading
              </div>
            )}
          </div>

          <div className="mt-3">
            <h3 className="min-w-0 truncate font-heading text-[14px] font-medium tracking-tight">
              {displayTitle}
            </h3>
          </div>
        </Link>

        {import.meta.env.DEV && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="flex size-7 items-center justify-center rounded-[5px] bg-card/90 text-foreground shadow-edge ring-1 ring-border opacity-0 backdrop-blur hover:bg-card group-hover:opacity-100 aria-expanded:opacity-100 motion-safe:transition-opacity"
                  aria-label="Slide actions"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onSelect={() => setDialog('rename')}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog('move')}>
                  <FolderInput />
                  Move to folder…
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <RenameDialog
        open={dialog === 'rename'}
        initialName={displayTitle}
        onOpenChange={(v) => setDialog(v ? 'rename' : null)}
        onSubmit={async (name) => {
          await onRename(name);
          setDialog(null);
        }}
      />
      <MoveDialog
        open={dialog === 'move'}
        slideName={displayTitle}
        folders={folders}
        currentFolderId={currentFolderId}
        onOpenChange={(v) => setDialog(v ? 'move' : null)}
        onSubmit={async (folderId) => {
          await onMove(folderId);
          setDialog(null);
        }}
      />
      <DeleteDialog
        open={dialog === 'delete'}
        slideName={displayTitle}
        onOpenChange={(v) => setDialog(v ? 'delete' : null)}
        onConfirm={async () => {
          await onDelete();
          setDialog(null);
        }}
      />
    </>
  );
}

function RenameDialog({
  open,
  initialName,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initialName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialName);
      setSubmitting(false);
      queueMicrotask(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, initialName]);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialName) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="eyebrow">Rename</span>
          <DialogTitle>Rename slide</DialogTitle>
          <DialogDescription>Give this slide a new display name.</DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={80}
          placeholder="Slide name"
          className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-[13px] outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={submitting} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoveDialog({
  open,
  slideName,
  folders,
  currentFolderId,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  slideName: string;
  folders: Folder[];
  currentFolderId: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderId: string | null) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<string | null>(currentFolderId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(currentFolderId);
      setSubmitting(false);
    }
  }, [open, currentFolderId]);

  const submit = async () => {
    if (selected === currentFolderId) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="eyebrow">Move</span>
          <DialogTitle>Move slide</DialogTitle>
          <DialogDescription>
            Choose a folder for <span className="font-medium text-foreground">{slideName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[320px] overflow-y-auto rounded-[6px] border border-border bg-background">
          <FolderOption
            icon={{ type: 'emoji', value: '📝' }}
            label="Draft"
            active={selected === null}
            onClick={() => setSelected(null)}
          />
          {folders.map((f) => (
            <FolderOption
              key={f.id}
              icon={f.icon}
              label={f.name}
              active={selected === f.id}
              onClick={() => setSelected(f.id)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={submitting || selected === currentFolderId} onClick={submit}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: FolderIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 border-b border-hairline px-3 py-2 text-left text-[13px] transition-colors last:border-b-0',
        active ? 'bg-muted text-foreground' : 'hover:bg-muted/60',
      )}
    >
      <FolderIconChip icon={icon} />
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-brand">
          <span className="inline-block size-1 rounded-full bg-brand" aria-hidden />
          Selected
        </span>
      )}
    </button>
  );
}

function DeleteDialog({
  open,
  slideName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  slideName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="eyebrow text-destructive/80">Destructive</span>
          <DialogTitle>Delete slide?</DialogTitle>
          <DialogDescription>
            This permanently removes{' '}
            <span className="font-medium text-foreground">{slideName}</span> and its files from
            disk. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" disabled={submitting} onClick={confirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
