import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractMeta, generateSlidesModule } from './open-slide-plugin.ts';

async function withSlidesRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeSlide(root: string, id: string): Promise<string> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  const entry = path.join(root, id, 'index.tsx');
  await fs.writeFile(
    entry,
    `export const meta = { title: '${id}' };\nexport default [];\n`,
    'utf8',
  );
  return entry;
}

describe('extractMeta', () => {
  it('reads every supported field', () => {
    const src = [
      "export const meta = { title: 'Cover', theme: 'aurora',",
      "  summary: 'What the deck covers.', createdAt: '2026-05-16T12:00:00Z' };",
      'export default [];',
    ].join('\n');
    expect(extractMeta(src)).toEqual({
      title: 'Cover',
      theme: 'aurora',
      summary: 'What the deck covers.',
      createdAt: '2026-05-16T12:00:00Z',
    });
  });

  it('returns nulls when there is no meta export', () => {
    expect(extractMeta('export default [];\n')).toEqual({
      title: null,
      theme: null,
      summary: null,
      createdAt: null,
    });
  });

  it('keeps apostrophes inside a double-quoted value', () => {
    const src = `export const meta = { title: "Pre-Rendering & 'use cache'" };\n`;
    expect(extractMeta(src).title).toBe("Pre-Rendering & 'use cache'");
  });

  it('keeps double quotes inside a single-quoted value', () => {
    const src = `export const meta = { summary: 'They call it "streaming".' };\n`;
    expect(extractMeta(src).summary).toBe('They call it "streaming".');
  });

  it('unescapes an escaped delimiter', () => {
    const src = `export const meta = { title: 'It\\'s here' };\n`;
    expect(extractMeta(src).title).toBe("It's here");
  });

  it('resolves control escapes instead of dropping the backslash', () => {
    const src = `export const meta = { summary: 'Line one\\nline two\\ttabbed' };\n`;
    expect(extractMeta(src).summary).toBe('Line one\nline two\ttabbed');
  });

  it('keeps a literal backslash', () => {
    const src = `export const meta = { title: 'C:\\\\Users' };\n`;
    expect(extractMeta(src).title).toBe('C:\\Users');
  });

  it('resolves hex and unicode escapes', () => {
    const src = `export const meta = { title: '\\x41 \\u00e9 \\u{1f600}' };\n`;
    expect(extractMeta(src).title).toBe('A é 😀');
  });

  it('leaves an out-of-range code point as written rather than throwing', () => {
    const src = `export const meta = { title: 'edge \\u{110000}' };\n`;
    expect(extractMeta(src).title).toBe('edge \\u{110000}');
  });

  it('does not end the meta object at a brace inside a value', () => {
    const src = `export const meta = { summary: 'Covers the {curly} case', title: 'Braces' };\n`;
    const meta = extractMeta(src);
    expect(meta.summary).toBe('Covers the {curly} case');
    expect(meta.title).toBe('Braces');
  });

  it('ignores a template literal rather than capturing it half-parsed', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    const src = 'export const meta = { title: `Backticks ${nope}` };\n';
    expect(extractMeta(src).title).toBeNull();
  });

  it('only reads inside the meta object body', () => {
    const src = [
      "const decoy = { title: 'Decoy' };",
      "export const meta = { theme: 'aurora' };",
    ].join('\n');
    const meta = extractMeta(src);
    expect(meta.title).toBeNull();
    expect(meta.theme).toBe('aurora');
  });
});

describe('generateSlidesModule', () => {
  it('keeps slides whose id is ASCII-safe and reports none ignored', async () => {
    await withSlidesRoot(async (root) => {
      const files = [await writeSlide(root, 'cover'), await writeSlide(root, 'intro_2')].sort();

      const { code, ignored } = await generateSlidesModule(files, root, false);

      expect(ignored).toEqual([]);
      expect(code).toContain('export const slideIds = ["cover","intro_2"];');
    });
  });

  it('excludes folders whose id is not ASCII-safe and reports them as ignored', async () => {
    await withSlidesRoot(async (root) => {
      const files = [await writeSlide(root, 'cover'), await writeSlide(root, '推薦系統')].sort();

      const { code, ignored } = await generateSlidesModule(files, root, false);

      expect(ignored).toEqual(['推薦系統']);
      expect(code).toContain('export const slideIds = ["cover"];');
      expect(code).not.toContain('推薦系統');
    });
  });
});
