import { type RefObject, useEffect } from 'react';

// Clicks that land on (or inside) these never navigate — interactive slide
// content keeps its click, and present chrome is excluded via data-osd-chrome.
// Authors can opt any element out with a data-osd-interactive attribute.
const NAV_PASSTHROUGH =
  'a, button, input, textarea, select, label, summary, iframe, video, audio, embed, object, [role="button"], [role="link"], [contenteditable="true"], [data-osd-interactive], [data-osd-chrome]';

type UseClickPageNavigationOptions<T extends HTMLElement> = {
  ref: RefObject<T>;
  enabled?: boolean;
  /** Fraction of the width on each side that navigates; the center is inert. */
  edgeRatio?: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCenterClick?: () => void;
  onViewportClick?: (point: { x: number; y: number }) => void;
};

export function useClickPageNavigation<T extends HTMLElement>({
  ref,
  enabled = true,
  edgeRatio = 0.3,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onCenterClick,
  onViewportClick,
}: UseClickPageNavigationOptions<T>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof Element && target.closest(NAV_PASSTHROUGH)) return;
      if (window.getSelection()?.toString()) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = rect.height === 0 ? 0 : (event.clientY - rect.top) / rect.height;
      onViewportClick?.({ x, y });
      if (x < edgeRatio) {
        if (canPrev) onPrev();
      } else if (x > 1 - edgeRatio) {
        if (canNext) onNext();
      } else {
        onCenterClick?.();
      }
    };

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [ref, enabled, edgeRatio, canPrev, canNext, onPrev, onNext, onCenterClick, onViewportClick]);
}
