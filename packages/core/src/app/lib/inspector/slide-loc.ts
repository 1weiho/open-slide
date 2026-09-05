export type SlideLoc = {
  file: string | null;
  line: number;
  column: number;
};

const SOURCE_REL_RE =
  /^(?:[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\/)*[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.tsx$/;

export function formatSlideLoc(loc: SlideLoc): string {
  const { file, line, column } = loc;
  if (!file || file === 'index.tsx') return `${line}:${column}`;
  return `${file}:${line}:${column}`;
}

export function parseSlideLoc(raw: string): SlideLoc | null {
  const parts = raw.split(':');
  if (parts.length < 2) return null;
  const column = Number(parts[parts.length - 1]);
  const line = Number(parts[parts.length - 2]);
  if (!Number.isInteger(line) || !Number.isInteger(column)) return null;
  if (line < 1 || column < 0) return null;

  const filePart = parts.slice(0, -2).join(':').replace(/\\/g, '/');
  if (!filePart || filePart === 'index.tsx') return { file: null, line, column };
  if (!SOURCE_REL_RE.test(filePart)) return null;
  return { file: filePart, line, column };
}

export function slideLocSelector(loc: SlideLoc): string {
  return `[data-slide-loc="${formatSlideLoc(loc)}"]`;
}

export function sameSlideLoc(a: SlideLoc, b: SlideLoc): boolean {
  return a.line === b.line && a.column === b.column && (a.file ?? null) === (b.file ?? null);
}
