import { useMediaQuery } from './use-media-query';

// Matches Tailwind's `md` breakpoint — below it the slide viewer hides desktop
// navigation chrome and relies on tap-to-navigate instead.
const QUERY = '(max-width: 767.98px)';

export function useIsMobile(): boolean {
  return useMediaQuery(QUERY);
}
