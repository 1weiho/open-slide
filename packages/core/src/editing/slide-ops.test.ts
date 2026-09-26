import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addPageToDefaultExportInSource,
  duplicateNotesElementInSource,
  duplicatePageInDefaultExportInSource,
  duplicateSlideDir,
  removeNotesElementInSource,
  removePageFromDefaultExportInSource,
  reorderDefaultExportPagesInSource,
  reorderNotesArrayInSource,
  updateMetaTitleInSource,
  validateSlideName,
} from './slide-ops.ts';

async function withSlidesRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeSlide(root: string, id: string, title = id): Promise<void> {
  await fs.mkdir(path.join(root, id, 'assets'), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.tsx'),
    `export const meta = { title: '${title}' };\nexport default [];\n`,
    'utf8',
  );
  await fs.writeFile(path.join(root, id, 'assets', 'hero.txt'), 'hero', 'utf8');
}

describe('duplicateSlideDir', () => {
  it('duplicates a slide directory with an automatic copy id', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover', 'Cover');

      const result = await duplicateSlideDir(root, 'cover');

      expect(result).toEqual({ ok: true, slideId: 'cover-copy' });
      await expect(fs.readFile(path.join(root, 'cover-copy', 'index.tsx'), 'utf8')).resolves.toBe(
        `export const meta = { title: 'Cover (copy)' };\nexport default [];\n`,
      );
      await expect(
        fs.readFile(path.join(root, 'cover-copy', 'assets', 'hero.txt'), 'utf8'),
      ).resolves.toBe('hero');
    });
  });

  it('increments the automatic copy id when a copy already exists', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover');

      expect(await duplicateSlideDir(root, 'cover')).toEqual({ ok: true, slideId: 'cover-copy' });
      expect(await duplicateSlideDir(root, 'cover')).toEqual({
        ok: true,
        slideId: 'cover-copy-2',
      });
    });
  });

  it('rejects source slide ids with bad characters', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, 'bad id')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('rejects an existing desired id', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover');
      await writeSlide(root, 'target');

      expect(await duplicateSlideDir(root, 'cover', 'target')).toMatchObject({
        ok: false,
        status: 409,
      });
    });
  });

  it('rejects path traversal in the source slide id', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, '..')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('returns not found when the source slide does not exist', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, 'missing')).toMatchObject({ ok: false, status: 404 });
    });
  });
});

describe('validateSlideName', () => {
  it('accepts longer slide names than folder names', () => {
    expect(validateSlideName('x'.repeat(80))).toBe('x'.repeat(80));
    expect(validateSlideName('x'.repeat(81))).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validateSlideName('')).toBeNull();
    expect(validateSlideName('   ')).toBeNull();
  });
});

