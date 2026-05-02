import { useEffect, useRef, useState } from 'react';

type Options = {
  rootMargin?: string;
  once?: boolean;
};

export function useInViewport<T extends Element>({
  rootMargin = '600px 0px',
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inViewport, setInViewport] = useState(false);

  useEffect(() => {
    if (once && inViewport) return;

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = entry?.isIntersecting ?? false;
        setInViewport(next);
        if (next && once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inViewport, once, rootMargin]);

  return [ref, inViewport] as const;
}
