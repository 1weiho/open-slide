import { useEffect, useRef, useState } from 'react';
import { loadSlide, slideIds } from './slides';

/**
 * Resolves every deck's display title once `enabled` first turns true. The home
 * grid only mounts the cards of the selected folder, so cross-folder search
 * needs its own pass over the slide modules — kept lazy since it imports them all.
 */
export function useSlideTitles(enabled: boolean): Record<string, string> {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    void Promise.all(
      slideIds.map(async (id): Promise<[string, string]> => {
        try {
          const mod = await loadSlide(id);
          return [id, mod.meta?.title ?? id];
        } catch {
          return [id, id];
        }
      }),
    ).then((entries) => setTitles(Object.fromEntries(entries)));
  }, [enabled]);

  return titles;
}
