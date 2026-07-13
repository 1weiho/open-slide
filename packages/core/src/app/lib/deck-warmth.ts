// Per-document registry so a deck gates the UI on its first open only —
// revisits within the same tab skip straight to the slides.
const warmedDecks = new Set<string>();

export function isDeckWarmed(slideId: string): boolean {
  return warmedDecks.has(slideId);
}

export function markDeckWarmed(slideId: string): void {
  warmedDecks.add(slideId);
}