describe('updateMetaTitleInSource', () => {
  it('replaces an existing single-quoted title literal', () => {
    const source = `export const meta: SlideMeta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
    expect(out).not.toContain("'old'");
  });

  it('replaces an existing double-quoted title literal', () => {
    const source = `export const meta = { title: "old" };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
  });

  it('escapes single quotes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, "it's new");
    expect(out).toContain("title: 'it\\'s new'");
  });

  it('escapes backslashes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'a\\b');
    expect(out).toContain("title: 'a\\\\b'");
  });

  it('injects a title into a meta object that lacks one', () => {
    const source = `export const meta = {\n  notes: 'x',\n};\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'first');
    expect(out).toMatch(/title:\s*'first'/);
    expect(out).toContain("notes: 'x'");
  });

  it('injects a fresh meta export when none exists', () => {
    const source = `export default [];\n`;
    const out = updateMetaTitleInSource(source, 'fresh');
    expect(out).toContain("export const meta: SlideMeta = { title: 'fresh' };");
    expect(out).toContain('export default []');
  });

  it('returns null if there is no meta and no default export', () => {
    expect(updateMetaTitleInSource('// nothing here', 'x')).toBeNull();
  });
});

describe('reorderDefaultExportPagesInSource', () => {
  const withSatisfies = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export const meta = { title: 't' };
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const withoutSatisfies = `const A = () => null;
const B = () => null;
const C = () => null;
export default [A, B, C];
`;

  it('reorders a 3-element multi-line array', () => {
    const out = reorderDefaultExportPagesInSource(withSatisfies, [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  C,\n  A,\n  B,\n] satisfies Page[];');
    // surrounding source untouched
    expect(out).toContain("import type { Page } from '@open-slide/core';");
    expect(out).toContain("export const meta = { title: 't' };");
  });

  it('reorders an inline array without satisfies', () => {
    const out = reorderDefaultExportPagesInSource(withoutSatisfies, [1, 2, 0]);
    expect(out).toContain('export default [B, C, A];');
  });

  it('is a no-op for the identity permutation (returns input unchanged)', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 2])).toBe(withSatisfies);
  });

  it('returns null on length mismatch', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1])).toBeNull();
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 2, 3])).toBeNull();
  });

  it('returns null on duplicate indices', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 0, 2])).toBeNull();
  });

  it('returns null on out-of-range indices', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 5])).toBeNull();
    expect(reorderDefaultExportPagesInSource(withSatisfies, [-1, 1, 2])).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    const source = `const A = () => null;\nexport default A;\n`;
    expect(reorderDefaultExportPagesInSource(source, [0])).toBeNull();
  });

  it('returns null when there is no default export', () => {
    expect(reorderDefaultExportPagesInSource('// nothing\n', [])).toBeNull();
  });

  it('returns the input unchanged for an empty array (zero-length identity)', () => {
    const empty = `export default [];\n`;
    expect(reorderDefaultExportPagesInSource(empty, [])).toBe(empty);
  });

  it('preserves the rest of the file (component bodies, imports, meta)', () => {
    const out = reorderDefaultExportPagesInSource(withSatisfies, [2, 1, 0]);
    expect(out).not.toBeNull();
    expect(out).toContain('const A = () => null;');
    expect(out).toContain('const B = () => null;');
    expect(out).toContain('const C = () => null;');
  });
});

describe('reorderNotesArrayInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [];\n`;
    expect(reorderNotesArrayInSource(source, [])).toBe(source);
  });

  it('reorders notes alongside pages', () => {
    const source = [
      'export const notes: (string | undefined)[] = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = reorderNotesArrayInSource(source, [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes: (string | undefined)[] = [\n  "third",\n  "first",\n  "second",\n];',
    );
  });

  it('preserves template-literal notes verbatim', () => {
    const source = [
      'export const notes = [',
      '  `multi',
      'line`,',
      '  "second",',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = reorderNotesArrayInSource(source, [1, 0]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  "second",\n  `multi\nline`,\n];');
  });

  it('pads with undefined when notes is shorter than pages', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    const out = reorderNotesArrayInSource(source, [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  undefined,\n  "only",\n];');
  });

  it('trims trailing undefined entries', () => {
    const source = [
      'export const notes = [',
      '  undefined,',
      '  "kept",',
      '  undefined,',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = reorderNotesArrayInSource(source, [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  undefined,\n  undefined,\n  "kept",\n];');
  });

  it('collapses to [] when reorder leaves only undefineds', () => {
    const source = ['export const notes = [', '  "x",', '];', 'export default [A, B];', ''].join(
      '\n',
    );
    const out = reorderNotesArrayInSource(source, [1, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [];');
  });

  it('returns the source unchanged for an identity-like reorder of an empty notes array', () => {
    const source = `export const notes = [];\nexport default [A, B];\n`;
    expect(reorderNotesArrayInSource(source, [0, 1])).toBe(source);
  });

  it('returns null on out-of-range indices', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(reorderNotesArrayInSource(source, [-1, 0])).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(reorderNotesArrayInSource(source, [0])).toBeNull();
  });
});

describe('removePageFromDefaultExportInSource', () => {
  const multiline = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const inline = `const A = () => null;
const B = () => null;
const C = () => null;
export default [A, B, C];
`;

  it('removes the first element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 0);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  B,\n  C,\n] satisfies Page[];');
  });

  it('removes a middle element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  C,\n] satisfies Page[];');
  });

  it('removes the last element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 2);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  B,\n] satisfies Page[];');
  });

  it('handles inline arrays', () => {
    expect(removePageFromDefaultExportInSource(inline, 1)).toContain('export default [A, C];');
  });

  it('collapses to an empty array when removing the only element', () => {
    const single = `const A = () => null;\nexport default [A];\n`;
    const out = removePageFromDefaultExportInSource(single, 0);
    expect(out).toContain('export default [];');
  });

  it('returns null on out-of-range indices', () => {
    expect(removePageFromDefaultExportInSource(multiline, -1)).toBeNull();
    expect(removePageFromDefaultExportInSource(multiline, 3)).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    expect(removePageFromDefaultExportInSource(`export default A;\n`, 0)).toBeNull();
  });
});

