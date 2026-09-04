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
