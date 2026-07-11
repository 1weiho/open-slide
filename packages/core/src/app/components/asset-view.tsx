import {
  ArrowDownToLine,
  CloudOff,
  File as FileIcon,
  FileImage,
  ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Pencil,
  RotateCw,
  Search,
  SearchX,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type AssetTypeFilter, type AssetUsageFilter, filterAssets } from '@/lib/asset-filter';
import {
  type AssetEntry,
  type AssetUsage,
  fetchSvgAsFile,
  listAssetUsages,
  renamedCopy,
  revertAssetUsage,
  type SvglItem,
  searchSvgl,
  useAssets,
} from '@/lib/assets';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

type Props = { slideId: string | null };

type Scope = 'slide' | 'global';
type ViewMode = 'grid' | 'list';

const GLOBAL_SLIDE_ID = '@global';
const VIEW_MODE_STORAGE_KEY = 'open-slide:asset-view-mode';

function readViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid';
  try {
    return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function useViewMode(): [ViewMode, (next: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const update = (next: ViewMode) => {
    setViewMode(next);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
    } catch {}
  };
  return [viewMode, update];
}

type ConflictState = {
  file: File;
  resolve: (decision: 'replace' | 'rename' | 'cancel') => void;
};

export function AssetView({ slideId }: Props) {
  const lockedToGlobal = slideId === null;
  const [scope, setScope] = useState<Scope>(lockedToGlobal ? 'global' : 'slide');
  const effectiveSlideId = scope === 'global' || slideId === null ? GLOBAL_SLIDE_ID : slideId;
  const { assets, loading, available, upload, rename, remove } = useAssets(effectiveSlideId);
  const [dragActive, setDragActive] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [preview, setPreview] = useState<AssetEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AssetEntry | null>(null);
  const [confirmDeleteUsages, setConfirmDeleteUsages] = useState<AssetUsage[] | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [logoSearchOpen, setLogoSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<AssetUsageFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>('all');
  const [viewMode, setViewMode] = useViewMode();
  const dragDepth = useRef(0);
  const inputId = useId();
  const t = useLocale();

  const deferredQuery = useDeferredValue(query);
  const visibleAssets = useMemo(
    () =>
      filterAssets(assets, {
        usage: usageFilter,
        type: typeFilter,
        search: deferredQuery,
      }),
    [assets, deferredQuery, typeFilter, usageFilter],
  );
  const existingNames = useMemo(() => new Set(assets.map((asset) => asset.name)), [assets]);

  const clearFilters = () => {
    setQuery('');
    setUsageFilter('all');
    setTypeFilter('all');
  };

  async function handleFile(file: File) {
    if (!available) return;
    if (existingNames.has(file.name)) {
      const decision = await new Promise<'replace' | 'rename' | 'cancel'>((resolve) => {
        setConflict({ file, resolve });
      });
      if (decision === 'cancel') return;
      if (decision === 'replace') {
        const res = await upload(file, { overwrite: true });
        if (!res.ok) toast.error(format(t.asset.toastUploadFailed, { status: res.status }));
        else toast.success(format(t.asset.toastReplaced, { name: file.name }));
        return;
      }
      const next = renamedCopy(file, existingNames);
      const res = await upload(next, { overwrite: false });
      if (!res.ok) toast.error(format(t.asset.toastUploadFailed, { status: res.status }));
      else toast.success(format(t.asset.toastUploadedAs, { name: next.name }));
      return;
    }
    const res = await upload(file);
    if (!res.ok) toast.error(format(t.asset.toastUploadFailed, { status: res.status }));
    else toast.success(format(t.asset.toastUploaded, { name: file.name }));
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const f of list) {
      // Sequential — keeps the conflict dialog UX coherent and avoids
      // hammering the dev server's filesystem mutations in parallel.
      await handleFile(f);
    }
  }

  async function handleRename(asset: AssetEntry, next: string) {
    if (next === asset.name) {
      setRenaming(null);
      return;
    }
    if (existingNames.has(next)) {
      toast.error(t.asset.nameAlreadyExists);
      return;
    }
    const res = await rename(asset.name, next);
    if (!res.ok) {
      toast.error(format(t.asset.toastRenameFailed, { status: res.status }));
      return;
    }
    toast.success(format(t.asset.toastRenamed, { name: next }));
    setRenaming(null);
  }

  function prepareDelete(asset: AssetEntry) {
    setConfirmDelete(asset);
    setConfirmDeleteUsages(null);
    listAssetUsages(effectiveSlideId, asset.name)
      .then((usages) => setConfirmDeleteUsages(usages))
      .catch(() => setConfirmDeleteUsages([]));
  }

  if (!available) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t.asset.devOnlyMessage}
      </div>
    );
  }

  return (
    <section
      aria-label={t.asset.sectionAria}
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
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline bg-sidebar px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {lockedToGlobal ? (
            <span className="eyebrow">{t.asset.eyebrow}</span>
          ) : (
            <Tabs value={scope} onValueChange={(next) => setScope(next as Scope)}>
              <TabsList>
                <TabsTrigger value="slide">{t.asset.scopeSlide}</TabsTrigger>
                <TabsTrigger value="global">{t.asset.scopeGlobal}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <p className="min-w-0 truncate text-[12px] text-muted-foreground">
            <span className="font-mono text-[11.5px]">
              {scope === 'global' ? 'assets/' : `slides/${slideId}/assets/`}
            </span>
            {!loading && (
              <>
                <span className="mx-2 opacity-50">·</span>
                <span className="folio">
                  {format(assets.length === 1 ? t.asset.fileCount.one : t.asset.fileCount.other, {
                    count: assets.length.toString().padStart(2, '0'),
                  })}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLogoSearchOpen(true)}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] border border-border bg-card px-2.5 text-[12.5px] font-medium transition-colors',
              'hover:bg-muted/60 hover:border-foreground/20 active:translate-y-px',
            )}
          >
            <Search className="size-3.5" />
            <span>{t.asset.searchLogos}</span>
          </button>
          <label
            htmlFor={inputId}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] bg-foreground px-3 text-[12.5px] font-medium text-background transition-colors',
              'shadow-[inset_0_1px_0_oklch(1_0_0/0.12),0_1px_0_oklch(0_0_0/0.12)]',
              'hover:bg-foreground/90 active:translate-y-px',
            )}
          >
            <Upload className="size-3.5" />
            <span>{t.asset.upload}</span>
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

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-hairline bg-background px-4 py-2.5 sm:px-6">
        <div className="relative min-w-[180px] flex-1 md:max-w-[280px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t.asset.assetSearchPlaceholder}
            placeholder={t.asset.assetSearchPlaceholder}
            className="h-8 w-full rounded-[6px] border border-border bg-background pl-8 pr-7 text-[12.5px] outline-none placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t.asset.clearAssetSearch}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        <Select
          value={usageFilter}
          onValueChange={(next) => setUsageFilter(next as AssetUsageFilter)}
        >
          <SelectTrigger aria-label={t.asset.usageFilterAria} className="h-8 min-w-[112px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">{t.asset.usageAll}</SelectItem>
            <SelectItem value="used">{t.asset.usageUsed}</SelectItem>
            <SelectItem value="unused">{t.asset.usageUnused}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(next) => setTypeFilter(next as AssetTypeFilter)}>
          <SelectTrigger aria-label={t.asset.typeFilterAria} className="h-8 min-w-[108px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">{t.asset.typeAll}</SelectItem>
            <SelectItem value="image">{t.asset.typeImage}</SelectItem>
            <SelectItem value="font">{t.asset.typeFont}</SelectItem>
            <SelectItem value="video">{t.asset.typeVideo}</SelectItem>
            <SelectItem value="other">{t.asset.typeOther}</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(next) => {
            if (next) setViewMode(next as ViewMode);
          }}
          variant="outline"
          className="ml-auto"
        >
          <ToggleGroupItem
            value="grid"
            aria-label={t.asset.gridViewAria}
            title={t.asset.gridViewAria}
            className="size-8 px-0"
          >
            <LayoutGrid className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label={t.asset.listViewAria}
            title={t.asset.listViewAria}
            className="size-8 px-0"
          >
            <List className="size-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t.asset.loading}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState />
        ) : visibleAssets.length === 0 ? (
          <NoMatchingAssets onClear={clearFilters} />
        ) : (
          <div
            className={cn(
              'p-4 sm:p-6',
              viewMode === 'grid'
                ? 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4'
                : 'flex flex-col gap-1',
            )}
          >
            {visibleAssets.map((asset) =>
              renaming === asset.name ? (
                <RenameAsset
                  key={asset.name}
                  asset={asset}
                  viewMode={viewMode}
                  onCancel={() => setRenaming(null)}
                  onSubmit={(next) => handleRename(asset, next)}
                />
              ) : viewMode === 'grid' ? (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onPreview={() => setPreview(asset)}
                  onRename={() => setRenaming(asset.name)}
                  onDelete={() => prepareDelete(asset)}
                />
              ) : (
                <AssetListItem
                  key={asset.name}
                  asset={asset}
                  onPreview={() => setPreview(asset)}
                  onRename={() => setRenaming(asset.name)}
                  onDelete={() => prepareDelete(asset)}
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
          <div className="absolute inset-0 bg-brand/5" />
          <div className="absolute inset-2 rounded-[10px] border border-dashed border-brand/40" />
          <div className="absolute inset-x-0 bottom-8 flex justify-center">
            <div className="flex animate-in items-center gap-2 rounded-[6px] border border-border bg-card px-3 py-1.5 text-[12px] font-medium shadow-floating fade-in-0 slide-in-from-bottom-1 duration-300">
              <ArrowDownToLine className="size-3.5 text-brand" />
              <span>{t.asset.dropToUpload}</span>
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
          usages={confirmDeleteUsages}
          onCancel={() => {
            setConfirmDelete(null);
            setConfirmDeleteUsages(null);
          }}
          onConfirm={async () => {
            const target = confirmDelete;
            const usages = confirmDeleteUsages ?? [];
            setConfirmDelete(null);
            setConfirmDeleteUsages(null);
            const assetPath =
              scope === 'global' ? `@assets/${target.name}` : `./assets/${target.name}`;
            for (const u of usages) {
              const rev = await revertAssetUsage(u.slideId, assetPath);
              if (!rev.ok) {
                toast.error(format(t.asset.toastRevertFailed, { slideId: u.slideId }));
                return;
              }
            }
            const res = await remove(target.name);
            if (!res.ok) {
              toast.error(format(t.asset.toastDeleteFailed, { status: res.status }));
              return;
            }
            const totalUsages = usages.reduce((acc, u) => acc + u.count, 0);
            if (totalUsages > 0) {
              toast.success(
                format(t.asset.toastDeletedWithRevert, {
                  name: target.name,
                  count: totalUsages,
                }),
              );
            } else {
              toast.success(format(t.asset.toastDeleted, { name: target.name }));
            }
          }}
        />
      )}

      {preview && <PreviewDialog asset={preview} scope={scope} onClose={() => setPreview(null)} />}

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
  const t = useLocale();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
        <ImageIcon className="size-5" />
      </div>
      <div>
        <p className="font-heading text-[14px] font-semibold tracking-tight">
          {t.asset.noAssetsYet}
        </p>
        <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
          {t.asset.noAssetsHintPrefix}
          <span className="font-mono text-foreground">{t.asset.upload}</span>
          {t.asset.noAssetsHintSuffix}
        </p>
      </div>
    </div>
  );
}

