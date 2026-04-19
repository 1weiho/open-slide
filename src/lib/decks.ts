import type { DeckModule } from './sdk';

const modules = import.meta.glob<DeckModule>('/slides/*/index.tsx');

const entries = Object.entries(modules).map(([path, load]) => {
  const id = path.match(/\/slides\/([^/]+)\/index\.tsx$/)![1];
  return { id, load };
});

export const deckIds: string[] = entries.map((e) => e.id).sort();

export async function loadDeck(id: string): Promise<DeckModule> {
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Deck not found: ${id}`);
  return entry.load();
}
