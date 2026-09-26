import { h, set } from '../lib/dom.js';
import { C, DARK, FONT, LIGHT, SHADOW } from '../theme.js';
import { icon } from './icons.js';
import { logoImg } from './logo.js';

export const HOME = { w: 1600, h: 940, side: 264 };

export const DECKS = [
  {
    name: 'Launch Day',
    theme: 'paper',
    bg: C.paper,
    fg: '#0a0a0a',
    a: C.hot,
    t: 'Ship the\nstory.',
    k: 'main',
  },
  {
    name: 'Agent Handbook',
    theme: 'mono',
    bg: '#0b0b0c',
    fg: '#f3f3f3',
    a: '#8b8b8b',
    t: '/create-slide',
    k: 'mono',
  },
  {
    name: 'Visual Editor Tour',
    theme: 'signal',
    bg: C.hot,
    fg: '#fff',
    a: '#0a0a0a',
    t: 'VISUAL\nEDITOR',
    k: 'block',
  },
  {
    name: 'Quarterly Review',
    theme: 'paper',
    bg: '#f4f1ea',
    fg: '#0a0a0a',
    a: C.hot,
    t: 'Q3 → Q4',
    k: 'big',
  },
  {
    name: 'PPTX, for Real',
    theme: 'night',
    bg: '#101014',
    fg: '#f4f4f4',
    a: C.hot,
    t: 'PPTX,\nfor real.',
    k: 'main',
  },
  {
    name: 'Design Tokens 101',
    theme: 'paper',
    bg: '#fbfaf7',
    fg: '#141414',
    a: '#2b7fff',
    t: 'Tokens.',
    k: 'swatch',
  },
  {
    name: 'Roadmap 2027',
    theme: 'night',
    bg: '#0e1116',
    fg: '#eef2f7',
    a: '#f5b83d',
    t: 'Roadmap\n2027',
    k: 'block2',
  },
  {
    name: 'Hiring Plan',
    theme: 'signal',
    bg: '#1a1a1a',
    fg: '#fafafa',
    a: C.hot,
    t: 'We’re\nhiring.',
    k: 'list',
  },
  {
    name: 'Getting Started',
    theme: 'paper',
    bg: C.paper,
    fg: '#0a0a0a',
    a: C.hot,
    t: 'npx @open-slide\n/cli init',
    k: 'mono',
  },
];

