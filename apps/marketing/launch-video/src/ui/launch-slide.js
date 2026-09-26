import { h, set, text } from '../lib/dom.js';
import { C, FONT } from '../theme.js';

// The demo deck page edited throughout the film. 1920 × 1080 slide pixels,
// built from absolutely positioned layers so it can explode in 3D.
export const LAYOUT = {
  eyebrow: { x: 140, y: 150 },
  head: { x: 140, y: 250 },
  headStartOffset: [80, 80],
  sub: { x: 140, y: 700 },
  pill: { x: 140, y: 872 },
  img: { x: 1160, y: 250, w0: 520, h0: 650, w1: 600, h1: 750 },
};

function artwork() {
  const chevron = (x, s, o) =>
    h('path', {
      d: `M${x} ${300 - s} L${x + s * 1.15} 300 L${x} ${300 + s} L${x + s * 0.5} 300 Z`,
      fill: '#fff',
      opacity: o,
    });
  return h(
    'div',
    {
      class: 'art',
      style:
        'position:absolute;inset:0;border-radius:28px;overflow:hidden;background:radial-gradient(90% 70% at 18% 8%, #ffc27a 0%, transparent 55%), radial-gradient(80% 70% at 100% 100%, #5c0d06 0%, transparent 60%), linear-gradient(160deg, #ff7a45 0%, #f0433a 42%, #a3180f 100%)',
    },
    h(
      'svg',
      {
        viewBox: '0 0 600 600',
        preserveAspectRatio: 'xMidYMid slice',
        style: 'position:absolute;inset:0;width:100%;height:100%',
      },
      chevron(40, 70, 0.28),
      chevron(150, 120, 0.42),
      chevron(290, 190, 0.9),
    ),
    h('div', {
      class: 'mono',
      text: 'fig. 01 — launch',
      style:
        'position:absolute;left:30px;top:26px;font-size:20px;color:rgb(255 255 255 / 0.85);letter-spacing:0.04em',
    }),
    h('div', {
      style:
        'position:absolute;inset:0;border-radius:28px;box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.18)',
    }),
  );
}

export function launchSlide() {
  const layer = (style, ...children) =>
    h('div', { style: `position:absolute;left:0;top:0;${style}` }, ...children);

  const bg = layer(`width:1920px;height:1080px;background:${C.paper}`);
  const rule = layer('width:1640px;height:3px;background:#0a0a0a;transform-origin:0 0', null);
  const eyebrow = layer(
    `font-family:${FONT.mono};font-size:26px;letter-spacing:0.3em;color:${C.hot};white-space:nowrap`,
    'LAUNCH — 2026',
  );
  const word = h('span', { style: 'position:relative;border-radius:10px' });
  const wordText = h('span', { text: 'deck.' });
  const caret = h('span', {
    style: `position:absolute;right:-8px;top:6%;width:7px;height:88%;background:${C.blue};opacity:0`,
  });
  word.append(wordText, caret);
  const head = layer(
    `font-family:${FONT.sans};font-size:190px;font-weight:800;letter-spacing:-0.05em;line-height:0.92;color:#0a0a0a;white-space:nowrap`,
    h('span', { text: 'Ship the' }),
    h('br'),
    word,
  );
  const sub = layer(
    `font-family:${FONT.sans};font-size:46px;font-weight:500;letter-spacing:-0.02em;line-height:1.2;color:#3b3b3b;white-space:nowrap`,
    'Drafted by your agent.',
    h('br'),
    'Finished by you.',
  );
  const pill = layer(
    `display:flex;align-items:center;gap:16px;padding:16px 30px;border-radius:999px;background:#0a0a0a;color:#fff;font-family:${FONT.mono};font-size:24px;letter-spacing:0.04em;white-space:nowrap`,
    h('span', {
      style: `width:14px;height:14px;border-radius:50%;background:${C.hot};box-shadow:0 0 0 5px oklch(0.6 0.2 25 / 0.3)`,
    }),
    'v2.0 — out now',
  );
  const img = layer('', artwork());
  const folio = layer(
    `font-family:${FONT.mono};font-size:22px;color:#6b6b6b;letter-spacing:0.08em;white-space:nowrap`,
    '01 / 06',
  );
  const root = h(
    'div',
    {
      class: 'launch-slide',
      style:
        'position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;transform-style:preserve-3d',
    },
    bg,
    rule,
    eyebrow,
    head,
    sub,
    img,
    pill,
    folio,
  );

  const layers = { bg, rule, eyebrow, head, sub, img, pill, folio };
  const base = {
    bg: [0, 0],
    rule: [140, 100],
    eyebrow: [LAYOUT.eyebrow.x, LAYOUT.eyebrow.y],
    head: [LAYOUT.head.x, LAYOUT.head.y],
    sub: [LAYOUT.sub.x, LAYOUT.sub.y],
    img: [LAYOUT.img.x, LAYOUT.img.y],
    pill: [LAYOUT.pill.x, LAYOUT.pill.y],
    folio: [1660, 1000],
  };

  return {
    root,
    layers,
    word,
    wordText,
    caret,
    base,
    // Rects in slide px for the current state (used by overlays).
    rect(name, st = {}) {
      const el = layers[name];
      const [bx, by] = base[name];
      const off = name === 'head' ? (st.headOffset ?? [0, 0]) : [0, 0];
      if (name === 'img') {
        return { x: bx, y: by, w: st.imgW ?? LAYOUT.img.w0, h: st.imgH ?? LAYOUT.img.h0 };
      }
      return { x: bx + off[0], y: by + off[1], w: el.offsetWidth, h: el.offsetHeight };
    },
    update({
      headOffset = [0, 0],
      imgW = LAYOUT.img.w0,
      imgH = LAYOUT.img.h0,
      wordValue = 'deck.',
      caretOn = false,
      highlight = 0,
      wordColor = '#0a0a0a',
      explode = 0,
      z = {},
      lift = {},
    } = {}) {
      for (const [name, el] of Object.entries(layers)) {
        const [bx, by] = base[name];
        const off = name === 'head' ? headOffset : [0, 0];
        const zz = (z[name] ?? 0) * explode + (lift[name] ?? 0);
        set(el, { transform: `translate3d(${bx + off[0]}px, ${by + off[1]}px, ${zz}px)` });
      }
      set(img, { width: imgW, height: imgH });
      text(wordText, wordValue);
      set(caret, { opacity: caretOn ? 1 : 0 });
      set(word, {
        background:
          highlight > 0 ? `oklch(0.623 0.214 259.815 / ${0.22 * highlight})` : 'transparent',
        color: wordColor,
      });
    },
  };
}
