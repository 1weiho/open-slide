import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deckIds, loadDeck } from '../lib/decks';
import type { DeckModule } from '../lib/sdk';
import { SlideCanvas } from '../components/SlideCanvas';

export function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <h1>open-slide</h1>
        <p className="home-sub">
          {deckIds.length} deck{deckIds.length === 1 ? '' : 's'} · drop a folder into{' '}
          <code>/slides</code> to add another
        </p>
      </header>
      {deckIds.length === 0 ? (
        <div className="empty">
          <p>No decks yet.</p>
          <p>
            Create <code>slides/my-deck/index.tsx</code> with{' '}
            <code>export default [Page1, Page2]</code>.
          </p>
        </div>
      ) : (
        <ul className="deck-grid">
          {deckIds.map((id) => (
            <li key={id}>
              <DeckCard id={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeckCard({ id }: { id: string }) {
  const [deck, setDeck] = useState<DeckModule | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadDeck(id)
      .then((mod) => {
        if (!cancelled) setDeck(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const FirstPage = deck?.default[0];
  const title = deck?.meta?.title ?? id;
  const pageCount = deck?.default.length ?? 0;

  return (
    <Link to={`/d/${id}`} className="deck-card">
      <div className="deck-card-preview">
        {FirstPage ? (
          <SlideCanvas className="flat">
            <FirstPage />
          </SlideCanvas>
        ) : (
          <div className="deck-card-preview-empty">Loading</div>
        )}
      </div>
      <div className="deck-card-body">
        <div className="deck-card-title">{title}</div>
        {pageCount > 0 && (
          <div className="deck-card-meta">
            {pageCount} page{pageCount === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </Link>
  );
}
