import type { Plural } from './types';

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    const v = vars[key];
    return v === undefined ? m : String(v);
  });
}

export function plural(count: number, forms: Plural): string {
  return count === 1 ? forms.one : forms.other;
}
