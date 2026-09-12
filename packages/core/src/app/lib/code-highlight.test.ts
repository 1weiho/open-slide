import { describe, expect, it } from 'vitest';
import {
  type CodeLine,
  type CodeToken,
  getCachedLines,
  highlight,
  normalizeCode,
  plainLines,
  resolveLang,
  tokenStyle,
} from './code-highlight.ts';

describe('normalizeCode', () => {
  it('drops the newline that follows an opening backtick and trailing whitespace', () => {
    expect(normalizeCode('\nprint(1)\n  \n')).toBe('print(1)');
  });

  it('removes the indentation shared by every non-blank line', () => {
    const src = ['', '      def f():', '          return 1', '', '      f()', '      '].join('\n');
    expect(normalizeCode(src)).toBe('def f():\n    return 1\n\nf()');
  });

  it('keeps relative indentation when the first line is the least indented', () => {
    expect(normalizeCode('a\n  b\n    c')).toBe('a\n  b\n    c');
  });

  it('normalizes CRLF line endings', () => {
    expect(normalizeCode('a\r\n  b\r\n')).toBe('a\n  b');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeCode('\n   \n')).toBe('');
  });
});

describe('resolveLang', () => {
  it('returns canonical languages unchanged', () => {
    expect(resolveLang('python')).toBe('python');
    expect(resolveLang('tsx')).toBe('tsx');
  });

  it('maps aliases to their canonical language', () => {
    expect(resolveLang('js')).toBe('javascript');
    expect(resolveLang('ts')).toBe('typescript');
    expect(resolveLang('py')).toBe('python');
    expect(resolveLang('sh')).toBe('bash');
    expect(resolveLang('shell')).toBe('bash');
    expect(resolveLang('yml')).toBe('yaml');
  });

  it('is case-insensitive', () => {
    expect(resolveLang('Python')).toBe('python');
    expect(resolveLang('TSX')).toBe('tsx');
  });

  it('returns null when the language is omitted or unsupported', () => {
    expect(resolveLang(undefined)).toBeNull();
    expect(resolveLang('')).toBeNull();
    expect(resolveLang('brainfuck')).toBeNull();
  });
});

function findToken(lines: CodeLine[], text: string): CodeToken {
  for (const line of lines) {
    const hit = line.find((token) => token.content.includes(text));
    if (hit) return hit;
  }
  throw new Error(`no token containing ${JSON.stringify(text)}`);
}

describe('highlight', () => {
  it('maps python keywords, function names, strings and comments to css variables', async () => {
    const lines = await highlight('python', 'def greet():\n    return "hi"  # done');
    expect(lines).toHaveLength(2);
    expect(tokenStyle(findToken(lines, 'def'))?.color).toBe('var(--osd-code-keyword, #c678dd)');
    expect(tokenStyle(findToken(lines, 'greet'))?.color).toBe('var(--osd-code-function, #61afef)');
    expect(tokenStyle(findToken(lines, 'hi'))?.color).toBe('var(--osd-code-string, #98c379)');
    const comment = tokenStyle(findToken(lines, 'done'));
    expect(comment?.color).toBe('var(--osd-code-comment, #7f848e)');
    expect(comment?.fontStyle).toBe('italic');
  });

  it('caches results so the same input is available synchronously afterwards', async () => {
    const code = 'const n = 1;';
    expect(getCachedLines('typescript', code)).toBeUndefined();
    const lines = await highlight('typescript', code);
    expect(getCachedLines('typescript', code)).toBe(lines);
  });
});

describe('tokenStyle', () => {
  it('returns undefined for a token without color or font style', () => {
    expect(tokenStyle({ content: 'x', offset: 0 })).toBeUndefined();
  });

  it('applies italic and bold from the font style bits', () => {
    expect(tokenStyle({ content: 'x', offset: 0, fontStyle: 3 })).toEqual({
      fontStyle: 'italic',
      fontWeight: 700,
    });
  });
});

describe('plainLines', () => {
  it('yields one uncolored token per line', () => {
    expect(plainLines('a\n\nb')).toEqual([
      [{ content: 'a', offset: 0 }],
      [{ content: '', offset: 0 }],
      [{ content: 'b', offset: 0 }],
    ]);
  });
});