describe('duplicatePageInDefaultExportInSource', () => {
  const multiline = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const inline = `const A = () => null;\nconst B = () => null;\nexport default [A, B];\n`;

  it('duplicates a middle element after itself', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  B,\n  B,\n  C,\n] satisfies Page[];');
  });

  it('duplicates the first element', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 0);
    expect(out).toContain('export default [\n  A,\n  A,\n  B,\n  C,\n] satisfies Page[];');
  });

  it('duplicates the last element', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 2);
    expect(out).toContain('export default [\n  A,\n  B,\n  C,\n  C,\n] satisfies Page[];');
  });

  it('handles inline arrays', () => {
    expect(duplicatePageInDefaultExportInSource(inline, 0)).toContain('export default [A, A, B];');
  });

  it('duplicates the only element in a single-element array', () => {
    const single = `const A = () => null;\nexport default [A];\n`;
    const out = duplicatePageInDefaultExportInSource(single, 0);
    expect(out).toContain('export default [A, A];');
  });

  it('returns null on out-of-range indices', () => {
    expect(duplicatePageInDefaultExportInSource(multiline, -1)).toBeNull();
    expect(duplicatePageInDefaultExportInSource(multiline, 3)).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    expect(duplicatePageInDefaultExportInSource(`export default A;\n`, 0)).toBeNull();
  });
});

describe('removeNotesElementInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [A, B];\n`;
    expect(removeNotesElementInSource(source, 0)).toBe(source);
  });

  it('removes the note aligned with the deleted page', () => {
    const source = [
      'export const notes = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = removeNotesElementInSource(source, 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  "first",\n  "third",\n];');
  });

  it('leaves notes untouched when the deleted page is past the recorded notes', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    expect(removeNotesElementInSource(source, 2)).toBe(source);
  });

  it('collapses to [] when the last remaining note is removed', () => {
    const source = ['export const notes = ["x"];', 'export default [A, B];', ''].join('\n');
    const out = removeNotesElementInSource(source, 0);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [];');
  });

  it('returns null on a negative index', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(removeNotesElementInSource(source, -1)).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(removeNotesElementInSource(source, 0)).toBeNull();
  });
});

describe('duplicateNotesElementInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [A, B];\n`;
    expect(duplicateNotesElementInSource(source, 0)).toBe(source);
  });

  it('inserts a copy of the duplicated page note right after it', () => {
    const source = [
      'export const notes = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = duplicateNotesElementInSource(source, 1);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes = [\n  "first",\n  "second",\n  "second",\n  "third",\n];',
    );
  });

  it('preserves template-literal notes verbatim when duplicating', () => {
    const source = [
      'export const notes = [',
      '  `multi',
      'line`,',
      '  "second",',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = duplicateNotesElementInSource(source, 0);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes = [\n  `multi\nline`,\n  `multi\nline`,\n  "second",\n];',
    );
  });

  it('leaves notes untouched when the duplicated page is past the recorded notes', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    expect(duplicateNotesElementInSource(source, 2)).toBe(source);
  });

  it('returns null on a negative index', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(duplicateNotesElementInSource(source, -1)).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(duplicateNotesElementInSource(source, 0)).toBeNull();
  });
});

