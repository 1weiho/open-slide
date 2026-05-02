import { useEffect, useState } from 'react';

/**
 * Reports whether the user has been idle (no pointer / key / touch input)
 * for at least `delayMs`. Resets on any input event. The hook starts in
 * the non-idle state so freshly-mounted UI is visible while the user
 * orients themselves.
 *
 * Pass `enabled = false` to short-circuit (useful when the player is
 * paused on an overlay and we don't want to hide chrome behind it).
 */
export function useIdle(delayMs: number, enabled = true) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reset = () => {
      setIdle(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), delayMs);
    };
    reset();
    const opts = { passive: true } as const;
    window.addEventListener('mousemove', reset, opts);
    window.addEventListener('mousedown', reset, opts);
    window.addEventListener('keydown', reset);
    window.addEventListener('touchstart', reset, opts);
    window.addEventListener('wheel', reset, opts);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('mousedown', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('touchstart', reset);
      window.removeEventListener('wheel', reset);
    };
  }, [delayMs, enabled]);

  return idle;
}
