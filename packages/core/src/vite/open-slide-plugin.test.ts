import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSlidesModule } from './open-slide-plugin.ts';

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

async function writeSlideSource(root: string, id: string, source: string): Promise<string> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  const entry = path.join(root, id, 'index.tsx');
  await fs.writeFile(entry, source, 'utf8');
  return entry;
}

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

  it('emits slideTags parsed from meta, unescaping quotes and ignoring decoys', async () => {
    await withSlidesRoot(async (root) => {
      const files = [
        await writeSlideSource(
          root,
          'a',
          `export const meta = { title: 'has tags: [decoy]', tags: ['it\\'s', 'topic'] };\nexport default [];\n`,
        ),
        await writeSlideSource(
          root,
          'b',
          `export const meta = { title: 'b' };\nexport default [];\n`,
        ),
      ].sort();

      const { code } = await generateSlidesModule(files, root, false);

      // The escaped quote is decoded and the [decoy] inside the title string is
      // not mistaken for the tags array; slides without tags are omitted.
      expect(code).toContain(`export const slideTags = {"a":["it's","topic"]};`);
    });
  });

  it('ignores a commented-out tags decoy when emitting slideTags', async () => {
    await withSlidesRoot(async (root) => {
      const files = [
        await writeSlideSource(
          root,
          'a',
          `export const meta = {\n  // tags: ['decoy'],\n  tags: ['real'],\n};\nexport default [];\n`,
        ),
      ];

      const { code } = await generateSlidesModule(files, root, false);

      expect(code).toContain(`export const slideTags = {"a":["real"]};`);
    });
  });

  it('extracts tags when a string value contains an unbalanced brace', async () => {
    await withSlidesRoot(async (root) => {
      const files = [
        await writeSlideSource(
          root,
          'a',
          `export const meta = { title: 'contains }', tags: ['kept'] };\nexport default [];\n`,
        ),
      ];

      const { code } = await generateSlidesModule(files, root, false);

      expect(code).toContain(`export const slideTags = {"a":["kept"]};`);
    });
  });

  it('ignores string tokens inside comments within the tags array', async () => {
    await withSlidesRoot(async (root) => {
      const files = [
        await writeSlideSource(
          root,
          'a',
          `export const meta = { tags: [/* 'internal' */ 'public'] };\nexport default [];\n`,
        ),
      ];

      const { code } = await generateSlidesModule(files, root, false);

      expect(code).toContain(`export const slideTags = {"a":["public"]};`);
    });
  });
});
