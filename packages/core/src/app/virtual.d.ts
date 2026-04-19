declare module 'virtual:open-slide/decks' {
  import type { DeckModule } from './lib/sdk';
  export const deckIds: string[];
  export function loadDeck(id: string): Promise<DeckModule>;
}

declare module 'virtual:open-slide/config' {
  const config: {
    title?: string;
    slidesDir?: string;
    port?: number;
  };
  export default config;
}
