import { randomUUID } from 'node:crypto';

export function shortId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}
