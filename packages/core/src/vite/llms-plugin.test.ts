import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LLMS_TXT_SENTINEL, type LlmsDeck, renderLlmsTxt, writeLlmsTxt } from './llms-plugin.ts';

function deck(overrides: Partial<LlmsDeck> & { id: string }): LlmsDeck {
  return {
    sourcePath: `slides/${overrides.id}/index.tsx`,
    title: null,
    summary: null,
    theme: null,
    createdAt: null,
    folderId: null,
    ...overrides,
  };
}

const SAMPLE: LlmsDeck[] = [
  deck({
    id: 'coffee-brewing',
    title: 'Coffee Brewing',
    summary: 'Ratios, grind size, and why water temperature matters.',
    theme: 'aurora',
    createdAt: '2026-03-04T09:00:00Z',
  }),
  deck({
    id: 'ssh-explained',
    title: 'SSH Explained',
    createdAt: '2026-02-11T09:00:00Z',
  }),
  deck({
    id: 'tidal-power',
    title: 'Tidal Power',
    summary: 'Where the energy comes from.',
    theme: 'slate',
  }),
  deck({ id: 'zoning-basics' }),
];

describe('renderLlmsTxt / format', () => {
  it('renders the header, count, and one line per deck', () => {
    const out = renderLlmsTxt(SAMPLE, { projectName: 'my-slide', linkBase: 'source' });
    expect(out).toBe(
      [
        '# my-slide — decks',
        '',
        `> 4 decks built with open-slide. ${LLMS_TXT_SENTINEL}`,
        '',
        '## Decks',
        '',
        '- [Coffee Brewing](slides/coffee-brewing/index.tsx): aurora · 2026-03-04 — Ratios, grind size, and why water temperature matters.',
        '- [SSH Explained](slides/ssh-explained/index.tsx): 2026-02-11',
        '- [Tidal Power](slides/tidal-power/index.tsx): slate — Where the energy comes from.',
        '- [zoning-basics](slides/zoning-basics/index.tsx)',
        '',
      ].join('\n'),
    );
  });

  it('falls back to the deck id when title is absent', () => {
    const out = renderLlmsTxt([deck({ id: 'zoning-basics' })], {
      projectName: 'p',
      linkBase: 'source',
    });
    expect(out).toContain('- [zoning-basics](slides/zoning-basics/index.tsx)');
  });

  it('singularises the count for one deck', () => {
    const out = renderLlmsTxt([deck({ id: 'solo' })], { projectName: 'p', linkBase: 'source' });
    expect(out).toContain('> 1 deck built with open-slide.');
  });

  it('emits no deck section when there are no decks', () => {
    const out = renderLlmsTxt([], { projectName: 'p', linkBase: 'source' });
    expect(out).toContain('> 0 decks built with open-slide.');
    expect(out).not.toContain('## Decks');
  });

  it('groups decks under folder headings and leaves the rest in Decks', () => {
    const decks = [
      deck({ id: 'alpha', createdAt: '2026-05-01T00:00:00Z', folderId: 'f-1' }),
      deck({ id: 'beta', createdAt: '2026-04-01T00:00:00Z' }),
      deck({ id: 'gamma', createdAt: '2026-03-01T00:00:00Z', folderId: 'f-unknown' }),
    ];
    const out = renderLlmsTxt(decks, {
      projectName: 'p',
      linkBase: 'source',
      folders: [
        { id: 'f-1', name: 'motion' },
        { id: 'f-2', name: 'empty folder' },
      ],
    });
    expect(out).toContain('## motion');
    expect(out).not.toContain('## empty folder');
    expect(out.indexOf('## motion')).toBeLessThan(out.indexOf('## Decks'));
    const decksSection = out.slice(out.indexOf('## Decks'));
    expect(decksSection).toContain('- [beta]');
    expect(decksSection).toContain('- [gamma]');
  });
});

