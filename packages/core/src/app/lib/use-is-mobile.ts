import { useEffect, useState } from 'react';

// Matches Tailwind's `md` breakpoint — below it the slide viewer hides desktop
// navigation chrome and relies on tap-to-navigate instead.
const QUERY = '(max-width: 767.98px)';

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return mobile;
}
