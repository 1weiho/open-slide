import config from 'virtual:open-slide/config';
import { ChevronLeft, Download, FileCode2, FileText, Loader2, Pencil, Play } from 'lucide-react';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetView } from '@/components/asset-view';
import { HistoryProvider } from '@/components/history-provider';
import { CommentWidget } from '@/components/inspector/comment-widget';
import { InspectOverlay } from '@/components/inspector/inspect-overlay';
import { InspectorPanel } from '@/components/inspector/inspector-panel';
import {
  InspectorProvider,
  InspectToggleButton,
  useInspector,
} from '@/components/inspector/inspector-provider';
import { SaveBar } from '@/components/inspector/save-bar';
import { DesignProvider } from '@/components/style-panel/design-provider';
import { DesignPanel, DesignToggleButton } from '@/components/style-panel/style-panel';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFolders } from '@/lib/folders';
import { useWheelPageNavigation } from '@/lib/use-wheel-page-navigation';
import { cn } from '@/lib/utils';
import { ClickNavZones } from '../components/click-nav-zones';
import { PdfProgressToast } from '../components/pdf-progress-toast';
import { Player } from '../components/player';
import { SlideCanvas } from '../components/slide-canvas';
import { ThumbnailRail } from '../components/thumbnail-rail';
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
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← Home
          </Link>
        )}
        <span className="mt-6 block eyebrow text-destructive/80">Load failed</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          Failed to load slide
        </h2>
        <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-[11.5px] leading-relaxed whitespace-pre-wrap shadow-edge">
          {error}
        </pre>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-[12.5px] text-muted-foreground">
        <span className="eyebrow">Loading</span>
        <p className="mt-2 font-mono">{slideId}</p>
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showSlideBrowser && (
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← Home
          </Link>
        )}
        <span className="mt-6 block eyebrow">Empty</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          Nothing to show.
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed">
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            slides/{slideId}/index.tsx
          </code>{' '}
          must{' '}
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            export default
          </code>{' '}
          a non-empty array of components.
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
    <HistoryProvider>
      <InspectorProvider slideId={slideId}>
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          {/* Editorial toolbar — three zones, hairline separators, mono-folio center */}
          <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-hairline bg-sidebar/85 px-2 backdrop-blur-md md:px-3">
            <div className="flex items-center gap-1.5 md:gap-2">
              {showSlideBrowser && (
                <Button asChild variant="ghost" size="icon-sm" title="Home">
                  <Link to="/" aria-label="Back to home">
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              )}
              <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-hairline md:block" />
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
                  <TabsList>
                    <TabsTrigger value="slides">Slides</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* Centered title — the rail and mobile pill carry the page count. */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-2">
              <div className="pointer-events-auto min-w-0 max-w-[min(34rem,calc(100vw-22rem))]">
                <InlineTitleEditor title={title} onSubmit={(next) => renameSlide(slideId, next)} />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {view === 'slides' && allowHtmlDownload && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    disabled={exporting}
                    aria-label="Download"
                    title="Download"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
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
                      Export as HTML
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
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {view === 'slides' && (
                <DesignToggleButton active={designOpen} onToggle={() => setDesignOpen((v) => !v)} />
              )}
              {view === 'slides' && <InspectToggleButton />}
              <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-hairline md:block" />
              {view === 'slides' && (
                <Button
                  size="sm"
                  variant="brand"
                  onClick={() => setPlaying(true)}
                  className="px-2.5 md:px-3"
                >
                  <Play className="size-3.5 fill-current" />
                  <span className="hidden md:inline">Present</span>
                  <kbd className="ml-1 hidden rounded-[3px] bg-brand-foreground/15 px-1 font-mono text-[9.5px] tracking-[0.04em] md:inline">
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
                <div className="hidden w-[16.5rem] shrink-0 md:block">
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
                  className="paper relative min-h-0 min-w-0 flex-1 bg-canvas p-2 md:p-10"
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
                  {import.meta.env.DEV && <CommentWidget />}
                  {/* Safe-area aware so Safari's URL bar can't cover the folio. */}
                  <div
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-[5px] border border-foreground/10 bg-foreground/85 px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-background backdrop-blur md:hidden"
                    style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
                  >
                    {(index + 1).toString().padStart(2, '0')}
                    <span className="opacity-50"> / </span>
                    {pageCount.toString().padStart(2, '0')}
                  </div>
                </main>
                <InspectorPanel />
                <DesignPanel open={designOpen} onClose={() => setDesignOpen(false)} />
              </div>
            </DesignProvider>
          )}
        </div>
      </InspectorProvider>
    </HistoryProvider>
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
          className="min-w-0 max-w-[min(34rem,90%)] rounded-[5px] border border-foreground/30 bg-card px-2 py-0.5 text-center font-heading text-[13px] font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
    );
  }

  return (
    <div className="group/title flex min-w-0 items-baseline justify-center gap-1.5">
      <h1 className="truncate font-heading text-[13.5px] font-semibold tracking-[-0.01em]">
        {title}
      </h1>
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename slide"
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground',
            'opacity-0 group-hover/title:opacity-100 focus-visible:opacity-100',
          )}
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  );
}
