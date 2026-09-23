import { describe, expect, it } from 'vitest';
import { swatchValue } from './swatch-value.ts';

describe('swatchValue', () => {
  it('prefers a pending edit over the inline style', () => {
    expect(swatchValue('var(--osd-accent)', '#ff0000')).toBe('var(--osd-accent)');
  });

  it('falls back to the inline style once nothing is pending', () => {
    expect(swatchValue(undefined, 'var(--osd-accent)')).toBe('var(--osd-accent)');
    expect(swatchValue(undefined, '')).toBe('');
  });

  it('keeps a pending clear from reading as the saved token', () => {
    expect(swatchValue(null, 'var(--osd-bg)')).toBeNull();
  });
});
