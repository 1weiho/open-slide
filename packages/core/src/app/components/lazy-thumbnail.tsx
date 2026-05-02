import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Tracks whether `ref.current` is currently intersecting the viewport
 * (or its expanded `rootMargin`). Updates on enter AND leave — callers
 * that want sticky behaviour should layer it themselves.
 */
function useIsIntersecting(ref: RefObject<Element | null>, rootMargin: string): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return visible;
}

/**
 * Returns `true` once `ref.current` has entered the viewport (or its
 * expanded `rootMargin`). Sticky — once true it never flips back, so a
 * quick scroll-back doesn't tear down work we already paid for.
 */
export function useHasBeenVisible(ref: RefObject<Element | null>, rootMargin = '200px'): boolean {
  const isVisible = useIsIntersecting(ref, rootMargin);
  const [hasBeen, setHasBeen] = useState(false);
  useEffect(() => {
    if (isVisible) setHasBeen(true);
  }, [isVisible]);
  return hasBeen;
}

type Props = {
  className?: string;
  style?: CSSProperties;
  /** Rendered before the wrapper has ever entered the viewport. */
  placeholder?: ReactNode;
  /**
   * Distance outside the viewport at which to start mounting children, so
   * the user doesn't see a flash when scrolling. Defaults to `200px`.
   */
  rootMargin?: string;
  /**
   * When `true` (default), children stay mounted once they've appeared —
   * cheap re-scroll back, but every scrolled-past thumbnail accumulates
   * a GPU surface. When `false`, children unmount as soon as they leave
   * the viewport: the React tree (and its 1920×1080 GPU layer) goes
   * away, bounding concurrent thumbnail cost. Used by `ThumbnailRail`
   * to keep iOS Safari from running out of GPU memory on long decks.
   */
  sticky?: boolean;
  /**
   * Force-mount the children regardless of visibility. `ThumbnailRail`
   * uses this to keep the active page rendered so selecting it doesn't
   * flash a placeholder.
   */
  forceMount?: boolean;
  /** Children are mounted only once the wrapper enters the viewport. */
  children: ReactNode;
};

/**
 * Convenience wrapper around `useIsIntersecting` that handles the common
 * "mount children when visible, otherwise render a placeholder" pattern.
 */
export function LazyThumbnail({
  className,
  style,
  placeholder,
  rootMargin = '200px',
  sticky = true,
  forceMount = false,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIsIntersecting(ref, rootMargin);
  const hasBeenRef = useRef(false);
  if (isVisible) hasBeenRef.current = true;
  const mounted = forceMount || (sticky ? hasBeenRef.current : isVisible);
  return (
    <div ref={ref} className={cn('relative h-full w-full', className)} style={style}>
      {mounted ? children : placeholder}
    </div>
  );
}
