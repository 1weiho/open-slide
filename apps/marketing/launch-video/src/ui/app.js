import { h, set, text } from '../lib/dom.js';
import { clamp, swift } from '../lib/ease.js';
import { C, FONT, LIGHT as P, SHADOW } from '../theme.js';
import { icon } from './icons.js';
import {
  checker,
  divider,
  eyebrow,
  field,
  folio,
  iconBtn,
  kbd,
  swatch,
  textBtn,
  toggleGroup,
} from './kit.js';
import { launchSlide } from './launch-slide.js';

export const WIN = { w: 1600, h: 940, bar: 38, tool: 48, rail: 232, panel: 320, notes: 36 };
const TOP = WIN.bar + WIN.tool;

function browserBar() {
  const dot = (c) =>
    h('div', { style: `width:12px;height:12px;border-radius:50%;background:${c}` });
  return h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:${WIN.w}px;height:${WIN.bar}px;display:flex;align-items:center;padding:0 16px;gap:8px;background:oklch(0.955 0 0);border-bottom:1px solid ${P.border}`,
    },
    dot('#ff5f57'),
    dot('#febc2e'),
    dot('#28c840'),
    h(
      'div',
      {
        style: `position:absolute;left:50%;top:7px;transform:translateX(-50%);height:24px;width:420px;border-radius:6px;background:${P.card};box-shadow:${SHADOW.edge};display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:${P.mutedFg}`,
      },
      h('span', { text: 'localhost:5173' }),
      h('span', { text: '/s/launch-day', style: `color:${P.fg}` }),
    ),
  );
}

function toolbar() {
  const agent = h(
    'div',
    {
      style: `height:22px;display:flex;align-items:center;gap:6px;padding:0 7px;border-radius:3px;border:1px solid ${P.hairline};font-size:10.5px;color:${P.fg};background:${P.card}`,
    },
    h('span', { style: `width:6px;height:6px;border-radius:50%;background:${C.emerald}` }),
    'Agent connected',
  );
  const tabs = h(
    'div',
    {
      style: `display:flex;padding:2px;border-radius:7px;background:oklch(0.955 0 0 / 0.7);box-shadow:inset 0 0 0 1px ${P.border}`,
    },
    h('div', {
      text: 'Slides',
      style: `height:24px;padding:0 12px;display:grid;place-items:center;font-size:12px;font-weight:500;border-radius:5px;background:${P.card};box-shadow:${SHADOW.edge}`,
    }),
    h('div', {
      text: 'Assets',
      style: `height:24px;padding:0 12px;display:grid;place-items:center;font-size:12px;color:${P.mutedFg}`,
    }),
  );
  const modeEye = iconBtn('eye', { size: 28 });
  const modePen = iconBtn('pencil', { size: 28, active: true });
  const mode = h(
    'div',
    {
      style: `display:flex;padding:2px;border-radius:8px;border:1px solid oklch(0.92 0 0 / 0.7);background:oklch(0.955 0 0 / 0.7)`,
    },
    modeEye,
    modePen,
  );
  const formatBtn = textBtn('Format', 'panel-right');
  const present = h(
    'div',
    {
      style: `display:flex;height:28px;border-radius:5px;background:${C.brand};color:#fff;font-size:12.5px;font-weight:500;overflow:hidden`,
    },
    h(
      'div',
      { style: 'display:flex;align-items:center;gap:6px;padding:0 12px' },
      icon('play', { size: 13, fill: '#fff' }),
      'Present',
    ),
    h(
      'div',
      {
        style:
          'width:26px;display:grid;place-items:center;border-left:1px solid rgb(255 255 255 / 0.25)',
      },
      icon('chevron-down', { size: 14 }),
    ),
  );
  const download = iconBtn('download', { size: 28 });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:${WIN.bar}px;width:${WIN.w}px;height:${WIN.tool}px;display:flex;align-items:center;padding:0 12px;gap:8px`,
    },
    iconBtn('chevron-left'),
    divider(),
    tabs,
    agent,
    h('div', { style: 'flex:1' }),
    mode,
    divider(),
    iconBtn('link-2'),
    download,
    h(
      'div',
      { style: 'display:flex;align-items:center;gap:6px' },
      textBtn('Design', 'palette'),
      kbd('D'),
    ),
    formatBtn,
    divider(),
    present,
    h('div', {
      text: 'Launch Day',
      style: `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:13.5px;font-weight:600;letter-spacing:-0.01em;color:${P.fg}`,
    }),
  );
  return { el, formatBtn, download };
}

const MINI = [
  { bg: C.paper, fg: '#0a0a0a', accent: C.hot, title: 'Ship the\ndeck.', kind: 'main' },
  { bg: '#0b0b0c', fg: '#f4f4f4', accent: '#8b8b8b', title: '/create-slide', kind: 'mono' },
  { bg: C.hot, fg: '#fff', accent: '#0a0a0a', title: 'VISUAL\nEDITOR', kind: 'block' },
  { bg: '#f4f1ea', fg: '#0a0a0a', accent: C.hot, title: 'Inspect.\nComment.', kind: 'list' },
  { bg: '#101014', fg: '#f4f4f4', accent: C.hot, title: 'PPTX,\nfor real.', kind: 'main' },
  { bg: C.paper, fg: '#0a0a0a', accent: C.hot, title: 'npx @open-slide\n/cli init', kind: 'mono' },
];

export function miniSlide(spec, { w = 176 } = {}) {
  const k = w / 1920;
  const lines = spec.title.split('\n');
  const inner = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:1920px;height:1080px;transform:scale(${k});transform-origin:0 0;background:${spec.bg};color:${spec.fg};font-family:${spec.kind === 'mono' ? FONT.mono : FONT.sans}`,
    },
    h('div', {
      style: `position:absolute;left:140px;top:120px;width:220px;height:10px;background:${spec.accent}`,
    }),
    h(
      'div',
      {
        style: `position:absolute;left:140px;top:${spec.kind === 'mono' ? 420 : 260}px;font-size:${spec.kind === 'mono' ? 150 : 230}px;font-weight:800;letter-spacing:-0.05em;line-height:0.92;white-space:nowrap`,
      },
      lines.flatMap((l, i) =>
        i
          ? [h('br'), l === 'story.' ? h('span', { text: l, style: `color:${spec.accent}` }) : l]
          : [l],
      ),
    ),
    spec.kind === 'main'
      ? h('div', {
          style: `position:absolute;left:1160px;top:250px;width:600px;height:750px;border-radius:28px;background:linear-gradient(160deg,#ff7a45,#f0433a 42%,#a3180f)`,
        })
      : null,
  );
  return h(
    'div',
    {
      style: `position:relative;width:${w}px;height:${w * 0.5625}px;overflow:hidden;border-radius:4px;box-shadow:0 0 0 1px ${P.hairline}`,
    },
    inner,
  );
}