describe('addPageToDefaultExportInSource', () => {
  const deck = [
    "import type { Page } from '@open-slide/core';",
    '',
    'const One: Page = () => <div>one</div>;',
    '',
    'const Two: Page = () => <div>two</div>; // second',
    '',
    'export default [One, Two] satisfies Page[];',
    '',
  ].join('\n');

  function added(source: string, afterIndex: number) {
    const result = addPageToDefaultExportInSource(source, afterIndex);
    if (!result.ok) throw new Error(result.error);
    return result;
  }

  it('appends a blank page after the last page declaration', () => {
    const result = added(deck, 1);
    expect(result.index).toBe(2);
    expect(result.name).toBe('Page3');
    expect(result.source).toBe(
      [
        "import type { Page } from '@open-slide/core';",
        '',
        'const One: Page = () => <div>one</div>;',
        '',
        'const Two: Page = () => <div>two</div>; // second',
        '',
        "const Page3: Page = () => <div style={{ width: '100%', height: '100%' }} />;",
        '',
        'export default [One, Two, Page3] satisfies Page[];',
        '',
      ].join('\n'),
    );
  });

  it('inserts in the middle next to the previous page declaration', () => {
    const result = added(deck, 0);
    expect(result.index).toBe(1);
    expect(result.name).toBe('Page2');
    expect(result.source).toContain(
      "const One: Page = () => <div>one</div>;\n\nconst Page2: Page = () => <div style={{ width: '100%', height: '100%' }} />;\n\nconst Two",
    );
    expect(result.source).toContain('export default [One, Page2, Two] satisfies Page[];');
  });

  it('inserts at the front before the first page declaration', () => {
    const result = added(deck, -1);
    expect(result.index).toBe(0);
    expect(result.source).toContain(
      "const Page1: Page = () => <div style={{ width: '100%', height: '100%' }} />;\n\nconst One",
    );
    expect(result.source).toContain('export default [Page1, One, Two] satisfies Page[];');
  });

  it('follows a numbered naming pattern, zero padding included', () => {
    const numbered = [
      'const Slide01 = () => <div />;',
      'const Slide02 = () => <div />;',
      'export default [Slide01, Slide02];',
    ].join('\n');
    const result = added(numbered, 0);
    expect(result.name).toBe('Slide03');
    expect(result.source).toContain('export default [Slide01, Slide03, Slide02];');
    expect(result.source).toContain(
      "const Slide03 = () => <div style={{ width: '100%', height: '100%' }} />;",
    );
  });

  it('skips names already used anywhere in the file', () => {
    const colliding = [
      "import type { Page } from '@open-slide/core';",
      "import { Page3 } from './parts';",
      'const Page4 = 1;',
      'const One: Page = () => <Page3 n={Page4} />;',
      'const Two: Page = () => <div />;',
      'export default [One, Two];',
    ].join('\n');
    expect(added(colliding, 1).name).toBe('Page5');
  });

  it('keeps a multiline array layout and trailing comma', () => {
    const multiline = [
      'const A = () => <div />;',
      'const B = () => <div />;',
      'export default [',
      '  A,',
      '  B,',
      '];',
    ].join('\n');
    expect(added(multiline, 1).source).toContain('export default [\n  A,\n  B,\n  Page3,\n];');
    expect(added(multiline, 0).source).toContain('export default [\n  A,\n  Page2,\n  B,\n];');
  });

  it('never copies comments from existing gaps into the new separator', () => {
    const commented = [
      'const A = () => <div />;',
      'const B = () => <div />;',
      "export const notes = ['a', // A",
      "  'b', // B",
      '];',
      'export default [',
      '  A,',
      '  // Part two',
      '  B,',
      '];',
    ].join('\n');
    const end = added(commented, 1).source;
    expect(end).toContain('export default [\n  A,\n  // Part two\n  B,\n  Page3,\n];');
    const front = added(commented, -1).source;
    expect(front).toContain('export default [\n  Page1,\n  A,\n  // Part two\n  B,\n];');
    expect(front).toContain("export const notes = [undefined,\n  'a', // A\n  'b', // B\n];");
  });

  it('adds the first page to an empty deck', () => {
    const empty =
      "import type { Page } from '@open-slide/core';\n\nexport default [] satisfies Page[];\n";
    const result = added(empty, -1);
    expect(result.source).toBe(
      "import type { Page } from '@open-slide/core';\n\nconst Page1: Page = () => <div style={{ width: '100%', height: '100%' }} />;\n\nexport default [Page1] satisfies Page[];\n",
    );
  });

  it('keeps the notes array aligned by inserting an empty slot', () => {
    const withNotes = [
      'const A = () => <div />;',
      'const B = () => <div />;',
      "export const notes: (string | undefined)[] = ['a', 'b'];",
      'export default [A, B];',
    ].join('\n');
    const result = added(withNotes, 0);
    expect(result.source).toContain(
      "export const notes: (string | undefined)[] = ['a', undefined, 'b'];",
    );
    expect(result.source).toContain('export default [A, Page2, B];');
  });

  it('leaves notes untouched when they end before the insertion point', () => {
    const withNotes = [
      'const A = () => <div />;',
      'const B = () => <div />;',
      "export const notes = ['a'];",
      'export default [A, B];',
    ].join('\n');
    expect(added(withNotes, 0).source).toContain("export const notes = ['a'];");
    expect(added(withNotes, -1).source).toContain("export const notes = [undefined, 'a'];");
  });

  it('declares before export default when pages are inline', () => {
    const inline = 'export default [() => <div />];\n';
    expect(added(inline, 0).source).toBe(
      "const Page2 = () => <div style={{ width: '100%', height: '100%' }} />;\n\nexport default [() => <div />, Page2];\n",
    );
  });

  it('preserves CRLF line endings', () => {
    const crlf = 'const A = () => <div />;\r\nexport default [A];\r\n';
    expect(added(crlf, 0).source).toBe(
      "const A = () => <div />;\r\n\r\nconst Page2 = () => <div style={{ width: '100%', height: '100%' }} />;\r\nexport default [A, Page2];\r\n",
    );
  });

  it('refuses when the default export is not an array literal', () => {
    const result = addPageToDefaultExportInSource('const pages = [];\nexport default pages;\n', -1);
    expect(result).toMatchObject({ ok: false, status: 422 });
  });

  it('refuses spreads, out-of-range indexes, and non-array notes', () => {
    expect(addPageToDefaultExportInSource('export default [...more];', 0).ok).toBe(false);
    expect(addPageToDefaultExportInSource(deck, 2).ok).toBe(false);
    expect(addPageToDefaultExportInSource(deck, -2).ok).toBe(false);
    expect(addPageToDefaultExportInSource(deck, 0.5).ok).toBe(false);
    const badNotes =
      'const A = () => <div />;\nexport const notes = makeNotes();\nexport default [A];';
    expect(addPageToDefaultExportInSource(badNotes, 0).ok).toBe(false);
  });

  it('refuses a source that does not parse', () => {
    expect(addPageToDefaultExportInSource('export default [A,,', 0).ok).toBe(false);
  });

  it('keeps a same-line trailing comment with the statement it follows', () => {
    const source = [
      "import type { Page } from '@open-slide/core';",
      '',
      'const A: Page = () => <div />; // cover',
      '// second',
      'const B: Page = () => <div />;',
      '',
      'export default [B, A];',
      '',
    ].join('\n');
    expect(added(source, -1).source).toContain(
      [
        'const A: Page = () => <div />; // cover',
        "const Page1: Page = () => <div style={{ width: '100%', height: '100%' }} />;",
        '',
        '// second',
        'const B: Page = () => <div />;',
      ].join('\n'),
    );
  });

  it('annotates with Page only when it is imported from @open-slide/core', () => {
    const source = [
      "import { Page } from './layout';",
      '',
      'const A = () => <Page />;',
      '',
      'export default [A];',
      '',
    ].join('\n');
    expect(added(source, 0).source).toContain(
      "const Page2 = () => <div style={{ width: '100%', height: '100%' }} />;",
    );
  });
});
