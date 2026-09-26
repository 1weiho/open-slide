import { envelope, impulse, keys, prog } from '#lib/anim.js';
import { attr, h, set, split } from '#lib/dom.js';
import { clamp, glide, inCubic, inQuad, outExpo, snap, swift } from '#lib/ease.js';
import { hash } from '#lib/rand.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { icon } from '#ui/icons.js';
import { logoMark } from '#ui/logo.js';
import { SPANS } from '../timeline.js';

const FEATURES = [
  ['square-mouse-pointer', 'Visual editor', 'Select, drag, resize'],
  ['magnet', 'Smart guides', 'Snap to edges & centers'],
  ['bring-to-front', 'Layer ordering', 'Front, forward, back'],
  ['text-cursor-input', 'Inline text editing', 'Double-click to type'],
  ['paintbrush', 'Format panel', 'Type, color, content'],
  ['undo-2', 'Undo & safe saves', 'Edits land in source'],
  ['presentation', 'Editable PPTX', 'Native text & shapes'],
  ['type', 'Google Fonts', 'Search & add in-app'],
  ['layout-grid', 'Redesigned UI', 'Inset shell, line icons'],
  ['terminal', 'New CLI', 'Guided init, clean logs'],
  ['zap', 'React 19 · Vite 8 · TS 7', 'Modern toolchain'],
  ['sparkles', 'Held-exit transitions', 'No dips through black'],
];
const COLS = 4;
const TW = 430;
const TH = 250;
const GAP = 28;
const HIT = 70.0;
const T = {
  tiles: 66.35,
  step: 0.125,
  wave: 68.75,
  burst: 69.45,
  word: 70.2,
  cmd: 70.85,
  url: 71.2,
  sheen: 72.6,
  fade: 76.6,
};
const MARK = 300;

