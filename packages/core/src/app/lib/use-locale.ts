import config from 'virtual:open-slide/config';
import { en } from '../../locale/en';
import type { Locale, Plural } from '../../locale/types';

const resolved: Locale = (config.locale as Locale | undefined) ?? en;

export function useLocale(): Locale {
  return resolved;
}

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    const v = vars[key];
    return v === undefined ? m : String(v);
  });
}

export function plural(count: number, forms: Plural): string {
  return count === 1 ? forms.one : forms.other;
}
