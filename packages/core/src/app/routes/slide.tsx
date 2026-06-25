import config from 'virtual:open-slide/config';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  FileCode2,
  FileImage,
  FileText,
  Link2,
  Loader2,
  Maximize,
  MonitorSpeaker,
  MoreHorizontal,
  Play,
  Presentation,
} from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFolders } from '@/lib/folders';
import { useAgentSocketConnected } from '@/lib/use-agent-socket';
import { useClickPageNavigation } from '@/lib/use-click-page-navigation';
import { useIsMobile } from '@/lib/use-is-mobile';
import { format, useLocale } from '@/lib/use-locale';
import { useWheelPageNavigation } from '@/lib/use-wheel-page-navigation';
import { cn } from '@/lib/utils';
import { NotesDrawer } from '../components/notes-drawer';
import { OverviewGrid } from '../components/overview-grid';
import { PdfProgressToast } from '../components/pdf-progress-toast';
import { openPresenterWindow, Player } from '../components/player';
import { PptxProgressToast } from '../components/pptx-progress-toast';
import { SlideCanvas } from '../components/slide-canvas';
import { SlideTransitionLayer } from '../components/slide-transition-layer';
import { type ThumbnailActions, ThumbnailRail } from '../components/thumbnail-rail';
import { exportSlideAsHtml } from '../lib/export-html';
import { exportSlideAsPdf, isSafari } from '../lib/export-pdf';
import { exportSlideAsImagePptx } from '../lib/export-pptx';
import { remapNotesSessionCacheAfterReorder } from '../lib/inspector/use-notes';
import type { SlideModule } from '../lib/sdk';
import { usePrefersReducedMotion } from '../lib/use-prefers-reduced-motion';
import { useSlideModule } from '../lib/use-slide-module';

const { showSlideUi, showSlideBrowser, allowHtmlDownload } = config.build;

