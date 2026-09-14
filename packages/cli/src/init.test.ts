import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isDirNonEmpty, sanitizeDirName, scaffold } from './init.ts';

describe('scaffold overwrite protection', () => {
  let target: string;

  beforeEach(async () => {
    target = await mkdtemp(join(tmpdir(), 'open-slide-init-'));
    vi.stubGlobal('__CORE_VERSION_AT_BUILD__', '2.0.0-beta.1');
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(target, { recursive: true, force: true });
  });

  it.each(['.gitignore', '.claude/settings.json', '.agents/skills/custom/SKILL.md', 'keep.txt'])(
    'rejects a target containing %s without changing its contents',
    async (relativePath) => {
      const file = join(target, relativePath);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, 'existing contents\n');
      const entries = await readdir(target);

      expect(await isDirNonEmpty(target)).toBe(true);
      await expect(scaffold({ target, force: false, name: undefined })).rejects.toThrow(
        'not empty',
      );
      expect(await readFile(file, 'utf8')).toBe('existing contents\n');
      expect(await readdir(target)).toEqual(entries);
    },
  );

  it('initializes an empty directory', async () => {
    await scaffold({ target, force: false, name: 'test-slides' });

    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('test-slides');
  });

  it('initializes a directory containing only Git metadata', async () => {
    await mkdir(join(target, '.git'));
    await writeFile(join(target, '.git', 'config'), 'existing git config\n');

    expect(await isDirNonEmpty(target)).toBe(false);
    await scaffold({ target, force: false, name: 'test-slides' });

    expect(await readFile(join(target, '.git', 'config'), 'utf8')).toBe('existing git config\n');
    expect(await readdir(target)).toContain('package.json');
  });

  it('overwrites existing files when force is explicit', async () => {
    await writeFile(join(target, '.gitignore'), 'custom-cache/\n');

    await scaffold({ target, force: true, name: 'test-slides' });

    expect(await readFile(join(target, '.gitignore'), 'utf8')).toBe(
      'node_modules\ndist\n.DS_Store\n',
    );
  });
});

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
