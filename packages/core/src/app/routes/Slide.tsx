import config from 'virtual:open-slide/config';
import { ChevronLeft, Download, FileCode2, FileText, Loader2, Pencil, Play } from 'lucide-react';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetView } from '@/components/AssetView';
import { CommentWidget } from '@/components/inspector/CommentWidget';
import { InspectOverlay } from '@/components/inspector/InspectOverlay';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import {
  InspectorProvider,
  InspectToggleButton,
  useInspector,
} from '@/components/inspector/InspectorProvider';
import { SaveBar } from '@/components/inspector/SaveBar';
import { DesignProvider } from '@/components/style-panel/DesignProvider';
import { DesignPanel, DesignToggleButton } from '@/components/style-panel/StylePanel';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFolders } from '@/lib/folders';
import { useWheelPageNavigation } from '@/lib/useWheelPageNavigation';
import { cn } from '@/lib/utils';
import { ClickNavZones } from '../components/ClickNavZones';
import { PdfProgressToast } from '../components/PdfProgressToast';
import { Player } from '../components/Player';
import { SlideCanvas } from '../components/SlideCanvas';
import { ThumbnailRail } from '../components/ThumbnailRail';
import { exportSlideAsHtml } from '../lib/export-html';
import { exportSlideAsPdf } from '../lib/export-pdf';
import type { SlideModule } from '../lib/sdk';
import { loadSlide } from '../lib/slides';

const { showSlideUi, showSlideBrowser, allowHtmlDownload } = config.build;