describe('renderLlmsTxt / ordering', () => {
  it('sorts newest first and pushes undated decks to the end by id', () => {
    const decks = [
      deck({ id: 'undated-b' }),
      deck({ id: 'older', createdAt: '2026-01-01T00:00:00Z' }),
      deck({ id: 'undated-a' }),
      deck({ id: 'newer', createdAt: '2026-06-01T00:00:00Z' }),
    ];
    const out = renderLlmsTxt(decks, { projectName: 'p', linkBase: 'source' });
    const ids = out
      .split('\n')
      .filter((l) => l.startsWith('- ['))
      .map((l) => l.slice(3, l.indexOf(']')));
    expect(ids).toEqual(['newer', 'older', 'undated-a', 'undated-b']);
  });

  it('treats an unparseable createdAt as undated and omits it from the line', () => {
    const decks = [
      deck({ id: 'bad-date', createdAt: 'last thursday' }),
      deck({ id: 'good-date', createdAt: '2026-01-01T00:00:00Z' }),
    ];
    const out = renderLlmsTxt(decks, { projectName: 'p', linkBase: 'source' });
    const lines = out.split('\n').filter((l) => l.startsWith('- ['));
    expect(lines[0]).toContain('good-date');
    expect(lines[1]).toBe('- [bad-date](slides/bad-date/index.tsx)');
    expect(out).not.toContain('last thursday');
  });
});

describe('renderLlmsTxt / linkBase', () => {
  it('links to the source file for the workspace copy', () => {
    const out = renderLlmsTxt([deck({ id: 'coffee-brewing' })], {
      projectName: 'p',
      linkBase: 'source',
    });
    expect(out).toContain('](slides/coffee-brewing/index.tsx)');
  });

  it('links to the deployed route for the build copy', () => {
    const out = renderLlmsTxt([deck({ id: 'coffee-brewing' })], {
      projectName: 'p',
      linkBase: 'site',
    });
    expect(out).toContain('](/s/coffee-brewing)');
    expect(out).not.toContain('index.tsx');
  });

  it('puts site links under a configured base', () => {
    const out = renderLlmsTxt([deck({ id: 'coffee-brewing' })], {
      projectName: 'p',
      linkBase: 'site',
      base: '/my-slides/',
    });
    expect(out).toContain('](/my-slides/s/coffee-brewing)');
  });

  it('tolerates a base without its trailing slash', () => {
    const out = renderLlmsTxt([deck({ id: 'coffee-brewing' })], {
      projectName: 'p',
      linkBase: 'site',
      base: '/my-slides',
    });
    expect(out).toContain('](/my-slides/s/coffee-brewing)');
  });

  it('leaves source links untouched by base', () => {
    const out = renderLlmsTxt([deck({ id: 'coffee-brewing' })], {
      projectName: 'p',
      linkBase: 'source',
      base: '/my-slides/',
    });
    expect(out).toContain('](slides/coffee-brewing/index.tsx)');
  });

  it('keeps a non-default slidesDir in the source link', () => {
    const out = renderLlmsTxt(
      [deck({ id: 'coffee-brewing', sourcePath: 'decks/coffee-brewing/index.jsx' })],
      { projectName: 'p', linkBase: 'source' },
    );
    expect(out).toContain('](decks/coffee-brewing/index.jsx)');
  });
});

describe('renderLlmsTxt / sanitisation', () => {
  it('flattens newlines and collapses runs of whitespace', () => {
    const out = renderLlmsTxt(
      [deck({ id: 'a', title: 'Line one\nLine two', summary: 'has\n\nbreaks\tand   spaces' })],
      { projectName: 'p', linkBase: 'source' },
    );
    const lines = out.split('\n').filter((l) => l.startsWith('- ['));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('- [Line one Line two](slides/a/index.tsx) — has breaks and spaces');
  });

  it('truncates long fields to 300 characters', () => {
    const long = 'x'.repeat(500);
    const out = renderLlmsTxt([deck({ id: 'a', title: long, summary: long })], {
      projectName: 'p',
      linkBase: 'source',
    });
    const line = out.split('\n').find((l) => l.startsWith('- ['));
    expect(line).toBe(`- [${'x'.repeat(300)}](slides/a/index.tsx) — ${'x'.repeat(300)}`);
  });

  it('drops a field that sanitises to nothing', () => {
    const out = renderLlmsTxt([deck({ id: 'a', title: '   ', summary: '\n\n' })], {
      projectName: 'p',
      linkBase: 'source',
    });
    const line = out.split('\n').find((l) => l.startsWith('- ['));
    expect(line).toBe('- [a](slides/a/index.tsx)');
  });
});

