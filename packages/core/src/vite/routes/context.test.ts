import { describe, expect, it } from 'vitest';
import { decodePathSegment } from './context.ts';

describe('decodePathSegment', () => {
  it('decodes a percent-encoded non-ASCII segment', () => {
    expect(decodePathSegment('%E5%B0%81%E9%9D%A2')).toBe('封面');
  });

  it('returns a plain segment unchanged', () => {
    expect(decodePathSegment('cover')).toBe('cover');
  });

  it('decodes a percent-encoded filename with spaces and separators', () => {
    expect(decodePathSegment('my%20photo%20(1).png')).toBe('my photo (1).png');
  });

  it('returns null for a truncated escape rather than throwing', () => {
    expect(decodePathSegment('%E0%A4%A')).toBeNull();
  });

  it('returns null for a lone percent sign', () => {
    expect(decodePathSegment('%')).toBeNull();
  });

  it('preserves the empty segment', () => {
    expect(decodePathSegment('')).toBe('');
  });
});
