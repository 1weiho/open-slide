import type { Rect, Run, RunStyle, TextLine } from './scene';

export type Atom = {
  text: string;
  rect: Rect;
  styleKey: string;
  style: RunStyle;
  preserveSpaces: boolean;
};

export type AtomLine = {
  atoms: Atom[];
  top: number;
  bottom: number;
  left: number;
  right: number;
  sizePx: number;
};

const VERTICAL_TOLERANCE = 1;
const HORIZONTAL_TOLERANCE = 1;

export function groupAtomsIntoLines(atoms: Atom[]): AtomLine[] {
  const lines: AtomLine[] = [];
  let current: Atom[] = [];
  let prev: Atom | null = null;
  for (const atom of atoms) {
    if (prev) {
      const movedBack = atom.rect.x < prev.rect.x + prev.rect.w - HORIZONTAL_TOLERANCE;
      const below = atom.rect.y >= prev.rect.y + prev.rect.h - VERTICAL_TOLERANCE;
      if (movedBack || below) {
        pushLine(lines, current);
        current = [];
      }
    }
    current.push(atom);
    prev = atom;
  }
  pushLine(lines, current);
  return lines;
}

function pushLine(lines: AtomLine[], atoms: Atom[]): void {
  if (atoms.length === 0) return;
  const top = Math.min(...atoms.map((a) => a.rect.y));
  const bottom = Math.max(...atoms.map((a) => a.rect.y + a.rect.h));
  const left = Math.min(...atoms.map((a) => a.rect.x));
  const right = Math.max(...atoms.map((a) => a.rect.x + a.rect.w));
  const sizePx = Math.max(...atoms.map((a) => a.style.sizePx));
  lines.push({ atoms, top, bottom, left, right, sizePx });
}

/**
 * Lines that carry no glyphs (blank `<br>` rows, empty lines in `pre` text) never
 * produce atoms, so a jump of k pitches between neighbours means k-1 empty lines.
 */
export function fillEmptyLines(lines: AtomLine[]): AtomLine[] {
  if (lines.length < 2) return lines;
  const pitches: number[] = [];
  for (let i = 1; i < lines.length; i++) pitches.push(lines[i].bottom - lines[i - 1].bottom);
  const base = Math.min(...pitches.filter((p) => p > 0.5));
  if (!Number.isFinite(base)) return lines;
  const out: AtomLine[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const pitch = pitches[i - 1];
    const k = Math.round(pitch / base);
    if (k >= 2 && Math.abs(pitch - k * base) < base * 0.15) {
      const prev = lines[i - 1];
      for (let j = 1; j < k; j++) {
        out.push({
          atoms: [],
          top: prev.top + (base * j * (lines[i].top - prev.top)) / pitch,
          bottom: prev.bottom + base * j,
          left: prev.left,
          right: prev.left,
          sizePx: prev.sizePx,
        });
      }
    }
    out.push(lines[i]);
  }
  return out;
}

export function lineToRuns(line: AtomLine): TextLine {
  const runs: Run[] = [];
  const keys: string[] = [];
  for (const atom of line.atoms) {
    let text = atom.text;
    if (!atom.preserveSpaces) {
      text = text.replace(/[\t\n\r ]+/g, ' ');
      const prevText = runs[runs.length - 1]?.text ?? '';
      if (text.startsWith(' ') && (prevText === '' || prevText.endsWith(' '))) text = text.slice(1);
    }
    if (text.length === 0) continue;
    const last = runs[runs.length - 1];
    if (last && keys[keys.length - 1] === atom.styleKey) last.text += text;
    else {
      runs.push({ text, style: atom.style });
      keys.push(atom.styleKey);
    }
  }
  const tail = runs[runs.length - 1];
  if (tail && !line.atoms[line.atoms.length - 1]?.preserveSpaces) {
    tail.text = tail.text.replace(/ +$/, '');
    if (tail.text.length === 0) runs.pop();
  }
  return { runs, sizePx: line.sizePx };
}