export function deckThumb(d, w) {
  const k = w / 1920;
  const lines = d.t.split('\n');
  const title = h(
    'div',
    {
      style: `position:absolute;left:140px;top:${d.k === 'mono' ? 420 : d.k === 'big' ? 360 : 250}px;font-size:${d.k === 'mono' ? 140 : d.k === 'big' ? 300 : 220}px;font-weight:800;letter-spacing:-0.05em;line-height:0.92;white-space:nowrap;font-family:${d.k === 'mono' ? FONT.mono : FONT.sans}`,
    },
    lines.flatMap((l, i) =>
      i ? [h('br'), l === 'story.' ? h('span', { text: l, style: `color:${d.a}` }) : l] : [l],
    ),
  );
  const extra = [];
  if (d.k === 'main')
    extra.push(
      h('div', {
        style:
          'position:absolute;left:1160px;top:250px;width:600px;height:750px;border-radius:28px;background:linear-gradient(160deg,#ff7a45,#f0433a 42%,#a3180f)',
      }),
    );
  if (d.k === 'swatch')
    extra.push(
      h(
        'div',
        { style: 'position:absolute;left:140px;top:640px;display:flex;gap:30px' },
        ['#2b7fff', C.hot, '#1fae6b', '#f5b83d', '#141414'].map((c) =>
          h('div', { style: `width:190px;height:190px;border-radius:30px;background:${c}` }),
        ),
      ),
    );
  if (d.k === 'block2')
    extra.push(
      h('div', {
        style: `position:absolute;right:140px;top:250px;width:520px;height:580px;border-radius:24px;border:10px solid ${d.a}`,
      }),
    );
  if (d.k === 'list')
    extra.push(
      h(
        'div',
        { style: 'position:absolute;left:140px;top:760px;display:flex;gap:40px' },
        [0, 1, 2].map(() =>
          h('div', {
            style: `width:360px;height:120px;border-radius:20px;background:rgb(255 255 255 / 0.1)`,
          }),
        ),
      ),
    );
  return h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:1920px;height:1080px;transform:scale(${k});transform-origin:0 0;background:${d.bg};color:${d.fg}`,
    },
    h('div', {
      style: `position:absolute;left:140px;top:120px;width:220px;height:10px;background:${d.a}`,
    }),
    title,
    extra,
  );
}

export function homeView({ dark = false } = {}) {
  const P = dark ? DARK : LIGHT;
  const fgSoft = dark ? 'oklch(0.93 0 0 / 0.72)' : 'oklch(0.145 0 0 / 0.72)';
  const row = (name, label, count, active) =>
    h(
      'div',
      {
        class: 'nav-row',
        style: `display:flex;align-items:center;gap:10px;height:32px;padding:0 10px;border-radius:5px;font-size:12.5px;${active ? `background:${P.background};box-shadow:${SHADOW.edge}, 0 0 0 1px ${P.ring};font-weight:500;color:${P.fg}` : `color:${fgSoft}`}`,
      },
      icon(name, { size: 16 }),
      h('span', { text: label, style: 'flex:1' }),
      h('span', {
        class: 'mono nums',
        text: count,
        style: `font-size:10.5px;letter-spacing:0.08em;color:${P.mutedFg}`,
      }),
    );
  const search = h(
    'div',
    {
      class: 'search',
      style: `display:flex;align-items:center;gap:8px;height:32px;padding:0 8px 0 10px;border-radius:6px;border:1px solid ${P.border};background:${P.card};box-shadow:${SHADOW.edge};font-size:12.5px;color:${P.mutedFg}`,
    },
    icon('search', { size: 14 }),
    h('span', { text: 'Search', style: 'flex:1' }),
    h('span', {
      class: 'mono',
      text: '⌘K',
      style: `font-size:9.5px;padding:3px 5px;border-radius:3px;border:1px solid ${P.hairline};color:${P.mutedFg}`,
    }),
  );
  const themeBtn = h(
    'span',
    { class: 'theme-btn', style: `color:${P.mutedFg}` },
    icon(dark ? 'moon' : 'sun', { size: 15 }),
  );
  const sidebar = h(
    'div',
    {
      class: 'sidebar',
      style: `position:absolute;left:0;top:0;width:${HOME.side}px;height:${HOME.h}px;padding:16px 12px;display:flex;flex-direction:column;gap:4px;color:${P.fg}`,
    },
    h(
      'div',
      { style: 'display:flex;align-items:center;gap:10px;padding:0 4px 12px' },
      logoImg(24, 6),
      h('span', {
        text: 'open-slide',
        style: 'font-size:13.5px;font-weight:600;letter-spacing:-0.01em',
      }),
    ),
    search,
    h('div', { style: 'height:10px' }),
    row('layout-grid', 'Slides', '09', true),
    row('palette', 'Themes', '05', false),
    row('folder-open', 'Assets', '12', false),
    h('div', {
      class: 'eyebrow',
      text: 'Folders',
      style: `color:${P.mutedFg};padding:22px 10px 8px`,
    }),
    row('pen-line', 'Draft', '04', false),
    h(
      'div',
      {
        class: 'nav-row',
        style: `display:flex;align-items:center;gap:10px;height:32px;padding:0 10px;font-size:12.5px;color:${fgSoft}`,
      },
      h('span', {
        style: `width:12px;height:12px;border-radius:3px;background:${C.hot};margin:0 2px`,
      }),
      h('span', { text: 'Launch', style: 'flex:1' }),
      h('span', {
        class: 'mono',
        text: '03',
        style: `font-size:10.5px;letter-spacing:0.08em;color:${P.mutedFg}`,
      }),
    ),
    h('div', { style: 'flex:1' }),
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:12px;padding:0 6px;font-size:11px;color:${P.mutedFg}`,
      },
      h('span', { text: 'v2.0.0', style: 'flex:1' }),
      icon('languages', { size: 15 }),
      themeBtn,
    ),
  );

  const cardsGrid = h('div', {
    class: 'grid',
    style: 'display:grid;grid-template-columns:repeat(3, 1fr);column-gap:24px;row-gap:30px',
  });
  const thumbW = (HOME.w - HOME.side - 8 - 80 - 48) / 3;
  const cards = DECKS.map((d) => {
    const thumb = h(
      'div',
      {
        class: 'thumb',
        style: `position:relative;width:${thumbW}px;height:${thumbW * 0.5625}px;border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px ${P.hairline}, ${SHADOW.edge}`,
      },
      deckThumb(d, thumbW),
    );
    const card = h(
      'div',
      { class: 'deck-card', style: 'display:flex;flex-direction:column;gap:10px' },
      thumb,
      h(
        'div',
        { style: 'display:flex;align-items:center;justify-content:space-between' },
        h('span', { text: d.name, style: `font-size:14px;font-weight:500;color:${P.fg}` }),
        h(
          'span',
          { style: `display:flex;align-items:center;gap:4px;font-size:11px;color:${P.mutedFg}` },
          icon('palette', { size: 12 }),
          d.theme,
        ),
      ),
    );
    cardsGrid.append(card);
    return { card, thumb };
  });

  const header = h(
    'div',
    { style: 'display:flex;align-items:center;gap:10px;margin-bottom:28px' },
    h('span', { style: `color:${P.fg}` }, icon('layout-grid', { size: 18 })),
    h('span', {
      text: 'Slides',
      style: `font-size:21px;font-weight:600;letter-spacing:-0.015em;color:${P.fg}`,
    }),
    h('span', {
      class: 'mono',
      text: '09',
      style: `font-size:10.5px;letter-spacing:0.08em;color:${P.mutedFg};margin-left:2px`,
    }),
    h('div', { style: 'flex:1' }),
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:6px;border:1px solid ${P.border};background:${P.card};font-size:12.5px;font-weight:500;color:${P.fg}`,
      },
      icon('clock', { size: 14 }),
      'Newest',
      h('span', { style: `color:${P.mutedFg}` }, icon('chevron-down', { size: 13 })),
    ),
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:8px;width:240px;height:32px;padding:0 10px;border-radius:6px;border:1px solid ${P.border};background:${P.card};font-size:12.5px;color:${P.mutedFg}`,
      },
      icon('search', { size: 14 }),
      'Search slides',
    ),
  );
  const content = h(
    'div',
    {
      class: 'content-card',
      style: `position:absolute;left:${HOME.side}px;top:8px;width:${HOME.w - HOME.side - 8}px;height:${HOME.h - 16}px;border-radius:10px;background:${P.background};box-shadow:${SHADOW.edge}, 0 0 0 1px ${P.ring};padding:44px 40px;overflow:hidden`,
    },
    header,
    cardsGrid,
  );
  const ground = h('div', {
    class: 'ground',
    style: `position:absolute;left:0;top:0;width:${HOME.w}px;height:${HOME.h}px;border-radius:14px;background:${P.chrome};box-shadow:0 0 0 1px ${dark ? 'rgb(255 255 255 / 0.08)' : 'rgb(0 0 0 / 0.08)'}, 0 50px 120px -30px rgb(0 0 0 / 0.45)`,
  });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:${HOME.w}px;height:${HOME.h}px;transform-style:preserve-3d;font-family:${FONT.sans};color:${P.fg}`,
    },
    ground,
    sidebar,
    content,
  );
  return { el, ground, sidebar, content, header, cards, search, themeBtn, P };
}

export function commandMenu({ dark = false } = {}) {
  const P = dark ? DARK : LIGHT;
  const input = h('span', { style: `color:${P.fg}` });
  const placeholder = h('span', {
    text: 'Search slides or run a command…',
    style: `color:${P.mutedFg}`,
  });
  const caret = h('span', {
    style: `display:inline-block;width:1.5px;height:16px;background:${P.fg};vertical-align:-3px;margin-left:1px`,
  });
  const item = (name, label, hint) =>
    h(
      'div',
      {
        class: 'cmd-item',
        style: `display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border-radius:6px;font-size:13px;color:${P.fg}`,
      },
      h('span', { style: `color:${P.mutedFg}` }, icon(name, { size: 15 })),
      h('span', { text: label, style: 'flex:1' }),
      hint
        ? h('span', { class: 'mono', text: hint, style: `font-size:10px;color:${P.mutedFg}` })
        : null,
    );
  const group = (label) =>
    h('div', { class: 'eyebrow', text: label, style: `color:${P.mutedFg};padding:10px 10px 6px` });
  const items = [
    item('layout-grid', 'Launch Day', '6 pages'),
    item('play', 'Present Launch Day', '↵'),
    item('presentation', 'Export as PPTX'),
    item('sun', 'Switch to dark theme'),
  ];
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:580px;border-radius:12px;background:${P.popover};box-shadow:${SHADOW.overlay};overflow:hidden;font-family:${FONT.sans};transform-origin:50% 0`,
    },
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:10px;height:50px;padding:0 16px;border-bottom:1px solid ${P.hairline};font-size:14px`,
      },
      h('span', { style: `color:${P.mutedFg}` }, icon('search', { size: 16 })),
      h('span', {}, input, caret, placeholder),
    ),
    h(
      'div',
      { style: 'padding:4px 6px 8px' },
      group('Slides'),
      items[0],
      group('Present'),
      items[1],
      group('Export'),
      items[2],
      group('Appearance'),
      items[3],
    ),
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:14px;height:38px;padding:0 14px;border-top:1px solid ${P.hairline};font-size:11px;color:${P.mutedFg}`,
      },
      h('span', {
        class: 'mono',
        text: 'esc',
        style: `padding:2px 5px;border:1px solid ${P.hairline};border-radius:3px;font-size:9.5px`,
      }),
      'Close',
      h('div', { style: 'flex:1' }),
      h('span', {
        class: 'mono',
        text: '↑↓',
        style: `padding:2px 5px;border:1px solid ${P.hairline};border-radius:3px;font-size:9.5px`,
      }),
      'Navigate',
      h('span', {
        class: 'mono',
        text: '↵',
        style: `padding:2px 5px;border:1px solid ${P.hairline};border-radius:3px;font-size:9.5px`,
      }),
      'Select',
    ),
  );
  return {
    el,
    items,
    update({ typed, caretOn }) {
      input.textContent = typed;
      set(placeholder, { display: typed ? 'none' : 'inline' });
      set(caret, { opacity: caretOn ? 1 : 0 });
    },
  };
}

export function cardMenu() {
  const it = (name, label, danger) =>
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:9px;height:30px;padding:0 9px;border-radius:5px;font-size:12.5px;color:${danger ? 'oklch(0.58 0.22 27)' : LIGHT.fg}`,
      },
      icon(name, { size: 14 }),
      label,
    );
  return h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:190px;padding:4px;border-radius:8px;border:1px solid ${LIGHT.border};background:${LIGHT.popover};box-shadow:${SHADOW.overlay};font-family:${FONT.sans};opacity:0;transform-origin:100% 0`,
    },
    it('pencil', 'Rename'),
    it('copy', 'Duplicate'),
    it('folder', 'Move to folder…'),
    h('div', { style: `height:1px;background:${LIGHT.hairline};margin:4px -4px` }),
    it('x', 'Delete', true),
  );
}