export function Slide() {
  const { slideId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const { renameSlide } = useFolders();
  const slideViewportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    setSlide(null);
    setError(null);
    loadSlide(slideId)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [slideId]);

  const pages = useMemo(() => slide?.default ?? [], [slide]);
  const pageCount = pages.length;
  const rawIndex = Number(searchParams.get('p') ?? '1') - 1;
  const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(pageCount - 1, rawIndex)) : 0;
  const view = searchParams.get('view') === 'assets' ? 'assets' : 'slides';

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, i));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('p', String(clamped + 1));
          return next;
        },
        { replace: true },
      );
    },
    [pageCount, setSearchParams],
  );

  useEffect(() => {
    if (playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        setPlaying(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, goTo, playing]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showSlideBrowser && (
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            ← Home
          </Link>
        )}
        <h2 className="mt-4 text-xl font-semibold text-foreground">Failed to load slide</h2>
        <pre className="mt-4 overflow-auto rounded-md border bg-card p-4 text-xs whitespace-pre-wrap shadow-sm">
          {error}
        </pre>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-muted-foreground">
        Loading {slideId}…
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showSlideBrowser && (
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            ← Home
          </Link>
        )}
        <h2 className="mt-4 text-xl font-semibold text-foreground">Empty slide</h2>
        <p className="mt-2 text-sm">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            slides/{slideId}/index.tsx
          </code>{' '}
          must{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">export default</code> a
          non-empty array of components.
        </p>
      </div>
    );
  }

  if (!showSlideUi) {
    return (
      <Player
        pages={pages}
        design={slide.design}
        index={index}
        onIndexChange={goTo}
        onExit={() => {}}
        allowExit={false}
      />
    );
  }

  if (playing) {
    return (
      <Player
        pages={pages}
        design={slide.design}
        index={index}
        onIndexChange={goTo}
        onExit={() => setPlaying(false)}
      />
    );
  }

  const CurrentPage = pages[index];
  const title = slide.meta?.title ?? slideId;

  return (
    <InspectorProvider slideId={slideId}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card/95 px-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-4">
          <div className="flex min-w-0 items-center gap-1 md:gap-1.5">
            {showSlideBrowser && (
              <Button asChild variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-foreground md:px-2.5">
                <Link to="/">
                  <ChevronLeft className="size-4" />
                  <span className="hidden md:inline">Home</span>
                </Link>
              </Button>
            )}
            {import.meta.env.DEV && showSlideBrowser && (
              <span aria-hidden className="toolbar-divider mx-1 hidden md:block" />
            )}
            {import.meta.env.DEV && (
              <Tabs
                value={view}
                onValueChange={(next) => {
                  setSearchParams(
                    (prev) => {
                      const params = new URLSearchParams(prev);
                      if (next === 'assets') params.set('view', 'assets');
                      else params.delete('view');
                      return params;
                    },
                    { replace: true },
                  );
                }}
              >
                <TabsList className="relative h-7 rounded-md p-0.5 group-data-[orientation=horizontal]/tabs:h-7">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-[5px] bg-background shadow-sm transition-transform duration-200 ease-out"
                    style={{
                      transform: view === 'assets' ? 'translateX(100%)' : 'translateX(0)',
                    }}
                  />
                  <TabsTrigger
                    value="slides"
                    className="relative z-10 h-6 px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
                  >
                    Slides
                  </TabsTrigger>
                  <TabsTrigger
                    value="assets"
                    className="relative z-10 h-6 px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
                  >
                    Assets
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-2">
            <div className="pointer-events-auto min-w-0 max-w-[min(34rem,calc(100vw-22rem))]">
              <InlineTitleEditor title={title} onSubmit={(next) => renameSlide(slideId, next)} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {view === 'slides' && allowHtmlDownload && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  disabled={exporting}
                  aria-label="Download"
                  title="Download"
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
                >
                  {exporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem
                    disabled={exporting}
                    onSelect={async () => {
                      if (!slide || exporting) return;
                      setExporting(true);
                      try {
                        await exportSlideAsHtml(slide, slideId);
                      } catch (err) {
                        console.error('[open-slide] export failed', err);
                      } finally {
                        setExporting(false);
                      }
                    }}
                  >
                    <FileCode2 />
                    Download HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={exporting}
                    onSelect={async () => {
                      if (!slide || exporting) return;
                      setExporting(true);
                      const toastId = `pdf-export-${slideId}`;
                      toast.custom(
                        () => (
                          <PdfProgressToast
                            progress={{
                              phase: 'processing',
                              current: 0,
                              total: pages.length,
                              percent: 0,
                            }}
                          />
                        ),
                        { id: toastId, duration: Infinity },
                      );
                      try {
                        await exportSlideAsPdf(slide, slideId, (p) => {
                          toast.custom(() => <PdfProgressToast progress={p} />, {
                            id: toastId,
                            duration: Infinity,
                          });
                        });
                      } catch (err) {
                        console.error('[open-slide] pdf export failed', err);
                        toast.error('PDF export failed', { id: toastId, duration: 4000 });
                      } finally {
                        setExporting(false);
                        toast.dismiss(toastId);
                      }
                    }}
                  >
                    <FileText />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {view === 'slides' && (
              <DesignToggleButton active={designOpen} onToggle={() => setDesignOpen((v) => !v)} />
            )}
            {view === 'slides' && <InspectToggleButton />}
            {view === 'slides' && (
              <span aria-hidden className="toolbar-divider mx-1 hidden md:block" />
            )}
            {view === 'slides' && (
              <Button
                size="sm"
                onClick={() => setPlaying(true)}
                className="gap-1.5 px-2.5 shadow-sm md:px-3"
              >
                <Play className="size-3.5" fill="currentColor" />
                <span className="hidden md:inline">Play</span>
                <kbd className="ml-0.5 hidden h-4 items-center rounded-[4px] bg-primary-foreground/15 px-1 font-mono text-[10px] font-medium tracking-wide text-primary-foreground/80 md:inline-flex">
                  F
                </kbd>
              </Button>
            )}
          </div>
        </header>

        {view === 'assets' ? (
          <div className="min-h-0 flex-1">
            <AssetView slideId={slideId} />
          </div>
        ) : (
          <DesignProvider slideId={slideId}>
            <div className="flex min-h-0 flex-1">
              <div className="hidden w-[17rem] shrink-0 md:block">
                <ThumbnailRail
                  pages={pages}
                  design={slide.design}
                  current={index}
                  onSelect={goTo}
                />
              </div>
              <main
                ref={slideViewportRef}
                data-inspector-root
                className="editor-canvas-surface relative min-h-0 min-w-0 flex-1 p-2 md:p-10"
              >
                <SlideWheelNavigation
                  targetRef={slideViewportRef}
                  onPrev={() => goTo(index - 1)}
                  onNext={() => goTo(index + 1)}
                  canPrev={index > 0}
                  canNext={index < pageCount - 1}
                />
                <SlideCanvas design={slide.design}>
                  <CurrentPage />
                </SlideCanvas>
                <ClickNavZones
                  onPrev={() => goTo(index - 1)}
                  onNext={() => goTo(index + 1)}
                  canPrev={index > 0}
                  canNext={index < pageCount - 1}
                />
                <InspectOverlay />
                <SaveBar />
                <CommentWidget />
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white shadow-lg backdrop-blur-md md:bottom-4 md:flex">
                  <span className="size-1.5 rounded-full bg-emerald-400/90" aria-hidden />
                  <span className="text-white/95">
                    {index + 1}
                    <span className="mx-1 text-white/50">/</span>
                    {pageCount}
                  </span>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur md:hidden">
                  {index + 1} / {pageCount}
                </div>
              </main>
              <InspectorPanel />
              <DesignPanel open={designOpen} onClose={() => setDesignOpen(false)} />
            </div>
          </DesignProvider>
        )}
      </div>
    </InspectorProvider>
  );
}

function SlideWheelNavigation({
  targetRef,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  targetRef: RefObject<HTMLElement>;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const { active } = useInspector();

  useWheelPageNavigation({
    ref: targetRef,
    enabled: !active,
    canPrev,
    canNext,
    onPrev,
    onNext,
  });

  return null;
}

function InlineTitleEditor({
  title,
  onSubmit,
}: {
  title: string;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      queueMicrotask(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setValue(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-1 items-center justify-center">
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
              cancel();
            }
          }}
          maxLength={80}
          className="h-7 min-w-0 max-w-[min(34rem,90%)] rounded-md border bg-background px-2.5 text-center text-xs font-semibold tracking-tight outline-none ring-ring/40 focus:ring-2 md:text-[13px]"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label="Rename slide"
      title="Rename slide"
      className={cn(
        'group/title relative flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md px-2.5 text-foreground transition-colors',
        'hover:bg-muted/70 focus-visible:bg-muted focus-visible:outline-none',
      )}
    >
      <h1 className="truncate text-xs font-semibold tracking-tight md:text-[13px]">{title}</h1>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100" />
    </button>
  );
}
