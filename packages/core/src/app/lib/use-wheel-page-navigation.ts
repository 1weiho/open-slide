import { type RefObject, useEffect, useRef } from 'react';

const WHEEL_PAGE_THRESHOLD_PX = 12;
const WHEEL_NAV_COOLDOWN_MS = 100;
const WHEEL_GESTURE_IDLE_MS = 80;

type UseWheelPageNavigationOptions<T extends HTMLElement> = {
  ref: RefObject<T>;
  enabled?: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function useWheelPageNavigation<T extends HTMLElement>({
  ref,
  enabled = true,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: UseWheelPageNavigationOptions<T>) {
  const accumulatedDeltaRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const lastNavigateAtRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || shouldIgnoreWheelTarget(event.target)) return;

      const deltaY = normalizeDeltaY(event);
      if (Math.abs(deltaY) <= Math.abs(normalizeDeltaX(event))) return;

      const now = performance.now();
      if (now - lastWheelAtRef.current > WHEEL_GESTURE_IDLE_MS) {
        accumulatedDeltaRef.current = 0;
      }
      lastWheelAtRef.current = now;

      if (now - lastNavigateAtRef.current < WHEEL_NAV_COOLDOWN_MS) {
        event.preventDefault();
        return;
      }

      accumulatedDeltaRef.current += deltaY;
      if (Math.abs(accumulatedDeltaRef.current) < WHEEL_PAGE_THRESHOLD_PX) {
        event.preventDefault();
        return;
      }

      const direction = Math.sign(accumulatedDeltaRef.current);
      accumulatedDeltaRef.current = 0;
      event.preventDefault();

      if (direction > 0 && canNext) {
        lastNavigateAtRef.current = now;
        onNext();
      } else if (direction < 0 && canPrev) {
        lastNavigateAtRef.current = now;
        onPrev();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [ref, enabled, canPrev, canNext, onPrev, onNext]);
}

function normalizeDeltaY(event: WheelEvent) {
  return normalizeWheelDelta(event.deltaY, event.deltaMode);
}

function normalizeDeltaX(event: WheelEvent) {
  return normalizeWheelDelta(event.deltaX, event.deltaMode);
}

function normalizeWheelDelta(delta: number, deltaMode: number) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * 16;
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * 800;
  return delta;
}

function shouldIgnoreWheelTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [data-wheel-nav-ignore]'),
  );
}
