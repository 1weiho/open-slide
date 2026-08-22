import { randomUUID } from 'node:crypto';

/** `<prefix>-` plus 8 hex chars — short enough to read, long enough to not collide. */
export function shortId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}
