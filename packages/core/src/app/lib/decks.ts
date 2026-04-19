import type { DeckModule } from './sdk';
import { deckIds as ids, loadDeck as load } from 'virtual:open-slide/decks';

export const deckIds: string[] = ids;

export async function loadDeck(id: string): Promise<DeckModule> {
  return load(id);
}
