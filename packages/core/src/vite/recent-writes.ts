// Shared write-suppression window for dev HMR.
//
// When the notes plugin writes a slide file in response to a speaker-note
// edit, that file change fires an HMR update. Two plugins need to recognise
// the write as self-induced so they can leave the slide canvas alone:
//   - notes-plugin suppresses React Fast Refresh (RFR remounts the tree and
//     steals textarea focus mid-typing);
//   - open-slide-plugin must NOT broadcast `open-slide:slide-changed`, which
//     bumps the dev `loadSlide` cache-bust token and forces a module reload
//     and remount.
//
// Both plugins consult this single shared window. Entries are time-bounded and
// pruned lazily, so the check is non-consuming and independent of the order in
// which Vite invokes each plugin's `handleHotUpdate`.

const recentWrites = new Map<string, number>();

export const RECENT_WRITE_WINDOW_MS = 1500;

/** Record that `file` was just written by us. */
export function recordWrite(file: string, now: number = Date.now()): void {
  recentWrites.set(file, now);
}

/**
 * True if `file` was recorded within the recent-write window. Expired entries
 * are pruned so a stale path can no longer suppress a later genuine edit.
 */
export function hasRecentWrite(file: string, now: number = Date.now()): boolean {
  const ts = recentWrites.get(file);
  if (ts == null) return false;
  if (now - ts < RECENT_WRITE_WINDOW_MS) return true;
  recentWrites.delete(file);
  return false;
}
