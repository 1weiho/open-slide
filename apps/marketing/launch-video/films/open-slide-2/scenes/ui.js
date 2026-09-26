import { envelope, keys, prog } from '#lib/anim.js';
import { h, set } from '#lib/dom.js';
import { clamp, glide, inCubic, outExpo, snap, swift } from '#lib/ease.js';
import { route } from '#lib/route.js';
import { defineScene, rectIn } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { cursor } from '#ui/cursor.js';
import { commandMenu, HOME, homeView } from '#ui/home.js';
import { SPANS } from '../timeline.js';

const WX = 160;
const WY = 70;

const T = {
  tag: 42.3,
  ground: 42.35,
  side: 42.55,
  content: 42.75,
  cards: 43.05,
  labels: 43.25,
  flatten: 43.85,
  flat: 44.65,
  hoverThemes: 45.05,
  search: 45.55,
  menu: 45.62,
  type: 45.85,
  close: 46.85,
  theme: 47.6,
  reveal: 47.65,
  glide: 48.4,
  hovers: [48.9, 49.35, 49.8, 50.25, 50.7],
  dim: 51.45,
  words: [52.0, 52.5, 53.0],
};

const TYPED = 'launch';
const WORDS = ['Quieter.', 'Sharper.', 'Out of your way.'];

function callout(label) {
  const el = h(
    'div',
    {
      style:
        'position:absolute;left:0;top:0;display:flex;align-items:center;gap:12px;opacity:0;z-index:30',
    },
    h('span', {
      style: `width:12px;height:12px;border-radius:50%;background:${C.brand};box-shadow:0 0 0 5px oklch(0.6 0.2 25 / 0.22)`,
    }),
    h('span', { style: `width:44px;height:1.5px;background:${C.brand}` }),
    h('span', {
      text: label,
      style: `padding:10px 16px;border-radius:10px;background:#0a0a0a;color:#fff;font-family:${FONT.sans};font-size:26px;font-weight:600;letter-spacing:-0.02em;white-space:nowrap`,
    }),
  );
  return el;
}

