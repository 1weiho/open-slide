import type { Locale } from '@open-slide/shared/locale';
import { useLocaleValue } from './locale-store';

export function useLocale(): Locale {
  return useLocaleValue();
}

export { format, plural } from '@open-slide/shared/locale';
