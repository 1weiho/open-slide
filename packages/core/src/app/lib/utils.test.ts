import { describe, expect, it } from 'vitest';
import { cn } from './utils.ts';

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b');
  });

  it('flattens arrays and conditional objects from clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });

  it('lets later tailwind classes override earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('preserves classes that target different properties', () => {
    expect(cn('p-2', 'm-4')).toBe('p-2 m-4');
  });
});
