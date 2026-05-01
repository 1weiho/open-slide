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
 * Returns `true` once `ref.current` has entered the viewport (or its
 * expanded `rootMargin`). The flag is sticky — once true it never flips
 * back, so quick scroll-back doesn't tear down work we already paid for.
 *
 * Critical for iOS Safari: rendering many full 1920×1080 React trees as
 * thumbnails saturates GPU memory and can crash the tab. This hook lets
 * callers defer expensive work (mounting heavy subtrees, dynamic-importing
 * slide modules) until the user might actually see the result.
 */
export function useHasBeenVisible(ref: RefObject<Element | null>, rootMargin = '200px'): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, visible]);

  return visible;
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
  /** Children are mounted only once the wrapper enters the viewport. */
  children: ReactNode;
};

/**
 * Convenience wrapper around `useHasBeenVisible` that handles the common
 * "mount children when visible, otherwise render a placeholder" pattern.
 */
export function LazyThumbnail({ className, style, placeholder, rootMargin, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useHasBeenVisible(ref, rootMargin);
  return (
    <div ref={ref} className={cn('relative h-full w-full', className)} style={style}>
      {visible ? children : placeholder}
    </div>
  );
}
