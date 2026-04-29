import {
  ArrowDownToLine,
  File as FileIcon,
  FileImage,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
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
import {
  type AssetEntry,
  fetchSvgAsFile,
  type SvglItem,
  searchSvgl,
  useAssets,
} from '@/lib/assets';
import { cn } from '@/lib/utils';

type Props = { slideId: string };

type ConflictState = {
  file: File;
  resolve: (decision: 'replace' | 'rename' | 'cancel') => void;
};

export function AssetView({ slideId }: Props) {
  const { assets, loading, available, upload, rename, remove } = useAssets(slideId);
  const [dragActive, setDragActive] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [preview, setPreview] = useState<AssetEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AssetEntry | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [logoSearchOpen, setLogoSearchOpen] = useState(false);
  const dragDepth = useRef(0);
  const inputId = useId();

  const existingNames = new Set(assets.map((a) => a.name));

  async function handleFile(file: File) {
    if (!available) return;
    if (existingNames.has(file.name)) {
      const decision = await new Promise<'replace' | 'rename' | 'cancel'>((resolve) => {
        setConflict({ file, resolve });
      });
      if (decision === 'cancel') return;
      if (decision === 'replace') {
        const res = await upload(file, { overwrite: true });
        if (!res.ok) toast.error(`Upload failed (${res.status})`);
        return;
      }
      const next = renamedCopy(file, existingNames);
      const res = await upload(next, { overwrite: false });
      if (!res.ok) toast.error(`Upload failed (${res.status})`);
      return;
    }
    const res = await upload(file);
    if (!res.ok) toast.error(`Upload failed (${res.status})`);
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const f of list) {
      // Sequential — keeps the conflict dialog UX coherent and avoids
      // hammering the dev server's filesystem mutations in parallel.
      await handleFile(f);
    }
  }

  if (!available) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Asset management is only available in dev mode.
      </div>
    );
  }

  return (
    <section
      aria-label="Slide assets"
      className={cn('relative flex h-full flex-col bg-background')}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragActive(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files).catch(() => {});
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-card px-6 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight">Assets</h2>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">slides/{slideId}/assets/</span>
            {!loading && (
              <>
                <span className="mx-1.5">·</span>
                <span>{assets.length === 1 ? '1 file' : `${assets.length} files`}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLogoSearchOpen(true)}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition-colors',
              'hover:bg-muted active:translate-y-px',
            )}
          >
            <Search className="size-4" />
            <span>Search logos</span>
          </button>
          <label
            htmlFor={inputId}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity',
              'hover:opacity-90 active:translate-y-px',
            )}
          >
            <Upload className="size-4" />
            <span>Upload</span>
          </label>
          <input
            id={inputId}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files).catch(() => {});
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : assets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-6">
            {assets.map((asset) =>
              renaming === asset.name ? (
                <RenameCard
                  key={asset.name}
                  asset={asset}
                  onCancel={() => setRenaming(null)}
                  onSubmit={async (next) => {
                    if (next === asset.name) {
                      setRenaming(null);
                      return;
                    }
                    if (existingNames.has(next)) {
                      toast.error('A file with that name already exists.');
                      return;
                    }
                    const res = await rename(asset.name, next);
                    if (!res.ok) {
                      toast.error(`Rename failed (${res.status})`);
                      return;
                    }
                    setRenaming(null);
                  }}
                />
              ) : (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onPreview={() => setPreview(asset)}
                  onRename={() => setRenaming(asset.name)}
                  onDelete={() => setConfirmDelete(asset)}
                />
              ),
            )}
          </div>
        )}
      </div>

      {dragActive && (
        <div
          className="pointer-events-none absolute inset-0 z-30 animate-in fade-in-0 duration-200"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-foreground/[0.03]" />
          <div className="absolute inset-2 rounded-xl border border-dashed border-foreground/25" />
          <div className="absolute inset-x-0 bottom-8 flex justify-center">
            <div className="flex animate-in items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium shadow-sm fade-in-0 slide-in-from-bottom-1 duration-300">
              <ArrowDownToLine className="size-3.5 text-muted-foreground" />
              <span>Drop to upload</span>
            </div>
          </div>
        </div>
      )}

      {conflict && (
        <ConflictDialog
          file={conflict.file}
          onChoose={(decision) => {
            conflict.resolve(decision);
            setConflict(null);
          }}
        />
      )}

      {confirmDelete && (
        <DeleteDialog
          asset={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const target = confirmDelete;
            setConfirmDelete(null);
            const res = await remove(target.name);
            if (!res.ok) toast.error(`Delete failed (${res.status})`);
          }}
        />
      )}

      {preview && <PreviewDialog asset={preview} onClose={() => setPreview(null)} />}

      {logoSearchOpen && (
        <LogoSearchDialog
          onClose={() => setLogoSearchOpen(false)}
          onPick={(file) => handleFile(file)}
        />
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <ImageIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No assets yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop files anywhere here or click Upload to add them.
        </p>
      </div>
    </div>
  );
}

