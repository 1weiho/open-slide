import {
  ArrowDownAZ,
  ChevronDown,
  Clock,
  Copy,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Palette,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
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
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { FolderIconChip, SLIDE_DND_MIME } from '../components/sidebar/folder-item';
import { DRAFT_ID } from '../components/sidebar/sidebar';
import { SlideCanvas } from '../components/slide-canvas';
import { SlidePageProvider } from '../lib/page-context';
import type { Folder, FolderIcon, SlideModule } from '../lib/sdk';
import { loadSlide, slideCreatedAt } from '../lib/slides';
import type { HomeOutletContext } from './home-shell';

type SortKey = 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';

const SORT_KEYS: readonly SortKey[] = ['created-desc', 'created-asc', 'title-asc', 'title-desc'];

const DEFAULT_SORT: SortKey = 'created-desc';
const SORT_STORAGE_KEY = 'open-slide:home-sort';

function readSortPref(): SortKey {
  if (typeof window === 'undefined') return DEFAULT_SORT;
  try {
    const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (raw && (SORT_KEYS as readonly string[]).includes(raw)) return raw as SortKey;
  } catch {}
  return DEFAULT_SORT;
}

function useSortPref(): [SortKey, (next: SortKey) => void] {
  const [sortKey, setSortKey] = useState<SortKey>(readSortPref);
  const update = (next: SortKey) => {
    setSortKey(next);
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {}
  };
  return [sortKey, update];
}

const TITLE_COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function Home() {
  const {
    manifest,
    loading,
    draftSlides,
    slidesByFolder,
    selectedId,
    reportTitle,
    titleMap,
    assign,
    renameSlide,
    duplicateSlide,
    deleteSlide,
  } = useOutletContext<HomeOutletContext>();
  const t = useLocale();

  const selectedFolder =
    selectedId === DRAFT_ID ? null : (manifest.folders.find((f) => f.id === selectedId) ?? null);
  const visibleSlides = selectedId === DRAFT_ID ? draftSlides : (slidesByFolder[selectedId] ?? []);

  const title = selectedFolder?.name ?? t.home.draft;
  const headerIcon = selectedFolder?.icon ?? { type: 'emoji' as const, value: '📝' };
  const isDraft = selectedId === DRAFT_ID;

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useSortPref();

  const trimmedQuery = query.trim().toLowerCase();
  const filteredSlides = useMemo(() => {
    if (!trimmedQuery) return visibleSlides;
    return visibleSlides.filter((id) => {
      if (id.toLowerCase().includes(trimmedQuery)) return true;
      const tl = titleMap[id]?.toLowerCase();
      return tl ? tl.includes(trimmedQuery) : false;
    });
  }, [visibleSlides, titleMap, trimmedQuery]);
  const sortedSlides = useMemo(() => {
    const list = filteredSlides.slice();
    const titleOf = (id: string) => titleMap[id] ?? id;
    switch (sortKey) {
      case 'title-asc':
        list.sort((a, b) => TITLE_COLLATOR.compare(titleOf(a), titleOf(b)));
        break;
      case 'title-desc':
        list.sort((a, b) => TITLE_COLLATOR.compare(titleOf(b), titleOf(a)));
        break;
      case 'created-asc':
        list.sort((a, b) => (slideCreatedAt[a] ?? 0) - (slideCreatedAt[b] ?? 0));
        break;
      default:
        list.sort((a, b) => (slideCreatedAt[b] ?? 0) - (slideCreatedAt[a] ?? 0));
    }
    return list;
  }, [filteredSlides, sortKey, titleMap]);
  const isSearching = trimmedQuery.length > 0;

  return (
    <>
      <header className="mb-8 md:mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <FolderIconChip icon={headerIcon} className="size-7 text-2xl" />
          <h1 className="font-heading text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[44px]">
            {title}
          </h1>
          {!loading && (
            <span className="folio ml-1 self-end pb-2">
              {(isSearching ? filteredSlides.length : visibleSlides.length)
                .toString()
                .padStart(2, '0')}
              {isSearching && (
                <span className="opacity-40">
                  /{visibleSlides.length.toString().padStart(2, '0')}
                </span>
              )}
            </span>
          )}
          <div className="ml-auto flex w-full items-center gap-2 md:w-auto">
            <SortControl value={sortKey} onChange={setSortKey} />
            <SearchInput value={query} onChange={setQuery} />
          </div>
        </div>
      </header>

      {loading ? (
        <HomeLoading />
      ) : visibleSlides.length === 0 ? (
        <EmptyState isDraft={isDraft} folderName={selectedFolder?.name} />
      ) : filteredSlides.length === 0 ? (
        <NoResultsState query={query} onClear={() => setQuery('')} />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-9 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {sortedSlides.map((id) => (
            <li key={id}>
              <SlideCard
                id={id}
                folders={manifest.folders}
                currentFolderId={manifest.assignments[id] ?? null}
                onRename={(name) => renameSlide(id, name)}
                onDuplicate={async () => {
                  const slideName = titleMap[id] ?? id;
                  try {
                    const newSlideId = await duplicateSlide(id);
                    toast.success(
                      format(t.home.toastSlideDuplicated, {
                        slide: slideName,
                        newSlide: newSlideId,
                      }),
                    );
                  } catch {
                    toast.error(t.home.toastSlideDuplicateFailed);
                  }
                }}
                onMove={(folderId) => assign(id, folderId)}
                onDelete={() => deleteSlide(id)}
                onTitleResolved={reportTitle}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useLocale();
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
        placeholder={t.home.searchPlaceholder}
        className="h-8 w-full rounded-[6px] border border-border bg-background pl-8 pr-7 text-[12.5px] outline-none placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t.home.clearSearch}
          className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

function SortControl({ value, onChange }: { value: SortKey; onChange: (next: SortKey) => void }) {
  const t = useLocale();
  const labels: Record<SortKey, string> = {
    'created-desc': t.home.sortByCreatedDesc,
    'created-asc': t.home.sortByCreatedAsc,
    'title-asc': t.home.sortByTitleAsc,
    'title-desc': t.home.sortByTitleDesc,
  };
  const FieldIcon = ({ k, className }: { k: SortKey; className?: string }) =>
    k === 'title-asc' || k === 'title-desc' ? (
      <ArrowDownAZ className={className} aria-hidden />
    ) : (
      <Clock className={className} aria-hidden />
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t.home.sortLabel}: ${labels[value]}`}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] border border-border bg-background pl-2 pr-1.5 text-[12.5px] font-medium text-foreground outline-none hover:bg-muted focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <FieldIcon k={value} className="size-3.5 text-muted-foreground" />
          <span>{labels[value]}</span>
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SORT_KEYS.map((key) => {
          const active = value === key;
          return (
            <DropdownMenuItem
              key={key}
              onSelect={() => onChange(key)}
              className={cn(active && 'bg-muted text-foreground')}
            >
              <FieldIcon k={key} className="size-3.5 text-muted-foreground" />
              <span>{labels[key]}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HomeLoading() {
  const t = useLocale();
  return (
    <div className="grid place-items-center px-8 py-24 text-muted-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-px w-56 overflow-hidden bg-hairline">
          <span
            aria-hidden
            className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
          />
        </div>
        <span className="eyebrow text-[11.5px]">{t.slide.loadingEyebrow}</span>
      </div>
    </div>
  );
}

function NoResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  const t = useLocale();
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-card/60 px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">
          {t.home.noMatches}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {t.home.nothingMatchesPrefix}
          <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
          {t.home.nothingMatchesSuffix}
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onClear}>
          {t.home.clearSearch}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ isDraft, folderName }: { isDraft: boolean; folderName?: string }) {
  const t = useLocale();
  const folderEmptyTitle = t.home.folderEmptyTitle.replace(
    '{name}',
    folderName ?? t.home.folderEmptyTitle,
  );
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-card/60 px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-card text-muted-foreground">
          <FolderPlus className="size-5" />
        </div>
        {isDraft ? (
          <>
            <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">
              {t.home.noSlidesYet}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {t.home.createSlideHintPrefix}
              <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
                /create-slide
              </code>
              {t.home.createSlideHintSuffix}
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 font-heading text-[15px] font-semibold tracking-tight">
              {folderEmptyTitle}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {t.home.folderEmptyHint}
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
  onDuplicate,
  onMove,
  onDelete,
  onTitleResolved,
}: {
  id: string;
  folders: Folder[];
  currentFolderId: string | null;
  onRename: (name: string) => Promise<void> | void;
  onDuplicate: () => Promise<void> | void;
  onMove: (folderId: string | null) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onTitleResolved?: (id: string, title: string) => void;
}) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const tCard = useLocale();

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
        className={cn('group relative motion-safe:transition-opacity', dragging && 'opacity-40')}
      >
        <Link to={`/s/${id}`} className="block focus-visible:outline-none">
          {/* Slide thumb — tight border, grey baseboard, no shadcn rounded-xl */}
          <div className="relative aspect-video overflow-hidden rounded-[6px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04] group-hover:shadow-floating group-hover:ring-foreground/20 motion-safe:transition-[box-shadow,--tw-ring-color] motion-safe:duration-200">
            {FirstPage ? (
              <div className="h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
                <SlideCanvas flat freezeMotion design={slide?.design}>
                  <SlidePageProvider index={0} total={slide?.default.length ?? 1}>
                    <FirstPage />
                  </SlidePageProvider>
                </SlideCanvas>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center text-[10px] tracking-[0.16em] uppercase text-muted-foreground/60">
                {tCard.common.loading}
              </div>
            )}
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Link to={`/s/${id}`} className="min-w-0 flex-1 focus-visible:outline-none">
            <h3 className="min-w-0 truncate font-heading text-[14px] font-medium tracking-tight">
              {displayTitle}
            </h3>
          </Link>
          {slide?.meta?.theme && (
            <Link
              to={`/themes/${encodeURIComponent(slide.meta.theme)}`}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Palette className="size-3" aria-hidden />
              <span className="max-w-[120px] truncate">{slide.meta.theme}</span>
            </Link>
          )}
        </div>

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
                  aria-label={tCard.home.slideActions}
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onSelect={() => setDialog('rename')}>
                  <Pencil />
                  {tCard.common.rename}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDuplicate()}>
                  <Copy />
                  {tCard.home.duplicate}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog('move')}>
                  <FolderInput />
                  {tCard.home.moveToFolder}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
                  <Trash2 />
                  {tCard.common.delete}
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
  const t = useLocale();

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
          <span className="eyebrow">{t.home.renameDialogEyebrow}</span>
          <DialogTitle>{t.home.renameDialogTitle}</DialogTitle>
          <DialogDescription>{t.home.renameDialogDescription}</DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={80}
          placeholder={t.home.slideNamePlaceholder}
          className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-[13px] outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button size="sm" disabled={submitting} onClick={submit}>
            {t.common.save}
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
  const t = useLocale();

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
          <span className="eyebrow">{t.home.moveDialogEyebrow}</span>
          <DialogTitle>{t.home.moveDialogTitle}</DialogTitle>
          <DialogDescription>
            {t.home.moveDialogDescriptionPrefix}
            <span className="font-medium text-foreground">{slideName}</span>
            {t.home.moveDialogDescriptionSuffix}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[320px] overflow-y-auto rounded-[6px] border border-border bg-background">
          <FolderOption
            icon={{ type: 'emoji', value: '📝' }}
            label={t.home.draft}
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
            {t.common.cancel}
          </Button>
          <Button size="sm" disabled={submitting || selected === currentFolderId} onClick={submit}>
            {t.common.move}
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
  const tOpt = useLocale();
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
          {tOpt.common.selected}
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
  const t = useLocale();

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
          <span className="eyebrow text-destructive/80">{t.home.deleteDialogEyebrow}</span>
          <DialogTitle>{t.home.deleteDialogTitle}</DialogTitle>
          <DialogDescription>
            {t.home.deleteDialogDescriptionPrefix}
            <span className="font-medium text-foreground">{slideName}</span>
            {t.home.deleteDialogDescriptionMid}
            {t.home.deleteDialogDescriptionSuffix}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" size="sm" disabled={submitting} onClick={confirm}>
            {t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
