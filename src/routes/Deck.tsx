import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { loadDeck } from '../lib/decks';
import type { DeckModule } from '../lib/sdk';
import { SlideCanvas } from '../components/SlideCanvas';
import { ThumbnailRail } from '../components/ThumbnailRail';
import { Player } from '../components/Player';

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
      <div className="deck-error">
        <Link to="/">← Home</Link>
        <h2>Failed to load deck</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!deck) {
    return <div className="deck-loading">Loading {deckId}…</div>;
  }

  if (pageCount === 0) {
    return (
      <div className="deck-error">
        <Link to="/">← Home</Link>
        <h2>Empty deck</h2>
        <p>
          <code>slides/{deckId}/index.tsx</code> must{' '}
          <code>export default</code> a non-empty array of components.
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
    <div className="deck">
      <header className="deck-header">
        <Link to="/" className="deck-back">← Home</Link>
        <h1 className="deck-title">{title}</h1>
        <div className="deck-actions">
          <button className="primary" onClick={() => setPlaying(true)}>
            ▶ Play (F)
          </button>
        </div>
      </header>
      <div className="deck-body">
        <ThumbnailRail pages={pages} current={index} onSelect={goTo} />
        <main className="deck-main">
          <SlideCanvas>
            <CurrentPage />
          </SlideCanvas>
        </main>
      </div>
      <footer className="deck-footer">
        <button onClick={() => goTo(index - 1)} disabled={index === 0}>
          ◀ Prev
        </button>
        <span className="deck-counter">
          {index + 1} / {pageCount}
        </span>
        <button onClick={() => goTo(index + 1)} disabled={index === pageCount - 1}>
          Next ▶
        </button>
      </footer>
    </div>
  );
}
