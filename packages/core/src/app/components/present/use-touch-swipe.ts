import { type RefObject, useEffect, useRef } from 'react';

const MIN_SWIPE_PX = 50;
const MAX_SWIPE_MS = 600;

type Options<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  enabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * Single-finger horizontal swipe → prev/next. Vertical-dominant gestures
 * are left alone so scroll-y on tablets keeps working. The handler only
 * binds when `enabled`, so overlay layers can suppress it.
 */
export function useTouchSwipe<T extends HTMLElement>({
  ref,
  enabled = true,
  onPrev,
  onNext,
}: Options<T>) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: performance.now() };
    };
    const onEnd = (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (performance.now() - s.t > MAX_SWIPE_MS) return;
      if (Math.abs(dx) < MIN_SWIPE_PX) return;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) onNext();
      else onPrev();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', () => {
      start.current = null;
    });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [ref, enabled, onPrev, onNext]);
}