export default defineScene({
  name: 'finale',
  span: SPANS.finale,
  sfx: [
    ...FEATURES.map((_, i) => [T.tiles + i * T.step, 'flip', 0.5]),
    [T.wave - 0.8, 'riser', 0.9, { dur: HIT - T.wave + 0.8 }],
    [T.burst, 'whoosh', 1],
    [HIT, 'impact', 1],
    [T.cmd, 'pop', 0.6],
    [T.url, 'blip', 0.5],
    [T.sheen, 'shimmer', 0.6],
  ],
  build(root) {
    set(root, { background: C.void, perspective: '2600px' });
    const wall = h('div', { class: 'abs preserve', style: 'left:960px;top:540px' });
    const gw = COLS * TW + (COLS - 1) * GAP;
    const gh = 3 * TH + 2 * GAP;
    const tiles = FEATURES.map(([ic, title, sub], i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const el = h(
        'div',
        {
          style: `position:absolute;left:${col * (TW + GAP) - gw / 2}px;top:${row * (TH + GAP) - gh / 2}px;width:${TW}px;height:${TH}px;border-radius:18px;background:linear-gradient(160deg, #18181b, #0e0e10);box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.08);padding:30px 32px;display:flex;flex-direction:column;justify-content:space-between;font-family:${FONT.sans};transform-origin:50% 100%;backface-visibility:hidden`,
        },
        h(
          'div',
          { style: 'display:flex;justify-content:space-between;align-items:flex-start' },
          h(
            'span',
            {
              style: `width:62px;height:62px;border-radius:16px;display:grid;place-items:center;background:oklch(0.6 0.2 25 / 0.14);color:${C.brand}`,
            },
            icon(ic, { size: 32, stroke: 1.9 }),
          ),
          h('span', {
            class: 'mono',
            text: String(i + 1).padStart(2, '0'),
            style: 'font-size:20px;color:rgb(255 255 255 / 0.35);letter-spacing:0.08em',
          }),
        ),
        h(
          'div',
          {},
          h('div', {
            text: title,
            style:
              'font-size:36px;font-weight:700;letter-spacing:-0.035em;color:#f4f4f4;line-height:1.05',
          }),
          h('div', {
            class: 'mono',
            text: sub,
            style: 'font-size:18px;color:rgb(255 255 255 / 0.5);margin-top:10px',
          }),
        ),
      );
      const ring = h('div', {
        style: `position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 2px ${C.brand}, 0 0 50px -10px oklch(0.6 0.2 25 / 0.7);opacity:0`,
      });
      el.append(ring);
      wall.append(el);
      return { el, ring, col, row };
    });

    const bloom = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(55% 60% at 50% 45%, oklch(0.6 0.2 25 / 0.3), transparent 70%);opacity:0',
    });
    const cool = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(45% 45% at 34% 44%, oklch(0.7 0.12 255 / 0.18), transparent 70%);opacity:0',
    });
    const mark = logoMark({ size: MARK, tile: false });
    const word = h('div', {
      style: `font-family:${FONT.sans};font-size:160px;font-weight:700;letter-spacing:-0.055em;line-height:1;color:#f7f7f7;white-space:nowrap;margin-left:-6px;padding-bottom:14px`,
    });
    const chars = split(word, 'open-slide', { by: 'char', mask: true });
    const badge = h(
      'div',
      {
        style: `margin-left:28px;padding:4px 24px 12px;border-radius:28px;background:${C.brand};color:#fff;font-family:${FONT.sans};font-size:124px;font-weight:800;letter-spacing:-0.05em;line-height:1;box-shadow:0 20px 80px -10px oklch(0.6 0.2 25 / 0.7)`,
      },
      '2.0',
    );
    const lockup = h(
      'div',
      { style: 'position:absolute;left:50%;top:40%;display:flex;align-items:center' },
      h('div', { style: `width:${MARK}px;height:${MARK}px;flex:none;margin-right:-24px` }, mark.el),
      word,
      badge,
    );
    const cmd = h(
      'div',
      {
        class: 'mono',
        style: `position:absolute;left:50%;top:690px;display:flex;align-items:center;gap:22px;padding:22px 30px;border-radius:16px;background:rgb(255 255 255 / 0.06);box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.12);font-size:40px;color:#f2f2f2;white-space:nowrap`,
      },
      h('span', { text: '$', style: `color:${C.brand}` }),
      h('span', { text: 'npx @open-slide/cli init' }),
      h(
        'span',
        { style: 'color:rgb(255 255 255 / 0.45);display:flex' },
        icon('copy', { size: 30 }),
      ),
    );
    const url = h('div', {
      text: 'open-slide.dev',
      style: `position:absolute;left:0;right:0;top:846px;text-align:center;font-family:${FONT.sans};font-size:44px;font-weight:600;letter-spacing:-0.02em;color:#f6f6f6`,
    });
    const sparks = Array.from({ length: 36 }, (_, i) => {
      const el = h('div', {
        style: `position:absolute;left:960px;top:432px;width:${3 + (i % 3)}px;height:${3 + (i % 3)}px;border-radius:50%;background:${i % 4 === 0 ? '#fff' : C.brand};opacity:0`,
      });
      return {
        el,
        a: hash(i * 7 + 1) * Math.PI * 2,
        d: 300 + hash(i * 13 + 5) * 700,
        s: 0.6 + hash(i * 3 + 2) * 0.8,
      };
    });
    const black = h('div', { class: 'fill', style: 'background:#000;opacity:0;z-index:50' });
    root.append(wall, cool, bloom, lockup, ...sparks.map((sp) => sp.el), cmd, url, black);

    return {
      wall,
      tiles,
      bloom,
      cool,
      mark,
      chars,
      badge,
      lockup,
      cmd,
      url,
      sparks,
      black,
      lw: lockup.offsetWidth,
      lh: lockup.offsetHeight,
      cw: cmd.offsetWidth,
    };
  },
  update(s, _t, Tm) {
    const burst = prog(Tm, T.burst, 0.55, inCubic);
    const [rx, rz, z, x] = keys(Tm, [
      [66.15, [34, -12, -700, 240]],
      [T.wave, [26, -8, -260, -60], glide],
      [T.burst, [18, -4, -120, -120], (v) => v],
    ]);
    set(s.wall, {
      transform: `translate3d(${x}px, 20px, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg)`,
      display: Tm >= HIT ? 'none' : 'block',
    });
    s.tiles.forEach((tile, i) => {
      const p = prog(Tm, T.tiles + i * T.step, 0.5, outExpo);
      const wave = envelope(
        Tm,
        T.wave + (tile.col + tile.row) * 0.07,
        T.wave + (tile.col + tile.row) * 0.07 + 0.55,
        0.12,
        0.4,
      );
      const ang = Math.atan2(tile.row - 1, tile.col - 1.5);
      const fly = burst * 1600;
      set(tile.el, {
        opacity: p > 0 ? 1 : 0,
        transform: `translate3d(${Math.cos(ang) * fly}px, ${Math.sin(ang) * fly}px, ${burst * 900 + wave * 40}px) rotateX(${(1 - p) * -95}deg)`,
      });
      set(tile.ring, { opacity: Math.max(wave, (T.wave + 0.6 <= Tm ? 0.25 : 0) * (1 - burst)) });
    });

    const post = Tm >= HIT;
    s.mark.darts.forEach((g, i) => {
      const land = HIT - 0.05 + [0.12, 0.08, 0.04, 0][i];
      const p = clamp((Tm - (land - 0.4)) / 0.4);
      const dx = -2200 * (1 - snap(p));
      attr(g, 'transform', `translate(${dx.toFixed(1)} 0)`);
      attr(g, 'opacity', Tm < land - 0.4 ? 0 : 1);
    });
    attr(s.mark.glow, 'opacity', (0.4 + impulse(Tm, HIT, 0.5) * 0.6).toFixed(3));
    attr(
      s.mark.sheen,
      'transform',
      `translate(${(prog(Tm, T.sheen, 1.0, inQuad) * 840 - 200).toFixed(1)} 0)`,
    );
    s.chars.forEach((c, i) => {
      const p = prog(Tm, HIT + 0.02 + i * 0.022, 0.6, outExpo);
      set(c.inner, { transform: `translateX(${(1 - p) * -105}%)`, opacity: p > 0 ? 1 : 0 });
    });
    const bp = prog(Tm, T.word, 0.4, outExpo);
    set(s.badge, {
      opacity: Tm >= T.word ? 1 : 0,
      transform: `scale(${2.2 - 1.2 * bp}) rotate(${-8 * (1 - bp)}deg)`,
    });
    const push = prog(Tm, HIT, 7, (v) => v);
    set(s.lockup, {
      transform: `translate(${-s.lw / 2}px, ${-s.lh / 2}px) scale(${0.96 + push * 0.05})`,
      opacity: post ? 1 : 0,
    });
    const cp = prog(Tm, T.cmd, 0.6, outExpo);
    set(s.cmd, { opacity: cp, transform: `translate(${-s.cw / 2}px, ${(1 - cp) * 26}px)` });
    const up = prog(Tm, T.url, 0.6, outExpo);
    set(s.url, { opacity: up, transform: `translateY(${(1 - up) * 20}px)` });
    set(s.bloom, { opacity: post ? 0.3 + impulse(Tm, HIT, 0.4) * 0.7 : burst * 0.6 });
    set(s.cool, { opacity: post ? 0.8 : 0 });
    s.sparks.forEach((sp) => {
      const p = prog(Tm, HIT, 1.4 * sp.s, outExpo);
      const d = sp.d * p;
      set(sp.el, {
        opacity: post ? (1 - p) * 0.9 : 0,
        transform: `translate(${Math.cos(sp.a) * d}px, ${Math.sin(sp.a) * d * 0.6}px)`,
      });
    });
    set(s.black, { opacity: prog(Tm, T.fade, 1.3, swift) });
  },
});