function hasFiles(e: React.DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  for (let i = 0; i < types.length; i++) {
    if (types[i] === 'Files') return true;
  }
  return false;
}

function renamedCopy(file: File, taken: Set<string>): File {
  const dot = file.name.lastIndexOf('.');
  const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot) : '';
  let i = 1;
  let next = `${stem}-${i}${ext}`;
  while (taken.has(next)) {
    i += 1;
    next = `${stem}-${i}${ext}`;
  }
  return new File([file], next, { type: file.type, lastModified: file.lastModified });
}

function AssetCard({
  asset,
  onPreview,
  onRename,
  onDelete,
}: {
  asset: AssetEntry;
  onPreview: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const isImage = asset.mime.startsWith('image/');
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${asset.name}`}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]"
      >
        {isImage ? (
          <img
            src={asset.url}
            alt=""
            className="size-full object-contain"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <FileIcon className="size-10 text-muted-foreground" />
        )}
      </button>

      <div className="flex items-center gap-1 border-t bg-card px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" title={asset.name}>
            {asset.name}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{formatSize(asset.size)}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            aria-label={`Actions for ${asset.name}`}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
              'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100',
            )}
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onSelect={onPreview}>
              <ImageIcon />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function RenameCard({
  asset,
  onCancel,
  onSubmit,
}: {
  asset: AssetEntry;
  onCancel: () => void;
  onSubmit: (next: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(asset.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      inputRef.current?.focus();
      const dot = asset.name.lastIndexOf('.');
      if (dot > 0) inputRef.current?.setSelectionRange(0, dot);
      else inputRef.current?.select();
    });
  }, [asset.name]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSaving(false);
    }
  };

  const isImage = asset.mime.startsWith('image/');
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border-2 border-primary bg-card shadow-sm">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
        {isImage ? (
          <img src={asset.url} alt="" className="size-full object-contain" draggable={false} />
        ) : (
          <FileIcon className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="border-t bg-card px-2 py-2">
        <input
          ref={inputRef}
          value={value}
          disabled={saving}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!saving) commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          maxLength={120}
          className="w-full rounded-md border bg-background px-2 py-1 text-sm outline-none ring-ring/40 focus:ring-2"
        />
      </div>
    </div>
  );
}

function ConflictDialog({
  file,
  onChoose,
}: {
  file: File;
  onChoose: (decision: 'replace' | 'rename' | 'cancel') => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onChoose('cancel')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File already exists</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{file.name}</span> is already in this slide's assets folder.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onChoose('cancel')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onChoose('rename')}>
            Rename copy
          </Button>
          <Button onClick={() => onChoose('replace')}>Replace</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  asset,
  onCancel,
  onConfirm,
}: {
  asset: AssetEntry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete asset</DialogTitle>
          <DialogDescription>
            Delete <span className="font-mono">{asset.name}</span>? Imports referencing this file in
            the slide will break.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ asset, onClose }: { asset: AssetEntry; onClose: () => void }) {
  const isImage = asset.mime.startsWith('image/');
  const importPath = `./assets/${asset.name}`;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{asset.name}</DialogTitle>
          <DialogDescription>
            {formatSize(asset.size)} · {asset.mime}
          </DialogDescription>
        </DialogHeader>
        {isImage ? (
          <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-md border bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
            <img
              src={asset.url}
              alt={asset.name}
              className="max-h-[60vh] max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-md border bg-muted/40 py-12 text-muted-foreground">
            <FileImage className="mr-2 size-5" />
            <span className="text-sm">No preview available</span>
          </div>
        )}
        <div className="rounded-md border bg-muted/40 p-2 font-mono text-xs">
          import asset from '<span className="font-semibold">{importPath}</span>';
        </div>
      </DialogContent>
    </Dialog>
  );
}

const SKELETON_SLOTS = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

function LogoSearchDialog({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (file: File) => Promise<void> | void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SvglItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<number>>(() => new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchSvgl(query, ctrl.signal)
        .then((next) => {
          setResults(next);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return;
          setError(err instanceof Error ? err.message : 'Search failed');
          setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search logos</DialogTitle>
          <DialogDescription>
            Powered by{' '}
            <a
              href="https://svgl.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              svgl.app
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand…"
            className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none ring-ring/40 focus:ring-2"
          />
        </div>

        <div className="max-h-[60vh] min-h-[16rem] overflow-y-auto">
          {error ? (
            <div className="flex h-32 items-center justify-center text-sm text-destructive">
              {error}
            </div>
          ) : loading && !results ? (
            <div className="grid grid-cols-3 gap-3">
              {SKELETON_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="aspect-square animate-pulse rounded-lg border bg-muted/40"
                />
              ))}
            </div>
          ) : results && results.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No logos found.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {results?.map((item) => (
                <LogoResultCard
                  key={item.id}
                  item={item}
                  pending={pending.has(item.id)}
                  onAdd={async (file) => {
                    setPending((prev) => {
                      const next = new Set(prev);
                      next.add(item.id);
                      return next;
                    });
                    try {
                      await onPick(file);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to download logo');
                    } finally {
                      setPending((prev) => {
                        const next = new Set(prev);
                        next.delete(item.id);
                        return next;
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogoResultCard({
  item,
  pending,
  onAdd,
}: {
  item: SvglItem;
  pending: boolean;
  onAdd: (file: File) => Promise<void> | void;
}) {
  const hasVariants = typeof item.route === 'object' && item.route !== null;
  const [variant, setVariant] = useState<'light' | 'dark'>('light');

  const previewUrl = useMemo(() => {
    if (typeof item.route === 'string') return item.route;
    return item.route[variant];
  }, [item.route, variant]);

  const filename = useMemo(() => {
    const url = previewUrl;
    const fromUrl = basenameFromUrl(url);
    if (fromUrl) return fromUrl;
    const slug = slugify(item.title);
    return hasVariants ? `${slug}-${variant}.svg` : `${slug}.svg`;
  }, [previewUrl, item.title, hasVariants, variant]);

  const category = Array.isArray(item.category) ? item.category.join(', ') : item.category;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card">
      <div
        className={cn(
          'relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]',
          variant === 'dark' && hasVariants && 'bg-neutral-900',
        )}
      >
        <img src={previewUrl} alt={item.title} className="size-3/4 object-contain" />
      </div>
      <div className="flex flex-col gap-1.5 border-t bg-card px-2.5 py-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium" title={item.title}>
            {item.title}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">{category}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasVariants ? (
            <div className="flex overflow-hidden rounded-md border text-[10px]">
              <button
                type="button"
                onClick={() => setVariant('light')}
                className={cn(
                  'px-1.5 py-0.5 transition-colors',
                  variant === 'light' ? 'bg-foreground text-background' : 'hover:bg-muted',
                )}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setVariant('dark')}
                className={cn(
                  'border-l px-1.5 py-0.5 transition-colors',
                  variant === 'dark' ? 'bg-foreground text-background' : 'hover:bg-muted',
                )}
              >
                Dark
              </button>
            </div>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              try {
                const file = await fetchSvgAsFile(previewUrl, filename);
                await onAdd(file);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to download logo');
              }
            }}
            className="ml-auto h-6 px-2 text-[11px]"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function basenameFromUrl(u: string): string {
  try {
    return new URL(u).pathname.split('/').pop() || '';
  } catch {
    return '';
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