function NoMatchingAssets({ onClear }: { onClear: () => void }) {
  const t = useLocale();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
        <SearchX className="size-5" />
      </div>
      <div>
        <p className="font-heading text-[14px] font-semibold tracking-tight">
          {t.asset.noMatchingAssets}
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{t.asset.noMatchingAssetsHint}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        {t.asset.clearFilters}
      </Button>
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
  const t = useLocale();
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[6px] border border-border bg-card shadow-edge transition-shadow hover:shadow-floating focus-within:ring-2 focus-within:ring-ring/30">
      <button
        type="button"
        onClick={onPreview}
        aria-label={format(t.asset.previewAria, { name: asset.name })}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-hairline bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:14px_14px]"
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
          <FileIcon className="size-9 text-muted-foreground" />
        )}
      </button>

      <div className="flex items-center gap-1 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium" title={asset.name}>
            {asset.name}
          </div>
          <div className="folio flex items-center gap-1.5">
            <span className="truncate">{formatSize(asset.size)}</span>
            <UsageBadge unused={asset.unused} />
          </div>
        </div>
        <AssetActions asset={asset} onPreview={onPreview} onRename={onRename} onDelete={onDelete} />
      </div>
    </div>
  );
}

function AssetListItem({
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
  const t = useLocale();
  return (
    <div className="group flex min-h-14 items-center gap-3 rounded-[6px] border border-border bg-card p-2 shadow-edge transition-shadow hover:shadow-floating focus-within:ring-2 focus-within:ring-ring/30">
      <button
        type="button"
        onClick={onPreview}
        aria-label={format(t.asset.previewAria, { name: asset.name })}
        className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-hairline bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:10px_10px]"
      >
        {isImage ? (
          <img
            src={asset.url}
            alt=""
            className="size-full object-contain"
            draggable={false}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <FileIcon className="size-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium" title={asset.name}>
          {asset.name}
        </div>
        <div className="folio mt-0.5 flex items-center gap-1.5 sm:hidden">
          <span>{formatSize(asset.size)}</span>
          <span className="opacity-40">·</span>
          <span className="truncate">{asset.mime}</span>
          <UsageBadge unused={asset.unused} showUsed />
        </div>
      </div>
      <span className="hidden w-40 shrink-0 truncate font-mono text-[11px] text-muted-foreground md:block">
        {asset.mime}
      </span>
      <span className="folio hidden w-16 shrink-0 sm:block">{formatSize(asset.size)}</span>
      <div className="hidden w-16 shrink-0 justify-end sm:flex">
        <UsageBadge unused={asset.unused} showUsed />
      </div>
      <AssetActions asset={asset} onPreview={onPreview} onRename={onRename} onDelete={onDelete} />
    </div>
  );
}

function AssetActions({
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
  const t = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={format(t.asset.actionsAria, { name: asset.name })}
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
          {t.asset.previewMenuItem}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil />
          {t.asset.renameMenuItem}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete}>
          <Trash2 />
          {t.asset.deleteMenuItem}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UsageBadge({ unused, showUsed = false }: { unused: boolean; showUsed?: boolean }) {
  const t = useLocale();
  if (!unused && !showUsed) return null;
  return (
    <span
      className={cn(
        'shrink-0 rounded-sm px-1 py-px text-[10px] font-medium leading-none',
        unused
          ? 'bg-muted text-muted-foreground'
          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      )}
    >
      {unused ? t.asset.usageUnused : t.asset.usageUsed}
    </span>
  );
}

function RenameAsset({
  asset,
  viewMode,
  onCancel,
  onSubmit,
}: {
  asset: AssetEntry;
  viewMode: ViewMode;
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
  if (viewMode === 'list') {
    return (
      <div className="flex min-h-14 items-center gap-3 rounded-[6px] border border-primary bg-card p-2 shadow-edge ring-2 ring-primary/15">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-hairline bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:10px_10px]">
          {isImage ? (
            <img src={asset.url} alt="" className="size-full object-contain" draggable={false} />
          ) : (
            <FileIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          value={value}
          disabled={saving}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => {
            if (!saving) commit();
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          maxLength={120}
          className="h-8 min-w-0 flex-1 rounded-[5px] border bg-background px-2.5 text-[12.5px] outline-none ring-ring/40 focus:ring-2"
        />
        <span className="folio hidden w-16 shrink-0 sm:block">{formatSize(asset.size)}</span>
        <div className="hidden w-16 shrink-0 justify-end sm:flex">
          <UsageBadge unused={asset.unused} showUsed />
        </div>
        <div className="size-6 shrink-0" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[6px] border border-primary bg-card shadow-edge ring-2 ring-primary/15">
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
            if (e.nativeEvent.isComposing) return;
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
  const t = useLocale();
  const [descPrefix, descSuffix] = t.asset.conflictDescription.split('{name}');
  return (
    <Dialog open onOpenChange={(open) => !open && onChoose('cancel')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.asset.conflictTitle}</DialogTitle>
          <DialogDescription>
            {descPrefix}
            <span className="font-mono">{file.name}</span>
            {descSuffix}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onChoose('cancel')}>
            {t.common.cancel}
          </Button>
          <Button variant="outline" onClick={() => onChoose('rename')}>
            {t.asset.conflictRenameCopy}
          </Button>
          <Button onClick={() => onChoose('replace')}>{t.asset.conflictReplace}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  asset,
  usages,
  onCancel,
  onConfirm,
}: {
  asset: AssetEntry;
  usages: AssetUsage[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useLocale();
  const inUse = (usages?.length ?? 0) > 0;
  const totalUses = usages?.reduce((acc, u) => acc + u.count, 0) ?? 0;
  const slideCount = usages?.length ?? 0;
  const [descPrefix, descSuffix] = t.asset.deleteAssetDescription.split('{name}');
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.asset.deleteAssetTitle}</DialogTitle>
          <DialogDescription>
            {inUse ? (
              <>
                {format(t.asset.deleteAssetInUseDescription, {
                  name: asset.name,
                  count: totalUses,
                  slides: slideCount,
                })}{' '}
                {t.asset.deleteAssetInUseHint}
              </>
            ) : (
              <>
                {descPrefix}
                <span className="font-mono">{asset.name}</span>
                {descSuffix}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {inUse && usages && (
          <ul className="max-h-40 overflow-y-auto rounded-[5px] border border-hairline bg-muted/40 px-3 py-2 font-mono text-[11.5px] leading-relaxed">
            {usages.map((u) => (
              <li key={u.slideId} className="flex items-center justify-between gap-3">
                <span className="truncate">{u.slideId}</span>
                <span className="text-muted-foreground">×{u.count}</span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={usages === null}>
            {inUse ? t.asset.deleteAndRevert : t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoResultsMessage({ query, t }: { query: string; t: ReturnType<typeof useLocale> }) {
  const [prefix, suffix] = t.asset.logoSearchNoResults.split('{query}');
  return (
    <>
      {prefix}
      <span className="font-mono text-foreground">{query}</span>
      {suffix}
    </>
  );
}

function PreviewDialog({
  asset,
  scope,
  onClose,
}: {
  asset: AssetEntry;
  scope: Scope;
  onClose: () => void;
}) {
  const isImage = asset.mime.startsWith('image/');
  const importPath = scope === 'global' ? `@assets/${asset.name}` : `./assets/${asset.name}`;
  const t = useLocale();
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
            <span className="text-sm">{t.asset.noPreview}</span>
          </div>
        )}
        <div className="rounded-[5px] border border-hairline bg-muted/50 px-3 py-2 font-mono text-[11.5px] leading-relaxed">
          <span className="text-muted-foreground">{t.asset.importHintComment}</span>
          <span className="text-brand">'{importPath}'</span>
          <span className="text-muted-foreground">{t.asset.importHintSemi}</span>
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
  const [retryToken, setRetryToken] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = useLocale();

  useEffect(() => {
    queueMicrotask(() => inputRef.current?.focus());
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryToken is a bump-to-refetch trigger
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
          setError(err instanceof Error ? err.message : t.asset.toastSearchFailed);
          setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, retryToken]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.asset.logoSearchTitle}</DialogTitle>
          <DialogDescription>
            {t.asset.logoSearchPoweredByPrefix}
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
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.asset.logoSearchPlaceholder}
            className="h-9 w-full rounded-[6px] border border-border bg-background py-2 pl-8 pr-3 text-[13px] outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <div className="max-h-[60vh] min-h-[16rem] overflow-y-auto">
          {error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CloudOff className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.asset.logoSearchErrorTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.asset.logoSearchErrorBody}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRetryToken((n) => n + 1)}
                className="gap-1.5"
              >
                <RotateCw className="size-3.5" />
                {t.common.tryAgain}
              </Button>
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
            <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <SearchX className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {query.trim() ? (
                    <NoResultsMessage query={query.trim()} t={t} />
                  ) : (
                    t.asset.logoSearchEmpty
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.asset.logoSearchEmptyHintPrefix}
                  <a
                    href="https://svgl.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    svgl.app
                  </a>
                  {t.asset.logoSearchEmptyHintSuffix}
                </p>
              </div>
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
                      toast.error(err instanceof Error ? err.message : t.asset.toastDownloadFailed);
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
            {t.common.done}
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
  const t = useLocale();

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
                {t.asset.logoVariantLight}
              </button>
              <button
                type="button"
                onClick={() => setVariant('dark')}
                className={cn(
                  'border-l px-1.5 py-0.5 transition-colors',
                  variant === 'dark' ? 'bg-foreground text-background' : 'hover:bg-muted',
                )}
              >
                {t.asset.logoVariantDark}
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
                toast.error(err instanceof Error ? err.message : t.asset.toastDownloadFailed);
              }
            }}
            className="ml-auto h-6 px-2 text-[11px]"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : t.common.add}
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