export default defineScene({
  name: 'ui',
  span: SPANS.ui,
  sfx: [
    [T.ground, 'swell', 0.5],
    [T.side, 'whoosh', 0.6],
    [T.content, 'whoosh', 0.6],
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [T.cards + i * 0.05, 'tick', 0.35]),
    ...[0, 1, 2].map((i) => [T.labels + i * 0.14, 'blip', 0.5]),
    [T.flatten + 0.75, 'thud', 0.6],
    [T.search, 'click', 1],
    [T.menu, 'pop', 0.6],
    ...Array.from(TYPED).map((_, i) => [T.type + i * 0.085, 'type', 0.7]),
    [T.close, 'tick', 0.5],
    [T.theme, 'click', 1],
    [T.reveal, 'reveal', 1],
    ...T.hovers.map((t) => [t, 'tick', 0.3]),
    [T.dim, 'swell', 0.5],
    ...T.words.map((t) => [t, 'slam', 0.9]),
  ],
  build(root) {
    set(root, {
      background:
        'radial-gradient(120% 100% at 50% 15%, oklch(0.985 0 0) 0%, oklch(0.93 0 0) 70%, oklch(0.88 0 0) 100%)',
      perspective: '3000px',
    });
    const darkBg = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(120% 100% at 50% 15%, #1a1a1c 0%, #0b0b0c 70%, #050505 100%)',
    });
    const cam = h('div', {
      class: 'abs preserve',
      style: 'width:1920px;height:1080px;transform-origin:0 0',
    });
    const light = homeView();
    const dark = homeView({ dark: true });
    const win = h(
      'div',
      {
        class: 'abs preserve',
        style: `width:${HOME.w}px;height:${HOME.h}px;transform-origin:${HOME.w / 2}px ${HOME.h / 2}px`,
      },
      light.el,
    );
    const darkWrap = h(
      'div',
      { class: 'abs', style: `width:${HOME.w}px;height:${HOME.h}px;clip-path:circle(0px at 0 0)` },
      dark.el,
    );
    const backdrop = h('div', {
      class: 'abs',
      style: `width:${HOME.w}px;height:${HOME.h}px;border-radius:14px;background:rgb(20 20 20 / 0.28);opacity:0`,
    });
    const menu = commandMenu();
    const overlay = h('div', { class: 'abs', style: `width:${HOME.w}px;height:${HOME.h}px` });
    const cur = cursor();
    overlay.append(backdrop, menu.el, cur.el);
    win.append(darkWrap, overlay);
    cam.append(win);

    const anchors = {
      shell: h('div', { style: 'position:absolute;left:6px;top:760px;width:0;height:0' }),
      search: h('div', { style: 'position:absolute;left:240px;top:16px;width:0;height:0' }),
      cards: h('div', { style: 'position:absolute;right:30px;top:40px;width:0;height:0' }),
    };
    light.ground.append(anchors.shell);
    light.search.style.position = 'relative';
    light.search.append(anchors.search);
    light.content.append(anchors.cards);
    const labels = {
      shell: callout('Inset shell'),
      search: callout('Command search'),
      cards: callout('Elevated cards'),
    };

    const tag = h(
      'div',
      {
        class: 'mono',
        style: `position:absolute;left:120px;top:96px;display:flex;gap:14px;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:${C.brand};z-index:40`,
      },
      h('span', { text: '03' }),
      h('span', { text: '—' }),
      h('span', { text: 'A new UI' }),
    );
    const dim = h('div', {
      class: 'fill',
      style: 'background:rgb(6 6 6 / 0.8);opacity:0;z-index:35',
    });
    const words = WORDS.map((w, i) =>
      h('div', {
        text: w,
        style: `position:absolute;left:0;right:0;top:${250 + i * 200}px;text-align:center;font-family:${FONT.sans};font-size:${i === 2 ? 190 : 170}px;font-weight:700;letter-spacing:-0.055em;line-height:1;color:${i === 2 ? C.brand : '#f6f6f6'};z-index:36;opacity:0;white-space:nowrap`,
      }),
    );

    root.append(darkBg, cam, ...Object.values(labels), tag, dim, ...words);

    const themePos = (() => {
      const r = rectIn(light.themeBtn, light.el);
      return [r.x + r.w / 2, r.y + r.h / 2];
    })();
    const searchPos = (() => {
      const r = rectIn(light.search, light.el);
      return [r.x + 70, r.y + r.h / 2];
    })();
    const themesRow = (() => {
      const r = rectIn(light.sidebar.querySelectorAll('.nav-row')[1], light.el);
      return [r.x + 90, r.y + r.h / 2];
    })();
    const cardCenters = light.cards.map((c) => {
      const r = rectIn(c.thumb, light.el);
      return [r.x + r.w * 0.6, r.y + r.h * 0.55];
    });
    return {
      root,
      darkBg,
      cam,
      win,
      light,
      dark,
      darkWrap,
      backdrop,
      menu,
      cur,
      anchors,
      labels,
      tag,
      dim,
      words,
      themePos,
      route: route(
        [1500, 1000],
        [
          { at: T.hoverThemes, dur: 0.5, to: themesRow, bend: -0.2 },
          { at: T.search - 0.02, dur: 0.4, to: searchPos },
          { at: T.theme - 0.02, dur: 0.6, to: themePos, bend: 0.2 },
          { at: T.hovers[0], dur: 0.6, to: cardCenters[0] },
          { at: T.hovers[1], dur: 0.4, to: cardCenters[1] },
          { at: T.hovers[2], dur: 0.4, to: cardCenters[4] },
          { at: T.hovers[3], dur: 0.4, to: cardCenters[5] },
          { at: T.hovers[4], dur: 0.4, to: cardCenters[8] },
        ],
      ),
    };
  },
  update(s, _t, Tm) {
    const tiltOut = glide(clamp((Tm - T.flatten) / (T.flat - T.flatten)));
    const tilt = 1 - tiltOut;
    set(s.win, {
      transform: `translate3d(${WX}px, ${WY}px, 0) rotateX(${52 * tilt}deg) rotateZ(${-30 * tilt}deg) scale(${1 - 0.18 * tilt})`,
    });
    const g = prog(Tm, T.ground, 0.6, swift);
    set(s.light.ground, { opacity: g, transform: `scale(${0.94 + 0.06 * g})` });
    const sideP = prog(Tm, T.side, 0.7, snap);
    set(s.light.sidebar, {
      opacity: prog(Tm, T.side, 0.2),
      transform: `translate3d(${(1 - sideP) * -160}px, 0, ${(1 - sideP) * 500 + 70 * tilt}px)`,
    });
    const contP = prog(Tm, T.content, 0.75, snap);
    set(s.light.content, {
      opacity: prog(Tm, T.content, 0.2),
      transform: `translate3d(${(1 - contP) * 120}px, ${(1 - contP) * -60}px, ${(1 - contP) * 700 + 170 * tilt}px)`,
    });
    s.light.cards.forEach((c, i) => {
      const p = prog(Tm, T.cards + i * 0.05, 0.5, swift);
      const hov = T.hovers.findIndex(
        (ht, j) => [0, 1, 4, 5, 8][j] === i && Tm >= ht - 0.05 && Tm < ht + 0.4,
      );
      const lift =
        hov >= 0 ? envelope(Tm, T.hovers[hov] - 0.05, T.hovers[hov] + 0.42, 0.12, 0.2) : 0;
      set(c.card, { opacity: p, transform: `translateY(${(1 - p) * 18}px)` });
      set(s.dark.cards[i].thumb, {
        transform: `translateY(${-6 * lift}px)`,
        boxShadow:
          lift > 0
            ? `0 0 0 1px rgb(255 255 255 / ${0.07 + 0.2 * lift}), 0 ${18 * lift}px ${40 * lift}px -10px rgb(0 0 0 / ${0.6 * lift})`
            : '0 0 0 1px rgb(255 255 255 / 0.07)',
      });
    });

    for (const [k, el] of Object.entries(s.labels)) {
      const i = ['shell', 'search', 'cards'].indexOf(k);
      const p = prog(Tm, T.labels + i * 0.14, 0.4, outExpo) * (1 - prog(Tm, T.flatten - 0.1, 0.25));
      if (p <= 0) {
        set(el, { opacity: 0 });
        continue;
      }
      const a = rectIn(s.anchors[k], s.root);
      set(el, {
        opacity: p,
        transform: `translate(${a.x - 6}px, ${a.y - 6}px) scale(${0.9 + 0.1 * p})`,
      });
    }

    const menuP =
      Tm >= T.menu && Tm < T.close + 0.2
        ? prog(Tm, T.menu, 0.25, swift) * (1 - prog(Tm, T.close, 0.18))
        : 0;
    set(s.menu.el, {
      opacity: menuP,
      transform: `translate(${HOME.side + (HOME.w - HOME.side) / 2 - 290}px, ${110 + (1 - menuP) * -8}px) scale(${0.97 + 0.03 * menuP})`,
    });
    set(s.backdrop, { opacity: menuP });
    const typed = TYPED.slice(0, clamp(Math.floor((Tm - T.type) / 0.085) + 1, 0, TYPED.length));
    s.menu.update({ typed: Tm < T.type ? '' : typed, caretOn: Math.floor(Tm * 2.4) % 2 === 0 });
    const filtered = typed.length >= 3;
    const grp = s.menu.el.children[1].children;
    for (let i = 4; i < grp.length; i++) set(grp[i], { display: filtered ? 'none' : 'flex' });
    set(s.menu.items[0], { background: filtered ? 'oklch(0.955 0 0)' : 'transparent' });

    const r = keys(Tm, [
      [T.reveal, 0],
      [T.reveal + 0.75, 2100, inCubic],
    ]);
    set(s.darkWrap, { clipPath: `circle(${r}px at ${s.themePos[0]}px ${s.themePos[1]}px)` });
    set(s.darkBg, {
      opacity: prog(Tm, T.reveal + 0.1, 0.6),
    });

    const [cx, cy] = s.route(Tm);
    s.cur.update(Tm, {
      x: cx,
      y: cy,
      opacity: Tm >= 44.75 && Tm < T.dim ? 1 : 0,
      clicks: [T.search, T.theme],
    });
    set(s.cur.el, { filter: Tm >= T.reveal + 0.3 ? 'invert(1)' : 'none' });

    const cam = keys(Tm, [
      [42.25, [960, 560, 0.9, 0, 0]],
      [T.flat, [960, 540, 1.0, 0, 0], glide],
      [T.hoverThemes, [WX + 330, WY + 260, 1.55, 0, 0], glide],
      [T.search, [WX + 380, WY + 230, 1.6, 0, 0], glide],
      [T.menu + 0.3, [WX + 930, WY + 330, 1.45, 0, 0], glide],
      [T.close, [WX + 930, WY + 340, 1.5, 0, 0], (x) => x],
      [T.theme, [WX + 280, WY + 760, 1.6, 0, 0], glide],
      [T.reveal + 0.75, [WX + 520, WY + 620, 1.15, 0, 0], glide],
      [T.hovers[0], [WX + 600, WY + 330, 1.3, 16, -6], glide],
      [T.hovers[4], [WX + 1250, WY + 700, 1.35, 12, 4], glide],
      [T.dim + 0.4, [WX + 1100, WY + 600, 1.0, 20, 6], glide],
      [54.2, [WX + 1000, WY + 560, 0.95, 24, 8], (x) => x],
    ]);
    set(s.cam, {
      transform: `translate(960px, 540px) rotateX(${cam[3]}deg) rotateZ(${cam[4]}deg) scale(${cam[2]}) translate(${-cam[0]}px, ${-cam[1]}px)`,
    });

    set(s.tag, { opacity: prog(Tm, T.tag, 0.4) * (1 - prog(Tm, T.hoverThemes - 0.4, 0.3)) });
    const rows = s.light.sidebar.querySelectorAll('.nav-row');
    set(rows[1], {
      background:
        Tm >= T.hoverThemes - 0.05 && Tm < T.search - 0.25
          ? 'oklch(0.955 0 0 / 0.6)'
          : 'transparent',
    });
    set(s.dim, { opacity: prog(Tm, T.dim, 0.5) });
    s.words.forEach((el, i) => {
      const p = prog(Tm, T.words[i], 0.35, outExpo);
      set(el, {
        opacity: Tm >= T.words[i] ? 1 : 0,
        transform: `scale(${1.35 - 0.35 * p}) translateY(${(1 - p) * 10}px)`,
        filter: p < 1 ? `blur(${(1 - p) * 12}px)` : 'none',
      });
    });
  },
});
