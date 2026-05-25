import { describe, expect, it } from 'vitest';
import { sanitizeDirName } from './init.ts';

describe('sanitizeDirName', () => {
  it('leaves safe names untouched', () => {
    expect(sanitizeDirName('my-slides')).toBe('my-slides');
    expect(sanitizeDirName('decks/2026-q2')).toBe('decks/2026-q2');
    expect(sanitizeDirName('Open_Slide.workspace')).toBe('Open_Slide.workspace');
  });

  it('preserves "." and ".."', () => {
    expect(sanitizeDirName('.')).toBe('.');
    expect(sanitizeDirName('..')).toBe('..');
  });

  it('replaces spaces with hyphens', () => {
    expect(sanitizeDirName('future of open slide and how can i help')).toBe(
      'future-of-open-slide-and-how-can-i-help',
    );
  });

  it('collapses runs of whitespace into a single hyphen', () => {
    expect(sanitizeDirName('foo   bar\tbaz')).toBe('foo-bar-baz');
  });

  it('replaces shell-unfriendly characters', () => {
    expect(sanitizeDirName("my deck's notes")).toBe('my-deck-s-notes');
    expect(sanitizeDirName('cool$deck')).toBe('cool-deck');
    expect(sanitizeDirName('a&b|c;d')).toBe('a-b-c-d');
  });

  it('trims leading and trailing hyphens', () => {
    expect(sanitizeDirName('  hello  ')).toBe('hello');
    expect(sanitizeDirName('!!!hi!!!')).toBe('hi');
  });

  it('falls back to "my-slides" when nothing usable remains', () => {
    expect(sanitizeDirName('!!!')).toBe('my-slides');
    expect(sanitizeDirName('   ')).toBe('my-slides');
  });

  it('keeps path separators intact', () => {
    expect(sanitizeDirName('decks/my new deck')).toBe('decks/my-new-deck');
  });

  it('is idempotent', () => {
    const cases = [
      'future of open slide and how can i help',
      "my deck's notes",
      'decks/my new deck',
      '!!!hi!!!',
      '!!!',
      '.',
      '..',
    ];
    for (const input of cases) {
      const once = sanitizeDirName(input);
      const twice = sanitizeDirName(once);
      expect(twice).toBe(once);
    }
  });

  it('preserves a trailing path separator', () => {
    expect(sanitizeDirName('foo bar/')).toBe('foo-bar/');
  });

  it('collapses hyphens on both sides of a path separator', () => {
    expect(sanitizeDirName('a-/-b')).toBe('a/b');
    expect(sanitizeDirName('decks---/---my deck')).toBe('decks/my-deck');
  });

  it('preserves non-ASCII letters and digits', () => {
    expect(sanitizeDirName('投影片')).toBe('投影片');
    expect(sanitizeDirName('スライド')).toBe('スライド');
    expect(sanitizeDirName('café')).toBe('café');
    expect(sanitizeDirName('我的 投影片')).toBe('我的-投影片');
  });

  it('preserves Windows backslash separators', () => {
    expect(sanitizeDirName('slides\\q2')).toBe('slides\\q2');
    expect(sanitizeDirName('decks\\my new deck')).toBe('decks\\my-new-deck');
    expect(sanitizeDirName('a-\\-b')).toBe('a\\b');
  });

  it('falls back when sanitization would produce a root-like path', () => {
    expect(sanitizeDirName('!!!/!!!')).toBe('my-slides');
    expect(sanitizeDirName('!!!\\!!!')).toBe('my-slides');
    expect(sanitizeDirName('//')).toBe('my-slides');
  });
});
