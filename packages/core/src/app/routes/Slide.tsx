import { ChevronLeft, Download, Loader2, Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CommentWidget } from '@/components/inspector/CommentWidget';
import { InspectOverlay } from '@/components/inspector/InspectOverlay';
import { InspectorProvider, InspectToggleButton } from '@/components/inspector/InspectorProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ClickNavZones } from '../components/ClickNavZones';
import { Player } from '../components/Player';
import { SlideCanvas } from '../components/SlideCanvas';
import { ThumbnailRail } from '../components/ThumbnailRail';
import { exportSlideAsHtml } from '../lib/export-html';
import { loadSlide } from '../lib/slides';
import type { SlideModule } from '../lib/sdk';

export function Slide() {
  const { slideId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          ← Home
        </Link>
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
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          ← Home
        </Link>
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

  if (playing) {
    return (
      <Player pages={pages} index={index} onIndexChange={goTo} onExit={() => setPlaying(false)} />
    );
  }

  const CurrentPage = pages[index];
  const title = slide.meta?.title ?? slideId;

  return (
    <InspectorProvider slideId={slideId}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2 md:gap-4 md:px-5 md:py-3">
          <Button asChild variant="ghost" size="sm" className="px-2 md:px-3">
            <Link to="/">
              <ChevronLeft className="size-4" />
              <span className="hidden md:inline">Home</span>
            </Link>
          </Button>
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <h1 className="flex-1 truncate text-center text-xs font-semibold tracking-tight md:text-sm">
            {title}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:px-3"
            disabled={exporting}
            onClick={async () => {
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
            title="Download as HTML"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span className="hidden md:inline">Download</span>
          </Button>
          <InspectToggleButton />
          <Button size="sm" onClick={() => setPlaying(true)} className="px-2 md:px-3">
            <Play className="size-4" />
            <span className="hidden md:inline">Play</span>
            <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1 text-[10px] md:inline">
              F
            </kbd>
          </Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="hidden w-[17rem] shrink-0 md:block">
            <ThumbnailRail pages={pages} current={index} onSelect={goTo} />
          </div>
          <main
            data-inspector-root
            className="relative min-h-0 min-w-0 flex-1 bg-background p-2 md:p-8"
          >
            <SlideCanvas>
              <CurrentPage />
            </SlideCanvas>
            <ClickNavZones
              onPrev={() => goTo(index - 1)}
              onNext={() => goTo(index + 1)}
              canPrev={index > 0}
              canNext={index < pageCount - 1}
            />
            <InspectOverlay />
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur md:hidden">
              {index + 1} / {pageCount}
            </div>
          </main>
        </div>

        <CommentWidget />
      </div>
    </InspectorProvider>
  );
}
