import { describe, expect, it } from 'vitest';
import type { RunStyle } from './scene';
import { type Atom, fillEmptyLines, groupAtomsIntoLines, lineToRuns } from './text-lines';

const style = (over: Partial<RunStyle> = {}): RunStyle => ({
  font: 'Arial',
  sizePx: 40,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  color: { r: 0, g: 0, b: 0, a: 1 },
  letterSpacingPx: 0,
  baselineShift: null,
  shadow: null,
  outline: null,
  ...over,
});

const atom = (
  text: string,
  x: number,
  y: number,
  w = 10,
  h = 44,
  key = 'a',
  over: Partial<Atom> = {},
): Atom => ({
  text,
  rect: { x, y, w, h },
  styleKey: key,
  style: style(),
  preserveSpaces: false,
  ...over,
});

describe('groupAtomsIntoLines', () => {
  it('starts a new line when x moves back or y moves fully below', () => {
    const lines = groupAtomsIntoLines([
      atom('H', 0, 10),
      atom('i', 10, 10),
      atom('t', 0, 74),
      atom('x', 300, 74),
      atom('y', 320, 140),
    ]);
    expect(lines.map((l) => l.atoms.map((a) => a.text).join(''))).toEqual(['Hi', 'tx', 'y']);
    expect(lines[0]).toMatchObject({ top: 10, bottom: 54, left: 0, right: 20 });
  });
  it('keeps superscripts on the same line', () => {
    const lines = groupAtomsIntoLines([atom('x', 0, 10), atom('2', 10, 0, 6, 26)]);
    expect(lines).toHaveLength(1);
  });
});

describe('fillEmptyLines', () => {
  it('inserts blank lines for multi-pitch gaps', () => {
    const lines = fillEmptyLines(
      groupAtomsIntoLines([atom('a', 0, 0), atom('b', 0, 60), atom('c', 0, 180)]),
    );
    expect(lines).toHaveLength(4);
    expect(lines[2].atoms).toHaveLength(0);
    expect(lines[2].bottom).toBeCloseTo(164);
  });
});

describe('lineToRuns', () => {
  it('merges same-style atoms, collapses whitespace and trims line edges', () => {
    const [line] = groupAtomsIntoLines([
      atom(' Hello ', 0, 0, 100),
      atom(' big', 100, 0, 50, 44, 'b'),
      atom(' world  ', 150, 0, 80, 44, 'b'),
    ]);
    const { runs } = lineToRuns(line);
    expect(runs.map((r) => r.text)).toEqual(['Hello ', 'big world']);
  });
  it('keeps indentation for preformatted text', () => {
    const [line] = groupAtomsIntoLines([
      atom('    const x', 0, 0, 100, 44, 'a', { preserveSpaces: true }),
    ]);
    expect(lineToRuns(line).runs[0].text).toBe('    const x');
  });
});
