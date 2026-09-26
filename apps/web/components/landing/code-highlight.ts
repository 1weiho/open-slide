export function highlight(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const palette = {
    kw: 'var(--color-accent-soft)',
    str: 'var(--color-warm)',
    num: 'var(--color-mint)',
    cmt: 'var(--color-muted)',
    tag: 'var(--color-accent)',
    fn: 'var(--color-text)',
    punct: 'var(--color-dim)',
  };
  const wrap = (cls: keyof typeof palette, t: string) =>
    `<span style="color:${palette[cls]}">${t}</span>`;

  const keywords = new Set([
    'import',
    'from',
    'type',
    'const',
    'return',
    'export',
    'default',
    'satisfies',
  ]);

  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];

    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < src.length && src[j] !== quote) j++;
      tokens.push(wrap('str', escape(src.slice(i, j + 1))));
      i = j + 1;
      continue;
    }

    if (c === '/' && src[i + 1] === '/') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      tokens.push(wrap('cmt', escape(src.slice(i, j))));
      i = j;
      continue;
    }

    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (keywords.has(word)) tokens.push(wrap('kw', escape(word)));
      else if (/^[A-Z]/.test(word)) tokens.push(wrap('tag', escape(word)));
      else tokens.push(wrap('fn', escape(word)));
      i = j;
      continue;
    }

    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push(wrap('num', escape(src.slice(i, j))));
      i = j;
      continue;
    }

    if (/[{}()[\];:,.<>=+\-*/!?|&]/.test(c)) {
      tokens.push(wrap('punct', escape(c)));
      i++;
      continue;
    }

    tokens.push(escape(c));
    i++;
  }

  return tokens.join('');
}
