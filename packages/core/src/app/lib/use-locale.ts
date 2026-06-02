import type { Locale } from '../../locale/types';
import { useLocaleValue } from './locale-store';

export function useLocale(): Locale {
  return useLocaleValue();
}

export { format, plural } from '../../locale/format';
