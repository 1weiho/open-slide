import { useEffect, useState } from 'react';

/**
 * Returns true while the mouse pointer sits within `thresholdPx` of the
 * viewport's bottom edge. Pure pointer-position tracking — keyboard input
 * does not affect the result, so arrow-key navigation won't reveal the
 * control chrome.
 *
 * Pass `enabled = false` to short-circuit (e.g. when an overlay owns
 * visibility) and reset to false.
 */
export function usePointerNearBottom(thresholdPx: number, enabled = true) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setNear(false);
      return;
    }
    const update = (clientY: number) => {
      setNear(clientY >= window.innerHeight - thresholdPx);
    };
    const onMove = (e: MouseEvent) => update(e.clientY);
    const onLeave = () => setNear(false);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [thresholdPx, enabled]);

  return near;
}