function rail() {
  const after = h(
    'div',
    { style: 'position:absolute;inset:0;opacity:0' },
    miniSlide({ ...MINI[0], title: 'Ship the\nstory.', accent: C.hot }),
  );
  const rows = MINI.map((spec, i) =>
    h(
      'div',
      {
        style: `display:flex;gap:10px;padding:8px 10px 8px 8px;border-radius:6px;${i === 0 ? `background:${P.muted}` : ''}`,
      },
      h('span', {
        class: 'mono',
        text: String(i + 1).padStart(2, '0'),
        style: `font-size:10px;width:16px;color:${i === 0 ? C.brand : P.mutedFg};padding-top:2px`,
      }),
      h(
        'div',
        {
          style: `position:relative;border-radius:5px;${i === 0 ? `box-shadow:0 0 0 1.5px ${C.brand}` : ''}`,
        },
        miniSlide(spec),
        i === 0 ? after : null,
      ),
    ),
  );
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:${TOP}px;width:${WIN.rail}px;height:${WIN.h - TOP - WIN.notes}px;padding:6px 8px;overflow:hidden`,
    },
    h(
      'div',
      {
        style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 8px 10px',
      },
      eyebrow('Pages'),
      h(
        'div',
        { style: `display:flex;align-items:center;gap:8px;color:${P.mutedFg}` },
        folio('06'),
        icon('grid-2x2', { size: 13 }),
      ),
    ),
    rows,
  );
  return { el, after };
}

function panelSection(title, ...children) {
  return h(
    'div',
    { style: 'padding:16px 14px 6px;display:flex;flex-direction:column;gap:10px' },
    eyebrow(title),
    ...children,
  );
}

function row(...children) {
  return h('div', { style: 'display:flex;gap:8px;align-items:center' }, ...children);
}

function formatPanel() {
  const header = h(
    'div',
    {
      style: `height:40px;display:flex;align-items:center;gap:8px;padding:0 12px 0 14px;border-bottom:1px solid ${P.hairline};font-size:12.5px;font-weight:600;color:${P.fg}`,
    },
    icon('paintbrush', { size: 14 }),
    'Format',
    h('div', { style: 'flex:1' }),
    h('span', { style: `color:${P.mutedFg}` }, icon('x', { size: 14 })),
  );
  const banner = (iconName, label, tabIcon) =>
    h(
      'div',
      { style: 'display:flex;align-items:center;gap:8px;padding:12px 12px 4px 14px' },
      h('span', { style: `color:${P.mutedFg}` }, icon(iconName, { size: 14 })),
      h('span', { text: label, style: `font-size:12.5px;font-weight:500;color:${P.fg}` }),
      h('div', { style: 'flex:1' }),
      h(
        'div',
        {
          style: `display:flex;padding:2px;border-radius:7px;background:${P.muted};gap:0`,
        },
        h(
          'div',
          {
            style: `width:30px;height:26px;border-radius:5px;display:grid;place-items:center;background:${P.card};box-shadow:${SHADOW.edge}`,
          },
          icon(tabIcon, { size: 14 }),
        ),
        h(
          'div',
          { style: `width:30px;height:26px;display:grid;place-items:center;color:${P.mutedFg}` },
          icon('move', { size: 14 }),
        ),
      ),
    );

  const sizeField = field({ iconName: 'a-large-small', value: '190', unit: 'px', width: '108px' });
  const textSwatch = swatch('#0A0A0A');
  const hexField = field({ value: '#0A0A0A', extra: 'flex:1', width: 'auto' });
  hexField.querySelector('.fv').style.textAlign = 'left';
  const content = h('div', {
    text: 'Ship the deck.',
    style: `height:64px;border-radius:5px;border:1px solid ${P.border};background:${P.card};padding:8px 10px;font-size:12px;color:${P.fg}`,
  });
  const textBody = h(
    'div',
    {},
    banner('type', 'Text', 'type'),
    panelSection(
      'Typography',
      row(
        h(
          'div',
          {
            style: `flex:1;height:28px;border-radius:5px;border:1px solid ${P.border};background:${P.card};display:flex;align-items:center;justify-content:space-between;padding:0 8px;font-size:12px;color:${P.fg}`,
          },
          'Extrabold',
          h('span', { style: `color:${P.mutedFg}` }, icon('chevron-down', { size: 13 })),
        ),
        sizeField,
      ),
      row(
        toggleGroup(['bold', 'italic'], [0]),
        toggleGroup(['align-left', 'align-center', 'align-right', 'align-justify'], [0]),
      ),
      row(
        field({ iconName: 'unfold-vertical', value: '0.92', width: '50%' }),
        field({ iconName: 'move-horizontal', value: '-9.5', unit: 'px', width: '50%' }),
      ),
    ),
    panelSection(
      'Color',
      row(
        h('span', { text: 'Text', style: `width:68px;font-size:11.5px;color:${P.mutedFg}` }),
        textSwatch.el,
        hexField,
      ),
      row(
        h('span', { text: 'Background', style: `width:68px;font-size:11.5px;color:${P.mutedFg}` }),
        h(
          'div',
          {
            style: `width:28px;height:28px;border-radius:5px;border:1px solid ${P.border};display:grid;place-items:center;background:${P.card}`,
          },
          h('div', { style: `width:16px;height:16px;border-radius:3px;${checker}` }),
        ),
        field({ value: '—', extra: 'flex:1', width: 'auto' }),
      ),
    ),
    panelSection(
      'Content',
      h(
        'div',
        {
          style: `position:absolute;right:14px;margin-top:-26px;display:flex;align-items:center;gap:5px;font-size:11.5px;color:${P.fg}`,
        },
        icon('pencil-line', { size: 12 }),
        'Edit on slide',
      ),
      content,
    ),
  );

  const imgBody = h(
    'div',
    {},
    banner('image', 'Image', 'image'),
    panelSection(
      'Image',
      row(
        h(
          'div',
          {
            style: `width:56px;height:56px;border-radius:6px;overflow:hidden;${checker}`,
          },
          h('div', {
            style:
              'width:100%;height:100%;background:linear-gradient(160deg,#ff7a45,#f0433a 42%,#a3180f)',
          }),
        ),
        h(
          'div',
          { style: 'display:flex;flex-direction:column;gap:6px' },
          textBtn('Replace…', null, {
            extra: `border:1px solid ${P.border};background:${P.card};height:26px`,
          }),
          textBtn('Crop…', 'crop', {
            extra: `border:1px solid ${P.border};background:${P.card};height:26px`,
          }),
        ),
      ),
    ),
    panelSection(
      'Position',
      row(
        field({ prefix: 'X', value: '1160', width: '50%' }),
        field({ prefix: 'Y', value: '250', width: '50%' }),
      ),
      row(
        field({ prefix: 'W', value: '520', width: '50%' }),
        field({ prefix: 'H', value: '650', width: '50%' }),
      ),
    ),
  );
  const [imgW, imgH] = [...imgBody.querySelectorAll('.fv')].slice(2, 4);

  const footer = h(
    'div',
    { style: 'position:absolute;left:0;right:0;bottom:8px' },
    ['Comment', 'Source'].map((label) =>
      h(
        'div',
        {
          style: 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px',
        },
        eyebrow(label),
        h('span', { style: `color:${P.mutedFg}` }, icon('chevron-right', { size: 13 })),
      ),
    ),
  );

  const inner = h(
    'div',
    { style: `position:absolute;left:0;top:0;width:${WIN.panel}px;height:100%` },
    header,
    textBody,
    imgBody,
    footer,
  );
  const el = h(
    'div',
    {
      style: `position:absolute;top:${TOP}px;right:0;width:0;height:${WIN.h - TOP - WIN.notes}px;overflow:hidden`,
    },
    inner,
  );
  return {
    el,
    inner,
    textBody,
    imgBody,
    sizeValue: sizeField.querySelector('.fv'),
    hexValue: hexField.querySelector('.fv'),
    textChip: textSwatch.chip,
    content,
    imgW,
    imgH,
  };
}

function saveBar() {
  const count = h('span', { text: '4 unsaved changes' });
  const label = h('span', { text: 'Save' });
  const saveIcon = h('span', {}, icon('save', { size: 13 }));
  const spin = h('span', { style: 'display:none' }, icon('loader-circle', { size: 13 }));
  const check = h(
    'span',
    { style: `display:none;color:${C.green}` },
    icon('check', { size: 14, stroke: 2.2 }),
  );
  const saveBtn = h(
    'div',
    {
      style: `height:28px;padding:0 12px;border-radius:5px;background:${C.brand};color:#fff;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500`,
    },
    saveIcon,
    spin,
    label,
  );
  const status = h(
    'div',
    { style: 'display:flex;align-items:center;gap:8px;padding:0 6px;font-size:12px' },
    h('span', {
      class: 'dot',
      style: `width:6px;height:6px;border-radius:50%;background:${C.brand};box-shadow:0 0 0 3px ${C.brandSoft}`,
    }),
    check,
    count,
  );
  const undo = iconBtn('undo-2', { size: 28, iconSize: 14 });
  const redo = iconBtn('redo-2', { size: 28, iconSize: 14 });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;height:40px;display:flex;align-items:center;gap:4px;padding:0 5px;border-radius:8px;border:1px solid ${P.border};background:oklch(1 0 0 / 0.95);box-shadow:${SHADOW.overlay};white-space:nowrap;color:${P.fg};transform-origin:50% 100%`,
    },
    undo,
    redo,
    divider(16),
    status,
    h('div', { text: 'Discard', style: `font-size:12px;padding:0 8px;color:${P.mutedFg}` }),
    saveBtn,
  );
  return { el, count, label, saveIcon, spin, check, dot: status.querySelector('.dot'), undo, redo };
}

function textToolbar() {
  const size = h('div', {
    class: 'mono',
    text: '190',
    style: `width:36px;height:28px;border-radius:5px;border:1px solid ${P.border};display:grid;place-items:center;font-size:11px`,
  });
  const chip = h('div', {
    style: `width:16px;height:16px;border-radius:3px;background:#0a0a0a;box-shadow:inset 0 0 0 1px oklch(0.145 0 0 / 0.15)`,
  });
  const btn = (name) =>
    h(
      'div',
      {
        style: `width:28px;height:28px;border-radius:5px;display:grid;place-items:center;color:${P.fg}`,
      },
      icon(name, { size: 14 }),
    );
  const colorBtn = h(
    'div',
    { style: 'width:28px;height:28px;border-radius:5px;display:grid;place-items:center' },
    chip,
  );
  const sep = () =>
    h('div', { style: `width:1px;height:16px;background:${P.hairline};margin:0 3px` });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;display:flex;align-items:center;gap:2px;padding:4px;border-radius:8px;border:1px solid ${P.border};background:${P.popover};box-shadow:${SHADOW.floating};color:${P.fg};transform-origin:50% 100%`,
    },
    btn('minus'),
    size,
    btn('plus'),
    sep(),
    btn('bold'),
    btn('italic'),
    colorBtn,
    sep(),
    btn('align-left'),
    btn('align-center'),
    btn('align-right'),
  );
  return { el, chip, colorBtn };
}

// `slide` is any object whose `root` is a 1920 × 1080 element; defaults to
// the demo deck page from launch-slide.js.
export function slideViewer({ slide = launchSlide() } = {}) {
  const bg = h('div', {
    style: `position:absolute;left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;border-radius:14px;background:${P.chrome};box-shadow:0 0 0 1px rgb(0 0 0 / 0.08), 0 50px 120px -30px rgb(0 0 0 / 0.45), 0 20px 50px -20px rgb(0 0 0 / 0.3)`,
  });
  const chrome = h('div', {
    style: `position:absolute;left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;border-radius:14px;overflow:hidden`,
  });
  const bar = browserBar();
  const tb = toolbar();
  const rl = rail();
  const card = h('div', {
    style: `position:absolute;left:${WIN.rail + 8}px;top:${TOP}px;height:${WIN.h - TOP - WIN.notes}px;border-radius:10px;background:${P.background};box-shadow:${SHADOW.edge}, 0 0 0 1px ${P.ring}`,
  });
  const notes = h(
    'div',
    {
      style: `position:absolute;left:0;bottom:0;width:${WIN.w}px;height:${WIN.notes}px;display:flex;align-items:center;gap:8px;padding:0 16px;font-size:12px;color:${P.fg}`,
    },
    icon('notebook-pen', { size: 14 }),
    'Notes',
    folio('page 1/6'),
  );
  const panel = formatPanel();
  chrome.append(bar, tb.el, rl.el, card, notes, panel.el);

  const slideShadow = h('div', {
    style: `position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;border-radius:12px;box-shadow:0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 40px -4px rgb(0 0 0 / 0.14)`,
  });
  const comments = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;height:30px;padding:0 10px;border-radius:999px;display:flex;align-items:center;gap:6px;font-size:12px;background:${P.card};box-shadow:${SHADOW.floating};color:${P.fg}`,
    },
    icon('message-square', { size: 14 }),
    '0',
  );
  const overlay = h('div', {
    style: `position:absolute;left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;pointer-events:none`,
  });
  const sb = saveBar();
  const tt = textToolbar();
  overlay.append(comments, sb.el, tt.el);

  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;transform-style:preserve-3d;font-family:${FONT.sans};color:${P.fg}`,
    },
    bg,
    chrome,
    slideShadow,
    slide.root,
    overlay,
  );

  const layout = (panelW) => {
    const cardX = WIN.rail + 8;
    const cardW = WIN.w - cardX - 8 - panelW;
    const cardH = WIN.h - TOP - WIN.notes;
    const k = Math.min((cardW - 80) / 1920, (cardH - 80) / 1080);
    const sw = 1920 * k;
    const sh = 1080 * k;
    return {
      cardX,
      cardW,
      cardH,
      k,
      sx: cardX + (cardW - sw) / 2,
      sy: TOP + (cardH - sh) / 2,
      sw,
      sh,
    };
  };

  return {
    el,
    bg,
    chrome,
    overlay,
    slide,
    panel,
    toolbar: tb,
    saveBar: sb,
    textToolbar: tt,
    thumbAfter: rl.after,
    layout,
    toWin(r, L) {
      return { x: L.sx + r.x * L.k, y: L.sy + r.y * L.k, w: r.w * L.k, h: r.h * L.k };
    },
    update({
      panelOpen = 0,
      panelKind = 'text',
      save = null,
      toolbarAt = null,
      chromeFade = 0,
      slideLift = 0,
      slideTilt = null,
    }) {
      const po = swift(clamp(panelOpen));
      const panelW = WIN.panel * po;
      const L = layout(panelW);
      set(card, { width: L.cardW });
      set(panel.el, { width: panelW });
      set(panel.textBody, { display: panelKind === 'text' ? 'block' : 'none' });
      set(panel.imgBody, { display: panelKind === 'image' ? 'block' : 'none' });
      set(tb.formatBtn, { background: po > 0.5 ? P.muted : 'transparent' });
      const tl = slideTilt ?? { rx: 0, rz: 0, dx: 0, dy: 0, s: 1 };
      const slideTf = `translate3d(${L.sx + L.sw / 2 + tl.dx}px, ${L.sy + L.sh / 2 + tl.dy}px, ${slideLift}px) rotateX(${tl.rx}deg) rotateZ(${tl.rz}deg) scale(${L.k * tl.s}) translate(-960px, -540px)`;
      set(slide.root, { transform: slideTf });
      set(slideShadow, { transform: slideTf, opacity: 1 - chromeFade });
      set(chrome, { opacity: 1 - chromeFade });
      set(bg, { opacity: 1 - chromeFade });
      set(comments, {
        transform: `translate(${L.cardX + L.cardW - 64}px, ${TOP + L.cardH - 46}px)`,
        opacity: 1 - chromeFade,
      });
      if (save) {
        const s = clamp(save.show);
        set(sb.el, {
          opacity: s,
          transform: `translate(${L.cardX + L.cardW / 2}px, ${TOP + L.cardH - 64 + (1 - s) * 8}px) translateX(-50%) scale(${0.98 + 0.02 * s})`,
        });
        text(sb.count, save.count === 1 ? '1 unsaved change' : `${save.count} unsaved changes`);
        const saving = save.state === 'saving';
        const saved = save.state === 'saved';
        set(sb.saveIcon, { display: saving ? 'none' : 'inline' });
        set(sb.spin, {
          display: saving ? 'inline-block' : 'none',
          transform: `rotate(${(save.t ?? 0) * 720}deg)`,
        });
        text(sb.label, saving ? 'Saving' : 'Save');
        set(sb.check, { display: saved ? 'inline' : 'none' });
        set(sb.dot, { display: saved ? 'none' : 'inline-block' });
        if (saved) text(sb.count, 'Saved');
      } else set(sb.el, { opacity: 0 });
      if (toolbarAt) {
        const s = clamp(toolbarAt.show);
        set(tt.el, {
          opacity: s,
          transform: `translate(${toolbarAt.x}px, ${toolbarAt.y}px) translate(-50%, -100%) translateY(${(1 - s) * 6}px) scale(${0.96 + 0.04 * s})`,
        });
      } else set(tt.el, { opacity: 0 });
      return L;
    },
  };
}
