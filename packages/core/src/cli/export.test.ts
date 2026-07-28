/**
 * @agents-index Unit tests for `open-slide export` — covers the pure, Node-side
 * pieces (flag parsing, filename padding, slide/page resolution, atomic writes,
 * and the missing-Playwright preflight branch). The real headless render is
 * exercised end-to-end by hand; Vitest cannot launch Chromium.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createServerMock } = vi.hoisted(() => ({
  createServerMock: vi.fn(async () => {
    throw new Error('createServer must not be called in unit tests');
  }),
}));

vi.mock('vite', async () => {
  const actual = await vi.importActual<typeof import('vite')>('vite');
  return {
    ...actual,
    createServer: createServerMock,
  };
});

import {
  atomicWriteFile,
  type ExportFlags,
  ExportUsageError,
  exportCommand,
  pngFilenameFor,
  resolveExportTargets,
  zeroPageDeckIds,
} from './export.ts';

describe('pngFilenameFor', () => {
  it('uses page-count-width zero padding', () => {
    expect(pngFilenameFor('slide', 0, 9)).toBe('slide-p1.png');
    expect(pngFilenameFor('slide', 8, 9)).toBe('slide-p9.png');
    expect(pngFilenameFor('slide', 0, 100)).toBe('slide-p001.png');
    expect(pngFilenameFor('slide', 9, 100)).toBe('slide-p010.png');
    expect(pngFilenameFor('slide', 99, 100)).toBe('slide-p100.png');
  });
});

describe('resolveExportTargets', () => {
  const slides = [
    { id: 'intro', pages: 5 },
    { id: 'outro', pages: 3 },
  ];

  it('picks one page for --slide + --page (1-based input → 0-based index)', () => {
    const targets = resolveExportTargets({ slide: 'intro', page: 2 }, slides);
    expect(targets).toEqual([{ slideId: 'intro', pageIndex: 1, total: 5 }]);
  });

  it('expands --all to every page of every deck in declared order', () => {
    const targets = resolveExportTargets({ all: true }, slides);
    expect(targets).toHaveLength(8);
    expect(targets.slice(0, 5).every((t) => t.slideId === 'intro')).toBe(true);
    expect(targets.slice(5).every((t) => t.slideId === 'outro')).toBe(true);
    expect(targets[0]).toEqual({ slideId: 'intro', pageIndex: 0, total: 5 });
    expect(targets[7]).toEqual({ slideId: 'outro', pageIndex: 2, total: 3 });
  });

  it('expands --slide alone to every page of that deck', () => {
    const targets = resolveExportTargets({ slide: 'outro' }, slides);
    expect(targets).toEqual([
      { slideId: 'outro', pageIndex: 0, total: 3 },
      { slideId: 'outro', pageIndex: 1, total: 3 },
      { slideId: 'outro', pageIndex: 2, total: 3 },
    ]);
  });

  it('throws ExportUsageError when --slide names an unknown deck', () => {
    expect(() => resolveExportTargets({ slide: 'nope' }, slides)).toThrow(ExportUsageError);
  });

  it('throws ExportUsageError when --page is out of range', () => {
    expect(() => resolveExportTargets({ slide: 'intro', page: 99 }, slides)).toThrow(
      ExportUsageError,
    );
  });

  it('throws ExportUsageError when neither --slide nor --all is set', () => {
    expect(() => resolveExportTargets({}, slides)).toThrow(ExportUsageError);
  });
});

describe('atomicWriteFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-export-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes to <file>.tmp then renames to the final path', async () => {
    const target = path.join(tmpDir, 'out.png');
    const renameSpy = vi.spyOn(fs, 'rename');
    const writeSpy = vi.spyOn(fs, 'writeFile');
    await atomicWriteFile(target, Buffer.from([1, 2, 3]));
    const writeCall = writeSpy.mock.calls[0];
    expect(writeCall?.[0]).toBe(`${target}.tmp`);
    const renameCall = renameSpy.mock.calls[0];
    expect(renameCall?.[0]).toBe(`${target}.tmp`);
    expect(renameCall?.[1]).toBe(target);
    const written = await fs.readFile(target);
    expect(Array.from(written)).toEqual([1, 2, 3]);
    expect(
      await fs
        .access(`${target}.tmp`)
        .then(() => true)
        .catch(() => false),
    ).toBe(false);
    renameSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it('cleans up <file>.tmp on write failure and never creates the final file', async () => {
    const target = path.join(tmpDir, 'fail.png');
    const writeSpy = vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('disk full'));
    await expect(atomicWriteFile(target, Buffer.from([1]))).rejects.toThrow('disk full');
    expect(
      await fs
        .access(target)
        .then(() => true)
        .catch(() => false),
    ).toBe(false);
    expect(
      await fs
        .access(`${target}.tmp`)
        .then(() => true)
        .catch(() => false),
    ).toBe(false);
    writeSpy.mockRestore();
  });
});

describe('zeroPageDeckIds', () => {
  const slides = [
    { id: 'good', pages: 3 },
    { id: 'unparseable', pages: 0 },
  ];

  it('reports zero-page decks under --all so a parse failure is not silently skipped', () => {
    expect(zeroPageDeckIds({ all: true }, slides)).toEqual(['unparseable']);
  });

  it('reports the named deck when --slide targets a zero-page deck', () => {
    expect(zeroPageDeckIds({ slide: 'unparseable' }, slides)).toEqual(['unparseable']);
  });

  it('stays quiet when every deck in scope has pages', () => {
    expect(zeroPageDeckIds({ slide: 'good' }, slides)).toEqual([]);
    expect(zeroPageDeckIds({ all: true }, [{ id: 'good', pages: 3 }])).toEqual([]);
  });
});

describe('exportCommand flag preflight', () => {
  const stderrChunks: string[] = [];

  beforeEach(() => {
    createServerMock.mockClear();
    stderrChunks.length = 0;
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: unknown) => {
      stderrChunks.push(String(chunk));
      return true;
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stderrText(): string {
    return stderrChunks.join('');
  }

  it('rejects --page without --slide with exit code 2', async () => {
    await expect(exportCommand({ page: 1 } as ExportFlags)).rejects.toThrow('__exit__:2');
    expect(stderrText()).toMatch(/--page requires --slide/);
    expect(createServerMock).not.toHaveBeenCalled();
  });

  it('rejects --slide and --all together with exit code 2', async () => {
    await expect(exportCommand({ slide: 'intro', all: true })).rejects.toThrow('__exit__:2');
    expect(stderrText()).toMatch(/mutually exclusive/);
    expect(createServerMock).not.toHaveBeenCalled();
  });

  it('rejects missing --slide and --all with exit code 2', async () => {
    await expect(exportCommand({})).rejects.toThrow('__exit__:2');
    expect(stderrText()).toMatch(/one of --slide or --all is required/);
    expect(createServerMock).not.toHaveBeenCalled();
  });
});

describe('exportCommand missing-Playwright preflight', () => {
  const stderrChunks: string[] = [];

  beforeEach(() => {
    createServerMock.mockClear();
    stderrChunks.length = 0;
    vi.doMock('playwright-chromium', () => {
      throw new Error('ERR_MODULE_NOT_FOUND');
    });
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: unknown) => {
      stderrChunks.push(String(chunk));
      return true;
    }) as never);
  });

  afterEach(() => {
    vi.doUnmock('playwright-chromium');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('prints a single-paragraph install message and exits 2 without booting Vite', async () => {
    const { exportCommand: freshExport } = await import('./export.ts');
    await expect(freshExport({ all: true })).rejects.toThrow('__exit__:2');
    const out = stderrChunks.join('');
    expect(out).toContain('pnpm add -D playwright-chromium');
    expect(out).toContain('npx playwright install chromium');
    expect(out).not.toMatch(/at .+\(.+:\d+:\d+\)/);
    expect(createServerMock).not.toHaveBeenCalled();
  });
});
