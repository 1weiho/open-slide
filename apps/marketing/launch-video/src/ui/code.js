import { h, set, text } from '../lib/dom.js';
import { C, FONT } from '../theme.js';

const COLORS = {
  kw: '#ff9e7a',
  tag: '#8ec5ff',
  attr: '#d7b4ff',
  str: '#a8dba0',
  num: '#ffcf8a',
  punc: '#7d8590',
  text: '#e8e8e8',
  com: '#5f6670',
};

const RULES = [
  [/^\/\/.*/, 'com'],
  [/^'[^']*'?/, 'str'],
  [/^\b(export|default|function|return|const|import|from)\b/, 'kw'],
  [/^<\/?[A-Za-z][\w.]*/, 'tag'],
  [/^\/?>/, 'tag'],
  [/^\b\d+(\.\d+)?\b/, 'num'],
  [/^[A-Za-z_][\w]*(?=[=:])/, 'attr'],
  [/^[{}()[\],;:=]/, 'punc'],
  [/^\s+/, 'text'],
  [/^[^\s<{}()[\],;:='/]+/, 'text'],
  [/^./, 'text'],
];

export function highlight(line) {
  const out = [];
  let rest = line;
  while (rest.length) {
    for (const [re, kind] of RULES) {
      const m = rest.match(re);
      if (m?.[0].length) {
        out.push(h('span', { text: m[0], style: `color:${COLORS[kind]}` }));
        rest = rest.slice(m[0].length);
        break;
      }
    }
  }
  return out;
}

// lines: [{ text, kind?: 'add' | 'del' }]
export function codeEditor({ file, lines, width = 800, startLine = 1, lineHeight = 32 }) {
  const rows = lines.map((ln, i) => {
    const content = h('span', { class: 'code-text' }, highlight(ln.text));
    const gutter = h('span', {
      text: ln.kind === 'add' ? '+' : ln.kind === 'del' ? '−' : '',
      style: `width:18px;flex:none;color:${ln.kind === 'add' ? '#3fb950' : '#f85149'}`,
    });
    const tint = h('div', {
      style: `position:absolute;inset:0 0 0 0;background:${ln.kind === 'del' ? 'rgb(248 81 73 / 0.16)' : 'rgb(46 160 67 / 0.2)'};transform-origin:0 50%;opacity:0`,
    });
    const el = h(
      'div',
      {
        style: `position:relative;display:flex;align-items:center;height:${lineHeight}px;padding-right:20px;white-space:pre`,
      },
      tint,
      h('span', {
        text: String(startLine + i),
        style: `position:relative;width:52px;flex:none;text-align:right;padding-right:16px;color:#4a4f57`,
      }),
      h('span', { style: 'position:relative;display:flex' }, gutter, content),
    );
    return { el, tint, content, gutter, line: ln };
  });
  const watching = h(
    'div',
    {
      style: `display:flex;align-items:center;gap:8px;font-family:${FONT.sans};font-size:13px;color:#d9d9d9;padding:5px 10px;border-radius:6px;background:rgb(255 255 255 / 0.06);opacity:0`,
    },
    h('span', {
      class: 'pulse',
      style: `width:8px;height:8px;border-radius:50%;background:${C.emerald};box-shadow:0 0 0 0 oklch(0.696 0.17 162.48 / 0.5)`,
    }),
    'Agent is watching',
  );
  const header = h(
    'div',
    {
      style:
        'height:48px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid rgb(255 255 255 / 0.07)',
    },
    ['#ff5f57', '#febc2e', '#28c840'].map((c) =>
      h('div', { style: `width:11px;height:11px;border-radius:50%;background:${c};opacity:0.9` }),
    ),
    h('div', {
      text: file,
      style: `margin-left:10px;font-family:${FONT.mono};font-size:14px;color:#c9c9c9`,
    }),
    h('div', { style: 'flex:1' }),
    watching,
  );
  const body = h(
    'div',
    { style: `padding:14px 0;font-family:${FONT.mono};font-size:18.5px` },
    rows.map((r) => r.el),
  );
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:${width}px;border-radius:16px;background:#0e0e10;box-shadow:0 0 0 1px rgb(255 255 255 / 0.08), 0 60px 120px -30px rgb(0 0 0 / 0.6), 0 20px 50px -20px rgb(0 0 0 / 0.5);overflow:hidden;color:#e8e8e8`,
    },
    header,
    body,
  );
  return {
    el,
    rows,
    watching,
    // reveal: per-row 0..1 for diff lines; typed rows re-highlight partially typed text.
    reveal(i, p, typed) {
      const r = rows[i];
      set(r.tint, { opacity: Math.min(1, p * 1.4), transform: `scaleX(${Math.min(1, p * 1.6)})` });
      set(r.gutter, { opacity: p > 0 ? 1 : 0 });
      if (typed != null) {
        const n = Math.round(r.line.text.length * typed);
        const key = `${n}`;
        if (r.content.dataset.n !== key) {
          r.content.dataset.n = key;
          r.content.replaceChildren(...highlight(r.line.text.slice(0, n)));
        }
      }
    },
    label(i, value) {
      text(rows[i].content, value);
    },
  };
}
