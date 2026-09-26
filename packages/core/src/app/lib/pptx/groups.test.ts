import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { planGroups, validateGroups } from './groups';
import type { PptxDeck, PptxGroup, PptxObject, PptxPage } from './model';
import { writePptx } from './write';

const shape = (id: string, order: number): PptxObject => ({
  kind: 'shape',
  id,
  order,
  source: id,
  x: 100 + order * 50,
  y: 100,
  w: 120,
  h: 80,
  geometry: 'rect',
  fill: { color: '336699', opacity: 1 },
});
const group = (id: string, members: string[]): PptxGroup => ({
  id,
  source: id,
  kind: 'explicit',
  members,
});
const page = (groups: PptxGroup[]): PptxPage => ({
  index: 0,
  id: 'p1',
  background: { color: 'FFFFFF', opacity: 1 },
  objects: [shape('a', 0), shape('b', 1), shape('c', 2)],
  groups,
  diagnostics: [],
});
const deck = (page: PptxPage): PptxDeck => ({
  version: 2,
  id: 'test',
  title: 'Groups',
  width: 1920,
  height: 1080,
  pages: [page],
});

describe('native group planning and output', () => {
  it('writes inner groups before parents without changing leaf geometry or paint order', async () => {
    const fixture = page([group('outer', ['inner', 'c']), group('inner', ['a', 'b'])]);
    const planned = planGroups(fixture);
    expect(planned.diagnostics).toEqual([]);
    expect(planned.groups.map((group) => group.id)).toEqual(['inner', 'outer']);
    const blob = await writePptx(deck(fixture));
    const xml = strFromU8(
      unzipSync(new Uint8Array(await blob.arrayBuffer()))['ppt/slides/slide1.xml'],
    );
    expect((xml.match(/<p:grpSp>/g) ?? []).length).toBe(2);
    expect(xml.indexOf('name="outer"')).toBeLessThan(xml.indexOf('name="inner"'));
    expect(['a', 'b', 'c'].map((id) => xml.indexOf(`name="${id}"`))).toEqual(
      [...['a', 'b', 'c'].map((id) => xml.indexOf(`name="${id}"`))].sort((a, b) => a - b),
    );
    const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(xml).toContain('<a:chOff x="635000" y="635000"/>');
    expect(xml).toContain('<a:chExt cx="1397000" cy="508000"/>');
  });

  it('retains complete flat objects when a group interleaves an unrelated object', async () => {
    const fixture = page([group('crossing', ['a', 'c'])]);
    expect(planGroups(fixture).diagnostics.map((entry) => entry.code)).toEqual([
      'group-skipped-paint-order',
    ]);
    const blob = await writePptx(deck(fixture));
    const xml = strFromU8(
      unzipSync(new Uint8Array(await blob.arrayBuffer()))['ppt/slides/slide1.xml'],
    );
    expect(xml).not.toContain('<p:grpSp>');
    expect((xml.match(/<p:sp>/g) ?? []).length).toBe(3);
  });

  it.each([
    [group('same', ['a']), group('same', ['b'])],
    [group('g', ['a', 'a'])],
    [group('g', ['missing'])],
    [group('g', ['h']), group('h', ['g'])],
  ])('rejects malformed group trees before writing', async (...groups) => {
    const fixture = page(groups as PptxGroup[]);
    expect(validateGroups(fixture).some((entry) => entry.severity === 'error')).toBe(true);
    await expect(writePptx(deck(fixture))).rejects.toThrow();
  });

  it('maps writer-generated radial bands into one group without losing native leaves', async () => {
    const fixture = page([group('radial', ['a', 'b'])]);
    fixture.objects[0] = {
      ...shape('a', 0),
      kind: 'shape',
      geometry: 'rect',
      gradient: {
        kind: 'radial',
        stops: [
          { offset: 0, color: { color: 'FF0000', opacity: 1 } },
          { offset: 1, color: { color: '0000FF', opacity: 0 } },
        ],
      },
    };
    const blob = await writePptx(deck(fixture));
    const xml = strFromU8(
      unzipSync(new Uint8Array(await blob.arrayBuffer()))['ppt/slides/slide1.xml'],
    );
    expect(xml).toContain('<p:grpSp>');
    expect(xml).toContain('a-radial-');
    expect(xml).toContain('name="c"');
    expect(xml).not.toContain('<p:pic>');
  });
});
