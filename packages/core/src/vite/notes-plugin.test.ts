import { describe, expect, it } from 'vitest';
import { applyNotesEdit, renderNoteLiteral } from './notes-plugin.ts';
import { hasRecentWrite, RECENT_WRITE_WINDOW_MS, recordWrite } from './recent-writes.ts';

describe('renderNoteLiteral', () => {
  it('returns undefined for empty strings', () => {
    expect(renderNoteLiteral('')).toBe('undefined');
  });

  it('uses JSON-quoted strings for single-line text', () => {
    expect(renderNoteLiteral('hello')).toBe('"hello"');
    expect(renderNoteLiteral('with "quotes"')).toBe('"with \\"quotes\\""');
  });

  it('uses template literals for multi-line text and escapes specials', () => {
    expect(renderNoteLiteral('a\nb')).toBe('`a\nb`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    expect(renderNoteLiteral('back`tick\nand ${interp}')).toBe('`back\\`tick\nand \\${interp}`');
    expect(renderNoteLiteral('back\\slash\nhere')).toBe('`back\\\\slash\nhere`');
  });
});

describe('applyNotesEdit / no existing export', () => {
  it('inserts a new notes export padded to the target index', () => {
    const source = `import type { Page } from '@open-slide/core';\n\nexport default [];\n`;
    const result = applyNotesEdit(source, 2, 'hello');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain(
      'export const notes: (string | undefined)[] = [\n' +
        '  undefined,\n' +
        '  undefined,\n' +
        '  "hello",\n' +
        '];',
    );
  });

  it('places the export after the last import', () => {
    const source = `import a from 'a';\nimport b from 'b';\n\nexport default [];\n`;
    const result = applyNotesEdit(source, 0, 'first');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const importEnd = result.source.indexOf("import b from 'b';") + "import b from 'b';".length;
    const exportStart = result.source.indexOf('export const notes');
    expect(exportStart).toBeGreaterThan(importEnd);
    expect(result.source.indexOf('export default [];')).toBeGreaterThan(exportStart);
  });

  it('is a no-op when text is empty and there is no export', () => {
    const source = `export default [];\n`;
    const result = applyNotesEdit(source, 3, '');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe(source);
  });
});

describe('applyNotesEdit / existing export', () => {
  it('updates an existing slot in place', () => {
    const source = [
      "import type { Page } from '@open-slide/core';",
      '',
      'export default [];',
      '',
      'export const notes = [',
      '  "old",',
      '  undefined,',
      '];',
      '',
    ].join('\n');
    const result = applyNotesEdit(source, 0, 'new');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('"new"');
    expect(result.source).not.toContain('"old"');
  });

  it('pads with undefined when extending past current length', () => {
    const source = `export const notes = ["a"];\nexport default [];\n`;
    const result = applyNotesEdit(source, 3, 'd');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('[\n  "a",\n  undefined,\n  undefined,\n  "d",\n]');
  });

  it('clears a slot back to undefined and trims trailing undefined entries', () => {
    const source = `export const notes = ["a", "b", "c"];\nexport default [];\n`;
    const result = applyNotesEdit(source, 2, '');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('[\n  "a",\n  "b",\n]');
    expect(result.source).not.toContain('"c"');
  });

  it('preserves existing element source formatting (template literals, comments)', () => {
    const original = '`multi\nline old`';
    const source = `export const notes = [\n  ${original},\n  "kept",\n];\n`;
    const result = applyNotesEdit(source, 0, 'replaced');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('"replaced"');
    expect(result.source).toContain('"kept"');
    expect(result.source).not.toContain('multi\nline old');
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
  it('round-trips strings with backticks and ${} via template literals', () => {
    const source = `export const notes = [];\n`;
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    const text = 'has `backticks` and ${vars}\nover lines';
    const result = applyNotesEdit(source, 0, text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    expect(result.source).toContain('`has \\`backticks\\` and \\${vars}\nover lines`');
  });

  it('rejects non-array notes export', () => {
    const source = `export const notes = "oops";\n`;
    const result = applyNotesEdit(source, 0, 'x');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });
});

describe('recent-writes window', () => {
  it('reports a freshly recorded write as recent for the whole window', () => {
    const file = '/slides/recent-a/index.tsx';
    const now = 1_000_000;
    recordWrite(file, now);
    expect(hasRecentWrite(file, now)).toBe(true);
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS - 1)).toBe(true);
  });

  it('treats an unrecorded file as not recent', () => {
    expect(hasRecentWrite('/slides/never-written/index.tsx', 1)).toBe(false);
  });

  it('expires entries after the window so a later genuine edit is not suppressed', () => {
    const file = '/slides/recent-b/index.tsx';
    const now = 2_000_000;
    recordWrite(file, now);
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS)).toBe(false);
    // The expired entry is pruned, so a subsequent check stays false too.
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS + 5_000)).toBe(false);
  });
});
