import config from 'virtual:open-slide/config';
import { en } from '../../locale/en';
import type { Locale } from '../../locale/types';

const resolved: Locale = (config.locale as Locale | undefined) ?? en;

export function useLocale(): Locale {
  return resolved;
}

export { format, plural } from '../../locale/format';
