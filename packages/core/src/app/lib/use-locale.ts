import type { Locale } from '../../locale/types';
import { useLocaleContext } from './locale-provider';

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export { format, plural } from '../../locale/format';