export function Slide() {
  const { slideId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slide, error } = useSlideModule(slideId);
  const [playMode, setPlayMode] = useState<'window' | 'fullscreen' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    };
  }, []);
  const { renameSlide } = useFolders();
  const slideViewportRef = useRef<HTMLElement>(null);
  const t = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();

  const modulePages = useMemo(() => slide?.default ?? [], [slide]);
  const [pages, setPages] = useState<typeof modulePages>(modulePages);
  useEffect(() => {
    setPages(modulePages);
  }, [modulePages]);
  const pageCount = pages.length;
  const rawIndex = Number(searchParams.get('p') ?? '1') - 1;
  const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(pageCount - 1, rawIndex)) : 0;
  const view = searchParams.get('view') === 'assets' ? 'assets' : 'slides';

  useEffect(() => {
    if (!import.meta.hot) return;
    if (!slideId || !slide || pageCount === 0) return;
    import.meta.hot.send('open-slide:current', {
      slideId,
      pageIndex: index,
      totalPages: pageCount,
      slideTitle: slide.meta?.title ?? slideId,
      view,
    });
  }, [slideId, index, pageCount, slide, view]);

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

  const reorderPage = useCallback(
    async (from: number, to: number) => {
      if (from === to) return;
      const before = pages;
      const nextPages = [...before];
      const [moved] = nextPages.splice(from, 1);
      nextPages.splice(to, 0, moved);
      setPages(nextPages);

      const order = before.map((_, i) => i);
      const [movedIdx] = order.splice(from, 1);
      order.splice(to, 0, movedIdx);

      remapNotesSessionCacheAfterReorder(slideId, order);

      // Keep the user looking at the same page they were on before the drag.
      let nextIndex = index;
      if (index === from) nextIndex = to;
      else if (from < index && to >= index) nextIndex = index - 1;
      else if (from > index && to <= index) nextIndex = index + 1;
      if (nextIndex !== index) goTo(nextIndex);

      try {
        const res = await fetch(`/__slides/${encodeURIComponent(slideId)}/reorder`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
      } catch (err) {
        setPages(before);
        const inverse = order.map((_, i) => order.indexOf(i));
        remapNotesSessionCacheAfterReorder(slideId, inverse);
        toast.error(`Reorder failed: ${String((err as Error).message ?? err)}`);
      }
    },
    [pages, index, slideId, goTo],
  );

  const duplicatePage = useCallback(
    async (i: number) => {
      const before = pages;
      if (i < 0 || i >= before.length) return;
      const nextPages = [...before];
      nextPages.splice(i + 1, 0, before[i]);
      setPages(nextPages);
      if (index > i) goTo(index + 1);

      try {
        const res = await fetch(`/__slides/${encodeURIComponent(slideId)}/pages/${i}/duplicate`, {
          method: 'POST',
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        toast.success(format(t.thumbnailRail.toastDuplicated, { n: i + 1 }));
      } catch (err) {
        setPages(before);
        toast.error(
          `${t.thumbnailRail.toastDuplicateFailed}: ${String((err as Error).message ?? err)}`,
        );
      }
    },
    [pages, index, slideId, goTo, t.thumbnailRail],
  );

  const deletePage = useCallback(
    async (i: number) => {
      const before = pages;
      if (i < 0 || i >= before.length || before.length <= 1) return;
      const nextPages = before.slice(0, i).concat(before.slice(i + 1));
      setPages(nextPages);
      if (index >= i && index > 0) {
        const target = index === i ? Math.min(index, nextPages.length - 1) : index - 1;
        goTo(target);
      }

      try {
        const res = await fetch(`/__slides/${encodeURIComponent(slideId)}/pages/${i}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        toast.success(format(t.thumbnailRail.toastDeleted, { n: i + 1 }));
      } catch (err) {
        setPages(before);
        toast.error(
          `${t.thumbnailRail.toastDeleteFailed}: ${String((err as Error).message ?? err)}`,
        );
      }
    },
    [pages, index, slideId, goTo, t.thumbnailRail],
  );

  const thumbnailActions = useMemo<ThumbnailActions | undefined>(
    () =>
      import.meta.env.DEV
        ? {
            onDuplicate: duplicatePage,
            onDelete: deletePage,
          }
        : undefined,
    [duplicatePage, deletePage],
  );

  useEffect(() => {
    if (playMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      // Letter shortcuts only fire bare so browser combos (Cmd/Ctrl-P, ⌘F…) stay intact.
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Toggle overview from either state — the overview's own capture-phase
      // handler doesn't consume O, so this stays consistent open ↔ closed.
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverviewOpen((v) => !v);
        return;
      }
      // Once overview owns focus, swallow everything else here — its
      // capture-phase listener drives the focused thumbnail.
      if (overviewOpen) return;
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === ' ' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();
        goTo(index + 1);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(index - 1);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        setPlayMode('fullscreen');
      } else if (e.key === 'Enter') {
        setPlayMode('window');
      } else if (e.key === 'p' || e.key === 'P') {
        if (slideId) openPresenterWindow(slideId);
        setPlayMode('window');
      } else if (import.meta.env.DEV && (e.key === 'd' || e.key === 'D')) {
        setDesignOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, goTo, playMode, slideId, overviewOpen]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showSlideBrowser && (
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← {t.common.home}
          </Link>
        )}
        <span className="mt-6 block eyebrow text-destructive/80">{t.common.loadFailed}</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          {t.common.failedToLoadSlide}
        </h2>
        <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-[11.5px] leading-relaxed whitespace-pre-wrap shadow-edge">
          {error}
        </pre>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="grid min-h-dvh place-items-center px-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-hairline">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-[11.5px]">
            <span className="eyebrow">{t.slide.loadingEyebrow}</span>
            <span className="font-mono">{slideId}</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showSlideBrowser && (
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← {t.common.home}
          </Link>
        )}
        <span className="mt-6 block eyebrow">{t.slide.emptyEyebrow}</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          {t.slide.nothingToShow}
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed">
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            slides/{slideId}/index.tsx
          </code>
          {t.slide.emptyHintMust}
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            export default
          </code>
          {t.slide.emptyHintSuffix}
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

  if (playMode) {
    return (
      <Player
        pages={pages}
        design={slide.design}
        transition={slide.transition}
        index={index}
        onIndexChange={goTo}
        onExit={() => setPlayMode(null)}
        controls
        slideId={slideId}
        fullscreen={playMode === 'fullscreen'}
      />
    );
  }

  const title = slide.meta?.title ?? slideId;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t.slide.toastCopyLinkSuccess);
      setLinkCopied(true);
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
      linkCopiedTimerRef.current = setTimeout(() => setLinkCopied(false), 1200);
    } catch (err) {
      console.error('[open-slide] copy link failed', err);
      toast.error(t.slide.toastCopyLinkFailed);
    }
  };

  const exportHtml = async () => {
    if (!slide || exporting) return;
    setExporting(true);
    try {
      await exportSlideAsHtml(slide, slideId);
    } catch (err) {
      console.error('[open-slide] export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!slide || exporting) return;
    if (isSafari()) {
      toast.error(t.slide.pdfExportSafariUnsupported, { duration: 5000 });
      return;
    }
    setExporting(true);
    const toastId = `pdf-export-${slideId}`;
    toast.custom(
      () => (
        <PdfProgressToast
          progress={{ phase: 'processing', current: 0, total: pages.length, percent: 0 }}
        />
      ),
      { id: toastId, duration: Infinity },
    );
    try {
      await exportSlideAsPdf(slide, slideId, (p) => {
        toast.custom(() => <PdfProgressToast progress={p} />, { id: toastId, duration: Infinity });
      });
    } catch (err) {
      console.error('[open-slide] pdf export failed', err);
      toast.error(t.slide.pdfExportFailed, { id: toastId, duration: 4000 });
    } finally {
      setExporting(false);
      toast.dismiss(toastId);
    }
  };

  const exportImagePptx = async () => {
    if (!slide || exporting) return;
    setExporting(true);
    const toastId = `pptx-export-${slideId}`;
    toast.custom(
      () => (
        <PptxProgressToast
          progress={{ phase: 'processing', current: 0, total: pages.length, percent: 0 }}
        />
      ),
      { id: toastId, duration: Infinity },
    );
    try {
      await exportSlideAsImagePptx(slide, slideId, (p) => {
        toast.custom(() => <PptxProgressToast progress={p} />, { id: toastId, duration: Infinity });
      });
    } catch (err) {
      console.error('[open-slide] image pptx export failed', err);
      toast.error(t.slide.imagePptxExportFailed, { id: toastId, duration: 4000 });
    } finally {
      setExporting(false);
      toast.dismiss(toastId);
    }
  };

  const exportMenuItems = (
    <>
      <DropdownMenuItem disabled={exporting} onSelect={exportHtml}>
        <FileCode2 />
        {t.slide.exportAsHtml}
      </DropdownMenuItem>
      <DropdownMenuItem disabled={exporting} onSelect={exportPdf}>
        <FileText />
        {t.slide.exportAsPdf}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={exporting} onSelect={exportImagePptx}>
        <FileImage />
        {t.slide.exportAsImagePptx}
      </DropdownMenuItem>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-disabled
              className="relative flex cursor-help items-center justify-between gap-2 rounded-[5px] px-2 py-1.5 text-[12.5px] opacity-45 select-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:opacity-80"
            >
              <span className="flex items-center gap-2">
                <Presentation />
                {t.slide.exportAsPptx}
              </span>
              <span className="rounded-[3px] bg-muted px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground">
                {t.slide.comingSoon}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="w-max max-w-[min(520px,calc(100vw-2rem))] text-center leading-relaxed"
          >
            {t.slide.pptxComingSoonTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );

  return (
    <HistoryProvider>
      <InspectorProvider slideId={slideId} pageIndex={index}>
        <SelectionReporter />
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          {/* Editorial toolbar — three zones, hairline separators, mono-folio center */}
          <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-hairline bg-sidebar/85 px-2 backdrop-blur-md md:px-3">
            <div className="flex flex-1 items-center gap-1.5 md:flex-none md:gap-2">
              {showSlideBrowser && (
                <Button asChild variant="ghost" size="icon-sm" title={t.slide.home}>
                  <Link to="/" aria-label={t.slide.backToHome}>
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
                    <TabsTrigger value="slides">{t.slide.slidesTab}</TabsTrigger>
                    <TabsTrigger value="assets">{t.slide.assetsTab}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {import.meta.env.DEV && <AgentConnectedBadge />}
            </div>

            {/* On md+ the title centers to the viewport via absolute positioning. On mobile the
                two side groups each flex-1, so the in-flow title lands at the viewport center too —
                and min-w-0 lets it truncate instead of overlapping the icons on narrow widths. */}
            <div className="pointer-events-none relative flex min-w-0 justify-center px-2 md:absolute md:inset-x-0">
              <div className="pointer-events-auto min-w-0 max-w-[34rem]">
                <InlineTitleEditor title={title} onSubmit={(next) => renameSlide(slideId, next)} />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 md:ml-auto md:flex-none">
              {view === 'slides' && (
                <button
                  type="button"
                  aria-label={t.slide.copyLink}
                  title={t.slide.copyLink}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'hidden md:inline-flex',
                  )}
                  onClick={copyLink}
                >
                  <span className="relative grid size-4 place-items-center">
                    <Link2
                      className={cn(
                        'col-start-1 row-start-1 size-4 transition-opacity duration-200',
                        linkCopied ? 'opacity-0' : 'opacity-100',
                      )}
                    />
                    <Check
                      className={cn(
                        'col-start-1 row-start-1 size-4 transition-opacity duration-200',
                        linkCopied ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </span>
                </button>
              )}
              {view === 'slides' && allowHtmlDownload && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    disabled={exporting}
                    aria-label={t.slide.download}
                    title={t.slide.download}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'hidden md:inline-flex',
                    )}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    {exportMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {view === 'slides' && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    disabled={exporting}
                    aria-label={t.slide.moreActions}
                    title={t.slide.moreActions}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'inline-flex md:hidden',
                    )}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem onSelect={copyLink}>
                      <Link2 />
                      {t.slide.copyLink}
                    </DropdownMenuItem>
                    {allowHtmlDownload && <DropdownMenuSeparator />}
                    {allowHtmlDownload && exportMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {view === 'slides' && (
                <DesignToggleButton active={designOpen} onToggle={() => setDesignOpen((v) => !v)} />
              )}
              {view === 'slides' && <InspectToggleButton />}
              <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-hairline md:block" />
              {view === 'slides' && (
                <div className="inline-flex items-stretch">
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={() => setPlayMode('fullscreen')}
                    className="rounded-r-none px-2.5 md:px-3"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span className="hidden md:inline">{t.slide.present}</span>
                    <kbd className="ml-1 hidden rounded-[3px] bg-brand-foreground/15 px-1 font-mono text-[9.5px] tracking-[0.04em] md:inline">
                      F
                    </kbd>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      aria-label={t.slide.presentMenuAria}
                      title={t.slide.presentMenuAria}
                      className={cn(
                        buttonVariants({ variant: 'brand', size: 'sm' }),
                        'rounded-l-none px-1.5 shadow-[inset_1px_0_0_oklch(0_0_0/0.12),inset_0_1px_0_oklch(1_0_0/0.18),0_1px_0_oklch(0_0_0/0.16)]',
                      )}
                    >
                      <ChevronDown className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px]">
                      <DropdownMenuItem onSelect={() => setPlayMode('window')}>
                        <Play />
                        {t.slide.presentInWindow}
                        <DropdownMenuShortcut>↵</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setPlayMode('fullscreen')}>
                        <Maximize />
                        {t.slide.presentFullscreen}
                        <DropdownMenuShortcut>F</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          if (slideId) openPresenterWindow(slideId);
                          setPlayMode('window');
                        }}
                      >
                        <MonitorSpeaker />
                        {t.slide.presentPresenter}
                        <DropdownMenuShortcut>P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </header>

          {view === 'assets' ? (
            <div className="min-h-0 flex-1">
              <AssetView slideId={slideId} />
            </div>
          ) : (
            <DesignProvider slideId={slideId}>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                  <ResizableRail
                    pages={pages}
                    design={slide.design}
                    current={index}
                    onSelect={goTo}
                    onReorder={import.meta.env.DEV ? reorderPage : undefined}
                    actions={thumbnailActions}
                    moduleTransition={slide.transition}
                    onOverview={() => setOverviewOpen(true)}
                  />
                  <main
                    ref={slideViewportRef}
                    data-inspector-root
                    data-slide-id={slideId}
                    className="paper relative min-h-0 min-w-0 flex-1 bg-canvas p-2 md:p-10"
                  >
                    <SlideViewportNavigation
                      targetRef={slideViewportRef}
                      onPrev={() => goTo(index - 1)}
                      onNext={() => goTo(index + 1)}
                      canPrev={index > 0}
                      canNext={index < pageCount - 1}
                    />
                    <SlideCanvas design={slide.design}>
                      <SlideTransitionLayer
                        pages={pages}
                        index={index}
                        total={pageCount}
                        moduleTransition={slide.transition}
                        disabled={prefersReducedMotion}
                      />
                    </SlideCanvas>
                    <InspectOverlay />
                    <SaveBar />
                    {import.meta.env.DEV && <CommentWidget />}
                  </main>
                  {/* Mobile-only horizontal rail. Sits below the canvas and
                    pads its bottom for the iOS home indicator / Safari URL bar. */}
                  <div
                    className="shrink-0 border-t border-hairline md:hidden"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                  >
                    <ThumbnailRail
                      pages={pages}
                      design={slide.design}
                      current={index}
                      onSelect={goTo}
                      orientation="horizontal"
                      actions={thumbnailActions}
                    />
                  </div>
                  <InspectorPanel />
                  <DesignPanel open={designOpen} onClose={() => setDesignOpen(false)} />
                </div>
                {import.meta.env.DEV && (
                  <NotesDrawer
                    slideId={slideId}
                    index={index}
                    total={pageCount}
                    initial={slide.notes?.[index]}
                  />
                )}
                <OverviewGrid
                  pages={pages}
                  design={slide.design}
                  open={overviewOpen}
                  current={index}
                  onClose={() => setOverviewOpen(false)}
                  onSelect={goTo}
                  variant="editor"
                  moduleTransition={slide.transition}
                />
              </div>
            </DesignProvider>
          )}
        </div>
      </InspectorProvider>
    </HistoryProvider>
  );
}

const RAIL_WIDTH_STORAGE_KEY = 'open-slide:thumbnail-rail-width';
const DEFAULT_RAIL_WIDTH = 264;
const MIN_RAIL_WIDTH = 200;
const MAX_RAIL_WIDTH = 480;

function readStoredRailWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_RAIL_WIDTH;
  const raw = window.localStorage.getItem(RAIL_WIDTH_STORAGE_KEY);
  const parsed = raw == null ? Number.NaN : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_RAIL_WIDTH;
  return Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, parsed));
}

function ResizableRail(props: {
  pages: SlideModule['default'];
  design?: SlideModule['design'];
  current: number;
  onSelect: (i: number) => void;
  onReorder?: (from: number, to: number) => void;
  actions?: ThumbnailActions;
  moduleTransition?: SlideModule['transition'];
  onOverview?: () => void;
}) {
  const t = useLocale();
  const [width, setWidth] = useState<number>(readStoredRailWidth);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RAIL_WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    if (!resizing) return;
    const prev = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prev.cursor;
      document.body.style.userSelect = prev.userSelect;
    };
  }, [resizing]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: width };
    setResizing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    const next = Math.min(
      MAX_RAIL_WIDTH,
      Math.max(MIN_RAIL_WIDTH, dragRef.current.startWidth + delta),
    );
    setWidth(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setResizing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.max(MIN_RAIL_WIDTH, w - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.min(MAX_RAIL_WIDTH, w + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      setWidth(DEFAULT_RAIL_WIDTH);
    }
  };

  return (
    <div className="relative hidden shrink-0 md:block" style={{ width }}>
      <ThumbnailRail width={width} {...props} />
      {/* biome-ignore lint/a11y/useSemanticElements: focusable resize handle (splitter pattern), not a static <hr> */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t.thumbnailRail.resizeRail}
        aria-valuenow={width}
        aria-valuemin={MIN_RAIL_WIDTH}
        aria-valuemax={MAX_RAIL_WIDTH}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => setWidth(DEFAULT_RAIL_WIDTH)}
        className={cn(
          'group/resize absolute inset-y-0 right-0 z-20 w-1.5 translate-x-1/2 cursor-col-resize touch-none outline-none',
          'focus-visible:bg-brand/20',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brand opacity-0 transition-opacity',
            'group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100',
            resizing && 'opacity-100',
          )}
        />
      </div>
    </div>
  );
}

function AgentConnectedBadge() {
  const t = useLocale();
  const connected = useAgentSocketConnected();
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ml-1 flex shrink-0 cursor-help items-center gap-1.5 rounded-[3px] border border-hairline bg-card px-1.5 py-0.5 text-[10.5px] text-foreground/85 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <span aria-hidden className="relative flex size-1.5 items-center justify-center">
              {connected ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
              )}
            </span>
            {connected ? t.slide.agentConnected : t.slide.agentDisconnected}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="w-max max-w-[min(520px,calc(100vw-2rem))] text-center leading-relaxed"
        >
          {connected ? t.slide.agentConnectedTooltip : t.slide.agentDisconnectedTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SelectionReporter() {
  const { selected } = useInspector();
  useEffect(() => {
    if (!import.meta.hot) return;
    const selection = selected
      ? {
          line: selected.line,
          column: selected.column,
          tagName: selected.anchor.tagName.toLowerCase(),
          text: (selected.anchor.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
        }
      : null;
    import.meta.hot.send('open-slide:current', { selection });
  }, [selected]);
  return null;
}

function SlideViewportNavigation({
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
  const isMobile = useIsMobile();

  useWheelPageNavigation({
    ref: targetRef,
    enabled: !active,
    canPrev,
    canNext,
    onPrev,
    onNext,
  });

  // Tap-to-navigate is a touch affordance — desktop has visible prev/next
  // chrome, so it stays edge-only on small screens (matches the old md:hidden
  // zones). Interactive slide content keeps its tap via the hook's passthrough.
  useClickPageNavigation({
    ref: targetRef,
    enabled: isMobile && !active,
    edgeRatio: 0.18,
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
  const t = useLocale();

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
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="inline-grid max-w-full items-center">
          <span
            aria-hidden
            className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre border border-transparent px-2 py-0.5 font-heading text-[13.5px] font-semibold tracking-[-0.01em]"
          >
            {value || ' '}
          </span>
          <input
            ref={inputRef}
            size={1}
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
                cancel();
              }
            }}
            maxLength={80}
            className="col-start-1 row-start-1 w-full min-w-0 rounded-[5px] border border-foreground/30 bg-card px-2 py-0.5 text-center font-heading text-[13.5px] font-semibold tracking-[-0.01em] outline-none"
          />
        </div>
      </div>
    );
  }

  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-w-0 items-baseline justify-center">
        <h1 className="truncate font-heading text-[13.5px] font-semibold tracking-[-0.01em]">
          {title}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center justify-center">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={t.slide.renameSlide}
        className={cn(
          'min-w-0 max-w-full cursor-text rounded-[5px] border border-transparent px-2 py-0.5 transition-colors',
          'hover:border-foreground/30 hover:bg-card focus-visible:border-foreground/30 focus-visible:bg-card focus-visible:outline-none',
        )}
      >
        <h1 className="truncate font-heading text-[13.5px] font-semibold tracking-[-0.01em]">
          {title}
        </h1>
      </button>
    </div>
  );
}
