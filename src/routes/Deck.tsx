import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { loadDeck } from '../lib/decks';
import type { DeckModule } from '../lib/sdk';
import { SlideCanvas } from '../components/SlideCanvas';
import { ThumbnailRail } from '../components/ThumbnailRail';
import { Player } from '../components/Player';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Deck() {
  const { deckId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deck, setDeck] = useState<DeckModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDeck(null);
    setError(null);
    loadDeck(deckId)
      .then((mod) => {
        if (!cancelled) setDeck(mod);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const pages = useMemo(() => deck?.default ?? [], [deck]);
  const pageCount = pages.length;
  const rawIndex = Number(searchParams.get('p') ?? '1') - 1;
  const index = Number.isFinite(rawIndex)
    ? Math.max(0, Math.min(pageCount - 1, rawIndex))
    : 0;

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
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
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
        <h2 className="mt-4 text-xl font-semibold text-foreground">Failed to load deck</h2>
        <pre className="mt-4 overflow-auto rounded-md border bg-card p-4 text-xs whitespace-pre-wrap shadow-sm">
          {error}
        </pre>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-muted-foreground">
        Loading {deckId}…
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          ← Home
        </Link>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Empty deck</h2>
        <p className="mt-2 text-sm">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            slides/{deckId}/index.tsx
          </code>{' '}
          must{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            export default
          </code>{' '}
          a non-empty array of components.
        </p>
      </div>
    );
  }

  if (playing) {
    return (
      <Player
        pages={pages}
        index={index}
        onIndexChange={goTo}
        onExit={() => setPlaying(false)}
      />
    );
  }

  const CurrentPage = pages[index];
  const title = deck.meta?.title ?? deckId;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-4 border-b bg-card px-5 py-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ChevronLeft className="size-4" />
            Home
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h1 className="flex-1 text-center text-sm font-semibold tracking-tight">{title}</h1>
        <Button size="sm" onClick={() => setPlaying(true)}>
          <Play className="size-4" />
          Play <kbd className="ml-1 rounded bg-primary-foreground/20 px-1 text-[10px]">F</kbd>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="w-60 shrink-0">
          <ThumbnailRail pages={pages} current={index} onSelect={goTo} />
        </div>
        <main className="min-h-0 min-w-0 flex-1 bg-background p-8">
          <SlideCanvas>
            <CurrentPage />
          </SlideCanvas>
        </main>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-4 border-t bg-card p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground tabular-nums">
          {index + 1} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(index + 1)}
          disabled={index === pageCount - 1}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
