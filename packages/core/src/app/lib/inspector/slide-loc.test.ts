import { describe, expect, it } from 'vitest';
import { formatSlideLoc, parseSlideLoc, sameSlideLoc, slideLocSelector } from './slide-loc.ts';

describe('formatSlideLoc', () => {
  it('keeps entry locations as line:column', () => {
    expect(formatSlideLoc({ file: null, line: 12, column: 4 })).toBe('12:4');
    expect(formatSlideLoc({ file: 'index.tsx', line: 12, column: 4 })).toBe('12:4');
  });

  it('prefixes sibling files relative to the slide folder', () => {
    expect(formatSlideLoc({ file: 'pages.tsx', line: 12, column: 4 })).toBe('pages.tsx:12:4');
    expect(formatSlideLoc({ file: 'components/Card.tsx', line: 3, column: 4 })).toBe(
      'components/Card.tsx:3:4',
    );
    expect(formatSlideLoc({ file: 'components/Card.preview.tsx', line: 3, column: 4 })).toBe(
      'components/Card.preview.tsx:3:4',
    );
  });
});

describe('parseSlideLoc', () => {
  it('reads a bare line:column as the entry file', () => {
    expect(parseSlideLoc('12:4')).toEqual({ file: null, line: 12, column: 4 });
    expect(parseSlideLoc('1:0')).toEqual({ file: null, line: 1, column: 0 });
  });

  it('reads a sibling file from everything before the last two segments', () => {
    expect(parseSlideLoc('pages.tsx:12:4')).toEqual({ file: 'pages.tsx', line: 12, column: 4 });
    expect(parseSlideLoc('components/Card.tsx:3:4')).toEqual({
      file: 'components/Card.tsx',
      line: 3,
      column: 4,
    });
    expect(parseSlideLoc('components/Card.preview.tsx:3:4')).toEqual({
      file: 'components/Card.preview.tsx',
      line: 3,
      column: 4,
    });
  });

  it('treats an explicit index.tsx prefix as the entry file', () => {
    expect(parseSlideLoc('index.tsx:8:2')).toEqual({ file: null, line: 8, column: 2 });
  });

  it('rejects path traversal and non-tsx names', () => {
    expect(parseSlideLoc('../other/index.tsx:1:0')).toBeNull();
    expect(parseSlideLoc('/tmp/x.tsx:1:0')).toBeNull();
    expect(parseSlideLoc('pages.ts:1:0')).toBeNull();
    expect(parseSlideLoc('Card.preview.ts:1:0')).toBeNull();
    expect(parseSlideLoc('not-a-loc')).toBeNull();
    expect(parseSlideLoc('')).toBeNull();
    expect(parseSlideLoc('0:0')).toBeNull();
  });
});

describe('slideLocSelector', () => {
  it('quotes the formatted loc for querySelector', () => {
    expect(slideLocSelector({ file: null, line: 2, column: 2 })).toBe('[data-slide-loc="2:2"]');
    expect(slideLocSelector({ file: 'pages.tsx', line: 2, column: 2 })).toBe(
      '[data-slide-loc="pages.tsx:2:2"]',
    );
  });
});

describe('sameSlideLoc', () => {
  it('requires file, line, and column', () => {
    const loc = { file: 'pages.tsx', line: 12, column: 4 };
    expect(sameSlideLoc(loc, loc)).toBe(true);
    expect(sameSlideLoc(loc, { ...loc, column: 8 })).toBe(false);
    expect(sameSlideLoc(loc, { ...loc, line: 13 })).toBe(false);
    expect(sameSlideLoc(loc, { ...loc, file: 'other.tsx' })).toBe(false);
  });
});
