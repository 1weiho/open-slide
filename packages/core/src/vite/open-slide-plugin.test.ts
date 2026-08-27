import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSlidesModule, resolveOpenSlideConfig } from './open-slide-plugin.ts';

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

describe('resolveOpenSlideConfig', () => {
  it('resolves a canvas preset to explicit dimensions in the virtual config', () => {
    expect(resolveOpenSlideConfig({ canvas: '8k' }, false, '1.19.1').canvas).toEqual({
      width: 7680,
      height: 4320,
    });
  });

  it('passes explicit canvas dimensions through', () => {
    expect(
      resolveOpenSlideConfig({ canvas: { width: 1080, height: 1350 } }, false, '1.19.1').canvas,
    ).toEqual({ width: 1080, height: 1350 });
  });

  it('defaults an omitted canvas to 1920x1080', () => {
    expect(resolveOpenSlideConfig({}, false, '1.19.1').canvas).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('rejects an invalid canvas before the app is served', () => {
    expect(() => resolveOpenSlideConfig({ canvas: '720p' as never }, false, '1.19.1')).toThrow(
      /Invalid open-slide canvas preset/,
    );
    expect(() =>
      resolveOpenSlideConfig({ canvas: { width: 8192, height: 4321 } }, false, '1.19.1'),
    ).toThrow(/Canvas area must be at most/);
  });
});
