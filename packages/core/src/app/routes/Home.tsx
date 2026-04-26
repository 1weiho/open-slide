import { FolderInput, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { SlideCanvas } from '../components/SlideCanvas';
import { FolderIconChip, SLIDE_DND_MIME } from '../components/sidebar/FolderItem';
import { DRAFT_ID, Sidebar } from '../components/sidebar/Sidebar';
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b bg-card/40 px-4 py-3 md:hidden">
          <div className="mb-2 font-heading text-lg font-bold tracking-tight">open-slide</div>
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

        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-12">
          <header className="mb-6 flex items-center gap-3 md:mb-8">
            <FolderIconChip icon={headerIcon} className="size-6 text-xl" />
            <h2 className="font-heading text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
            <span className="text-sm text-muted-foreground">
              {visibleSlides.length} slide{visibleSlides.length === 1 ? '' : 's'}
            </span>
          </header>

          {visibleSlides.length === 0 ? (
            <EmptyState isDraft={selectedId === DRAFT_ID} folderName={selectedFolder?.name} />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-5">
              {visibleSlides.map((id) => (
                <li key={id}>
                  <SlideCard
                    id={id}
                    folders={manifest.folders}
                    currentFolderId={manifest.assignments[id] ?? null}
                    onRename={(name) => renameSlide(id, name)}
                    onMove={(folderId) => assign(id, folderId)}
                    onDelete={() => deleteSlide(id)}
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
      className={
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
        (active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:text-foreground')
      }
    >
      <FolderIconChip icon={icon} className="size-4 text-sm" />
      <span className="truncate max-w-[8rem]">{label}</span>
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function EmptyState({ isDraft, folderName }: { isDraft: boolean; folderName?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <FolderPlus className="size-8 opacity-50" />
        {isDraft ? (
          <>
            <p>No slides yet.</p>
            <p className="text-sm">
              Create{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                slides/my-slide/index.tsx
              </code>{' '}
              with{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                export default [Page1, Page2]
              </code>
              .
            </p>
          </>
        ) : (
          <>
            <p>No slides in {folderName ?? 'this folder'}.</p>
            <p className="text-sm">Drag a slide from Draft into the sidebar folder.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type DialogKind = null | 'rename' | 'move' | 'delete';

function SlideCard({
  id,
  folders,
  currentFolderId,
  onRename,
  onMove,
  onDelete,
}: {
  id: string;
  folders: Folder[];
  currentFolderId: string | null;
  onRename: (name: string) => Promise<void> | void;
  onMove: (folderId: string | null) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
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
  const pageCount = slide?.default.length ?? 0;

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag source wraps an interactive Link */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(SLIDE_DND_MIME, id);
          e.dataTransfer.effectAllowed = 'move';
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={cn('group relative', dragging && 'opacity-50')}
      >
        <Link
          to={`/s/${id}`}
          className="block overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:ring-foreground/20 hover:shadow-lg"
        >
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50">
            {FirstPage ? (
              <SlideCanvas flat>
                <FirstPage />
              </SlideCanvas>
            ) : (
              <div className="grid h-full w-full place-items-center text-xs tracking-widest uppercase text-muted-foreground/60">
                Loading
              </div>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <span className="truncate text-sm font-medium">{displayTitle}</span>
            {pageCount > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {pageCount} page{pageCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </Link>

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="flex size-7 items-center justify-center rounded-md bg-background/80 text-foreground shadow-sm ring-1 ring-foreground/10 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100 aria-expanded:opacity-100"
                aria-label="Slide actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onSelect={() => setDialog('rename')}>
                <Pencil />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('move')}>
                <FolderInput />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
          className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-ring/40 focus:ring-2"
        />
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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
          <DialogTitle>Move slide</DialogTitle>
          <DialogDescription>
            Choose a folder for <span className="font-medium text-foreground">{slideName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[320px] overflow-y-auto rounded-md border">
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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
        'flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 transition-colors',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
      )}
    >
      <FolderIconChip icon={icon} />
      <span className="truncate">{label}</span>
      {active && <span className="ml-auto text-xs tracking-wide opacity-70">Selected</span>}
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
          <DialogTitle>Delete slide?</DialogTitle>
          <DialogDescription>
            This permanently removes{' '}
            <span className="font-medium text-foreground">{slideName}</span> and its files from
            disk. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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