describe('renderLlmsTxt / injection resistance', () => {
  const hostile = [
    deck({
      id: 'hostile',
      title: 'Evil](/pwned) ## Fake heading',
      summary: 'line one\n## Injected\n- [fake](../../etc/passwd)',
      theme: 'bad`theme\nname',
      createdAt: '2026-01-01T00:00:00Z',
    }),
    deck({ id: 'neighbour', title: 'Neighbour', createdAt: '2026-01-02T00:00:00Z' }),
  ];

  it('keeps one deck to exactly one line', () => {
    const out = renderLlmsTxt(hostile, { projectName: 'p', linkBase: 'source' });
    expect(out.split('\n').filter((l) => l.startsWith('- ['))).toHaveLength(2);
  });

  it('never lets a field open a new heading', () => {
    const out = renderLlmsTxt(hostile, { projectName: 'p', linkBase: 'source' });
    const headings = out.split('\n').filter((l) => l.startsWith('#'));
    expect(headings).toEqual(['# p — decks', '## Decks']);
  });

  it('escapes link delimiters so the real target survives', () => {
    const out = renderLlmsTxt(hostile, { projectName: 'p', linkBase: 'source' });
    const line = out.split('\n').find((l) => l.includes('Evil'));
    expect(line).toBe(
      '- [Evil\\](/pwned) ## Fake heading](slides/hostile/index.tsx): bad`theme name · 2026-01-01 — line one ## Injected - \\[fake\\](../../etc/passwd)',
    );
  });

  it('escapes a trailing backslash so it cannot swallow the closing bracket', () => {
    const out = renderLlmsTxt([deck({ id: 'a', title: 'ends with\\' })], {
      projectName: 'p',
      linkBase: 'source',
    });
    expect(out).toContain('- [ends with\\\\](slides/a/index.tsx)');
  });

  it('keeps a truncated field from ending in a half-written escape', () => {
    const out = renderLlmsTxt([deck({ id: 'a', title: `${'y'.repeat(299)}\\tail` })], {
      projectName: 'p',
      linkBase: 'source',
    });
    const line = out.split('\n').find((l) => l.startsWith('- ['));
    expect(line).toBe(`- [${'y'.repeat(299)}\\\\](slides/a/index.tsx)`);
  });

  it('does not let a hostile folder name forge a heading', () => {
    const out = renderLlmsTxt([deck({ id: 'a', folderId: 'f-1' })], {
      projectName: 'p',
      linkBase: 'source',
      folders: [{ id: 'f-1', name: 'evil\n## Forged' }],
    });
    expect(out.split('\n').filter((l) => l.startsWith('#'))).toEqual([
      '# p — decks',
      '## evil ## Forged',
    ]);
  });
});

describe('writeLlmsTxt', () => {
  let dir = '';

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-llms-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const body = `# p — decks\n\n> 0 decks built with open-slide. ${LLMS_TXT_SENTINEL}\n`;

  it('writes when no file exists', async () => {
    const result = await writeLlmsTxt(dir, body);
    expect(result.written).toBe(true);
    expect(await fs.readFile(path.join(dir, 'llms.txt'), 'utf8')).toBe(body);
  });

  it('overwrites a file it previously generated', async () => {
    await fs.writeFile(path.join(dir, 'llms.txt'), `stale\n${LLMS_TXT_SENTINEL}\n`);
    const result = await writeLlmsTxt(dir, body);
    expect(result.written).toBe(true);
    expect(await fs.readFile(path.join(dir, 'llms.txt'), 'utf8')).toBe(body);
  });

  it('refuses to overwrite a hand-written file with no sentinel', async () => {
    const handWritten = '# my notes\n\nnot generated by anything\n';
    const file = path.join(dir, 'llms.txt');
    await fs.writeFile(file, handWritten);
    const result = await writeLlmsTxt(dir, body);
    expect(result.written).toBe(false);
    if (result.written) return;
    expect(result.reason).toBe('foreign-file');
    expect(await fs.readFile(file, 'utf8')).toBe(handWritten);
  });

  it('refuses to write through a symlink', async () => {
    const outside = path.join(dir, 'secret.txt');
    await fs.writeFile(outside, 'do not touch\n');
    await fs.symlink(outside, path.join(dir, 'llms.txt'));
    const result = await writeLlmsTxt(dir, body);
    expect(result.written).toBe(false);
    if (result.written) return;
    expect(result.reason).toBe('irregular-file');
    expect(await fs.readFile(outside, 'utf8')).toBe('do not touch\n');
  });

  it('refuses to write when the target is a directory', async () => {
    await fs.mkdir(path.join(dir, 'llms.txt'));
    const result = await writeLlmsTxt(dir, body);
    expect(result.written).toBe(false);
    if (result.written) return;
    expect(result.reason).toBe('irregular-file');
  });

  it('leaves no temporary files behind', async () => {
    await writeLlmsTxt(dir, body);
    expect(await fs.readdir(dir)).toEqual(['llms.txt']);
  });
});
