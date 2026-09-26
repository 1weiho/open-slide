import { envelope, keys, prog } from '#lib/anim.js';
import { h, set, split, text } from '#lib/dom.js';
import { clamp, glide, inCubic, lerp, outBack, outExpo, snap, spring, swift } from '#lib/ease.js';
import { scramble } from '#lib/fx.js';
import { route } from '#lib/route.js';
import { defineScene, rectIn } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { cursor } from '#ui/cursor.js';
import { downloadMenu, exportToast, fileTile, toolbarFragment } from '#ui/export.js';
import { icon } from '#ui/icons.js';
import { LAYOUT, launchSlide } from '#ui/launch-slide.js';
import { SPANS } from '../timeline.js';

const T = {
  tag: 28.35,
  menuClick: 29.05,
  hoverPptx: 29.45,
  pick: 29.72,
  toast: 29.8,
  build: 30.95,
  done: 31.35,
  toastOut: 31.95,
  explode: 30.0,
  labels: 30.35,
  checks: [31.95, 32.45, 32.95, 33.45],
  collapse: 33.95,
  intoFile: 34.45,
  fileLand: 34.62,
  open: 35.55,
  selHead: 36.35,
  caret: 36.7,
  typeBang: 37.05,
  selPill: 37.95,
  captions: [36.2, 37.6],
  final: 40.35,
};

const PRES = { cx: 1270, cy: 432, scale: 0.9 * 0.78 };

const FINAL = {
  headOffset: [0, 0],
  imgW: LAYOUT.img.w1,
  imgH: LAYOUT.img.h1,
  wordValue: 'story.',
  wordColor: 'oklch(0.6 0.2 25)',
};

const OOXML = {
  bg: '<p:bg> srgbClr F6F3EC',
  rule: '<p:sp> prstGeom rect',
  eyebrow: '<a:t>LAUNCH — 2026</a:t>',
  head: '<p:sp> txBody sz="9500"',
  sub: '<p:sp> txBody sz="2300"',
  img: '<p:pic> <a:srcRect/>',
  pill: '<p:sp> roundRect adj=50000',
  folio: '<a:t>01 / 06</a:t>',
};
const ZS = { bg: 0, rule: 90, folio: 140, img: 280, sub: 400, eyebrow: 500, pill: 590, head: 700 };
const ORDER = ['bg', 'rule', 'folio', 'img', 'sub', 'eyebrow', 'pill', 'head'];

const PANE = [
  'Text: Ship the story.',
  'Rounded Rectangle',
  'Text: LAUNCH — 2026',
  'Text: Drafted by your agent. Finished…',
  'Image: hero',
  'Text: 01 / 06',
  'Rectangle',
];

function presWindow() {
  const slide = launchSlide();
  slide.update(FINAL);
  const k = 0.5;
  const slideBox = h(
    'div',
    {
      style: `position:absolute;left:216px;top:130px;width:${1920 * k}px;height:${1080 * k}px;box-shadow:0 2px 12px rgb(0 0 0 / 0.18);overflow:hidden`,
    },
    h(
      'div',
      { style: `position:absolute;left:0;top:0;transform:scale(${k});transform-origin:0 0` },
      slide.root,
    ),
  );
  const btn = (name) =>
    h(
      'div',
      {
        style:
          'width:34px;height:34px;border-radius:7px;display:grid;place-items:center;color:#3a3a3a',
      },
      icon(name, { size: 18 }),
    );
  const thumbs = h(
    'div',
    { style: 'position:absolute;left:18px;top:130px;display:flex;flex-direction:column;gap:14px' },
    [0, 1, 2, 3].map((i) =>
      h(
        'div',
        { style: 'display:flex;gap:8px;align-items:flex-start' },
        h('span', { text: String(i + 1), style: 'font-size:12px;color:#777;width:10px' }),
        h('div', {
          style: `width:150px;height:84px;border-radius:3px;background:${['#f6f3ec', '#0b0b0c', '#ff4f1a', '#f4f1ea'][i]};box-shadow:0 0 0 ${i === 0 ? 2 : 1}px ${i === 0 ? '#c75b2a' : 'rgb(0 0 0 / 0.12)'}`,
        }),
      ),
    ),
  );
  const paneItems = PANE.map((label, i) =>
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-radius:6px;font-size:14px;color:#2a2a2a;${i === 0 ? 'background:#e2e2e2' : ''}`,
      },
      icon(i === 4 ? 'image' : i === 1 || i === 6 ? 'box' : 'type', { size: 15 }),
      h('span', {
        text: label,
        style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
      }),
    ),
  );
  const pane = h(
    'div',
    {
      style:
        'position:absolute;right:0;top:92px;bottom:0;width:300px;padding:18px 14px;border-left:1px solid #dcdcdc;background:#f7f7f7',
    },
    h('div', {
      text: 'Selection',
      style: 'font-size:15px;font-weight:600;color:#1d1d1d;padding:0 12px 12px',
    }),
    paneItems,
  );
  const el = h(
    'div',
    {
      style:
        'position:absolute;left:0;top:0;width:1500px;height:800px;border-radius:14px;overflow:hidden;background:#e9e9e9;box-shadow:0 0 0 1px rgb(255 255 255 / 0.1), 0 60px 120px -30px rgb(0 0 0 / 0.7);font-family:Geist, system-ui, sans-serif;transform-origin:50% 50%;color:#1d1d1d',
    },
    h(
      'div',
      {
        style:
          'height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;background:#dedede;position:relative',
      },
      ['#ff5f57', '#febc2e', '#28c840'].map((c) =>
        h('div', { style: `width:12px;height:12px;border-radius:50%;background:${c}` }),
      ),
      h('div', {
        text: 'launch-day.pptx',
        style:
          'position:absolute;left:50%;transform:translateX(-50%);font-size:14px;font-weight:500;color:#333',
      }),
    ),
    h(
      'div',
      {
        style:
          'height:52px;display:flex;align-items:center;gap:4px;padding:0 16px;background:#f2f2f2;border-bottom:1px solid #d6d6d6',
      },
      [
        'type',
        'box',
        'image',
        'layers',
        'align-left',
        'align-center',
        'bold',
        'italic',
        'palette',
      ].map(btn),
      h('div', { style: 'flex:1' }),
      h('div', { text: 'Slide 1 of 6', style: 'font-size:13px;color:#666;padding-right:300px' }),
    ),
    thumbs,
    slideBox,
    pane,
  );
  const selBox = h('div', {
    style:
      'position:absolute;left:0;top:0;border:1.5px solid #8c8c8c;pointer-events:none;opacity:0',
  });
  const handles = Array.from({ length: 8 }, () =>
    h('div', {
      style:
        'position:absolute;left:0;top:0;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:#fff;border:1.5px solid #8c8c8c;opacity:0',
    }),
  );
  const caret = h('div', {
    style: 'position:absolute;left:0;top:0;width:3px;background:#1a1a1a;opacity:0',
  });
  el.append(selBox, ...handles, caret);
  return { el, slide, k, slideOrigin: [216, 130], selBox, handles, caret, paneItems };
}

export default defineScene({
  name: 'pptx',
  span: SPANS.pptx,
  sfx: [
    [T.menuClick, 'click', 1],
    [T.menuClick + 0.02, 'pop', 0.5],
    [T.hoverPptx, 'tick', 0.4],
    [T.pick, 'click', 1],
    [T.toast, 'pop', 0.6],
    [T.explode, 'impact', 0.75],
    ...ORDER.map((_, i) => [T.labels + i * 0.07, 'blip', 0.35]),
    ...T.checks.map((t) => [t, 'check', 0.7]),
    [T.done, 'success', 0.7],
    [T.collapse, 'suck', 0.9],
    [T.fileLand, 'thud', 0.9],
    [T.open, 'whoosh', 0.8],
    [T.selHead, 'click', 0.9],
    [T.caret, 'click', 0.7],
    [T.typeBang, 'type', 1],
    [T.selPill, 'click', 0.9],
    [T.final, 'swell', 0.6],
  ],
  build(root) {
    set(root, {
      background: 'radial-gradient(90% 80% at 50% 45%, #17171a 0%, #09090a 70%, #050505 100%)',
      perspective: '3600px',
    });
    const grid = h('div', {
      class: 'fill',
      style:
        'background-image:linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px),linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px);background-size:80px 80px;mask-image:radial-gradient(70% 70% at 50% 50%, #000, transparent)',
    });
    const glow = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(40% 50% at 50% 55%, oklch(0.6 0.2 25 / 0.22), transparent 70%);opacity:0',
    });

    const stage = h('div', { class: 'abs preserve', style: 'left:960px;top:540px' });
    const slide = launchSlide();
    slide.update(FINAL);
    const slideWrap = h('div', { class: 'abs preserve' }, slide.root);
    stage.append(slideWrap);
    const labels = {};
    const anchors = {};
    const labelLayer = h('div', { class: 'fill', style: 'z-index:30' });
    for (const name of ORDER) {
      const anchor = h('div', {
        style: `position:absolute;left:${name === 'bg' ? 1800 : 0}px;top:${name === 'bg' ? 60 : 0}px;width:0;height:0`,
      });
      slide.layers[name].append(anchor);
      anchors[name] = anchor;
      const el = h(
        'div',
        {
          style:
            'position:absolute;left:0;top:0;display:flex;align-items:center;gap:10px;opacity:0',
        },
        h('span', {
          style: `width:10px;height:10px;border-radius:50%;background:${C.brand};box-shadow:0 0 0 4px oklch(0.6 0.2 25 / 0.25);flex:none`,
        }),
        h('span', {
          class: 'mono txt',
          style:
            'padding:7px 12px;border-radius:7px;background:rgb(12 12 12 / 0.9);color:#f2f2f2;font-size:19px;white-space:nowrap;box-shadow:0 0 0 1px rgb(255 255 255 / 0.12)',
        }),
      );
      labelLayer.append(el);
      labels[name] = el;
    }

    const tb = toolbarFragment();
    const menu = downloadMenu();
    const toast = exportToast();
    const fileEl = fileTile('launch-day.pptx');
    const pres = presWindow();
    const presWrap = h(
      'div',
      { class: 'abs', style: 'width:1500px;height:800px;opacity:0' },
      pres.el,
    );

    const tag = h(
      'div',
      {
        class: 'mono',
        style: `position:absolute;left:120px;top:96px;display:flex;gap:14px;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:${C.brand};z-index:40`,
      },
      h('span', { text: '02' }),
      h('span', { text: '—' }),
      h('span', { text: 'Editable PPTX' }),
    );

    const checks = h(
      'div',
      {
        style: `position:absolute;left:120px;top:250px;display:flex;flex-direction:column;gap:22px;font-family:${FONT.sans};z-index:40`,
      },
      h('div', {
        text: 'Every page becomes',
        style:
          'font-size:34px;color:rgb(255 255 255 / 0.55);font-weight:500;letter-spacing:-0.02em;margin-bottom:6px',
      }),
      ['Text boxes', 'Shapes', 'Pictures', 'Speaker notes'].map((label) =>
        h(
          'div',
          {
            class: 'chk',
            style:
              'display:flex;align-items:center;gap:20px;font-size:64px;font-weight:700;letter-spacing:-0.045em;color:#f6f6f6;line-height:1',
          },
          h(
            'span',
            {
              style: `width:52px;height:52px;border-radius:14px;background:${C.brand};display:grid;place-items:center;flex:none`,
            },
            icon('check', { size: 34, stroke: 3, color: '#fff' }),
          ),
          label,
        ),
      ),
    );
    const checkRows = [...checks.querySelectorAll('.chk')];
    const eyebrowIntro = checks.firstChild;

    const units = h('div', {
      class: 'mono',
      style:
        'position:absolute;left:120px;bottom:90px;font-size:24px;color:rgb(255 255 255 / 0.6);letter-spacing:0.02em;z-index:40;white-space:nowrap',
    });

    const captionA = h('div', {
      style: `position:absolute;left:120px;top:800px;font-family:${FONT.sans};font-size:92px;font-weight:700;letter-spacing:-0.05em;line-height:1;color:#f6f6f6;z-index:40;white-space:nowrap`,
    });
    const capA = split(captionA, 'Text stays text.', { by: 'word', mask: true });
    const captionB = h('div', {
      style: `position:absolute;left:120px;top:906px;font-family:${FONT.sans};font-size:92px;font-weight:700;letter-spacing:-0.05em;line-height:1;color:${C.brand};z-index:40;white-space:nowrap`,
    });
    const capB = split(captionB, 'Shapes stay shapes.', { by: 'word', mask: true });

    const finalBox = h(
      'div',
      {
        style: `position:absolute;left:0;right:0;top:300px;text-align:center;font-family:${FONT.sans};z-index:45`,
      },
      h('div', {
        class: 'f1',
        style:
          'font-size:136px;font-weight:700;letter-spacing:-0.055em;line-height:1.02;color:#f6f6f6;white-space:nowrap',
      }),
      h('div', {
        class: 'mono f2',
        style:
          'margin-top:40px;font-size:30px;letter-spacing:0.14em;text-transform:uppercase;color:rgb(255 255 255 / 0.6)',
      }),
    );
    const f1 = finalBox.querySelector('.f1');
    const f1w = [
      ...split(f1, 'No server.', { by: 'word', mask: true }),
      h('br'),
      ...split(f1, 'No headless browser.', { by: 'word', mask: true }),
    ].filter((w) => w.inner);
    f1.insertBefore(h('br'), f1.children[2]);
    const f2 = finalBox.querySelector('.f2');

    const cur = cursor({ size: 40 });
    root.append(
      grid,
      glow,
      stage,
      labelLayer,
      presWrap,
      fileEl,
      tb.el,
      menu.el,
      toast.el,
      tag,
      checks,
      units,
      captionA,
      captionB,
      finalBox,
      cur.el,
    );
    return {
      stage,
      slide,
      slideWrap,
      labels,
      anchors,
      root,
      tb,
      menu,
      toast,
      fileEl,
      pres,
      presWrap,
      tag,
      checkRows,
      eyebrowIntro,
      units,
      capA,
      capB,
      f1w,
      f2,
      cur,
      glow,
      route: null,
    };
  },
  update(s, _t, Tm) {
    const TB = { x: 1040, y: 150, k: 1.7 };
    set(s.tb.el, {
      transform: `translate(${TB.x}px, ${TB.y - (1 - prog(Tm, 28.3, 0.6, swift)) * 30}px) scale(${TB.k})`,
      opacity: prog(Tm, 28.3, 0.4) * (1 - prog(Tm, T.explode - 0.1, 0.3)),
    });
    const dlX = TB.x + (s.tb.download.offsetLeft + 14) * TB.k;
    const dlY = TB.y + (s.tb.download.offsetTop + 14) * TB.k;
    const menuP =
      Tm >= T.menuClick && Tm < T.pick + 0.12 ? prog(Tm, T.menuClick + 0.02, 0.22, swift) : 0;
    const menuW = s.menu.el.offsetWidth;
    set(s.menu.el, {
      transform: `translate(${dlX + 20 * TB.k - menuW * TB.k}px, ${dlY + 22 * TB.k + (1 - menuP) * -10}px) scale(${TB.k * (0.96 + 0.04 * menuP)})`,
      opacity: menuP,
      transformOrigin: '100% 0',
    });
    const menuItem = (i) => {
      const it = s.menu.items[i];
      return [
        dlX + 20 * TB.k - menuW * TB.k + (it.offsetLeft + 60) * TB.k,
        dlY + 22 * TB.k + (it.offsetTop + 15) * TB.k,
      ];
    };
    s.menu.items.forEach((it, i) => {
      const hot =
        (i === 0 && Tm >= T.menuClick + 0.1 && Tm < T.hoverPptx - 0.1) ||
        (i === 2 && Tm >= T.hoverPptx);
      set(it, { background: hot ? 'oklch(0.955 0 0)' : 'transparent' });
    });

    const toastIn = prog(Tm, T.toast, 0.3, swift) * (1 - prog(Tm, T.toastOut, 0.3, inCubic));
    set(s.toast.el, {
      transform: `translate(${1880 - 320 * 1.5}px, ${1000 - 110 + (1 - toastIn) * 24}px) scale(1.5)`,
      transformOrigin: '0 0',
      opacity: toastIn,
    });
    const renderP = clamp((Tm - T.toast - 0.1) / (T.build - T.toast - 0.1));
    const page = Math.min(6, Math.floor(renderP * 6) + 1);
    s.toast.update(Tm, {
      page,
      total: 6,
      phase: Tm < T.build ? 'render' : Tm < T.done ? 'build' : 'done',
      progress: Tm < T.build ? (page / 6) * 95 : Tm < T.done ? 98 : 100,
    });

    const ex = swift(clamp((Tm - T.explode) / 1.0));
    const col = glide(clamp((Tm - T.collapse) / 0.6));
    const explode = ex * (1 - col);
    const ry = keys(Tm, [
      [28.25, -6],
      [T.explode, -8],
      [T.explode + 1.1, 40, swift],
      [T.collapse, 30, (x) => x],
      [T.collapse + 0.6, 0, glide],
    ]);
    const rx = keys(Tm, [
      [28.25, 4],
      [T.explode + 1.1, 10, swift],
      [T.collapse, 8, (x) => x],
      [T.collapse + 0.6, 0, glide],
    ]);
    const baseScale = keys(Tm, [
      [28.25, 0.56],
      [29.0, 0.6, swift],
      [T.explode, 0.6],
      [T.explode + 1.1, 0.5, swift],
      [T.collapse, 0.52, (x) => x],
      [T.intoFile, 0.12, inCubic],
    ]);
    const sx = keys(Tm, [
      [28.25, -30],
      [T.explode, -30],
      [T.explode + 1.1, 290, swift],
      [T.collapse, 270, (x) => x],
      [T.intoFile, 0, glide],
    ]);
    const sy = keys(Tm, [
      [28.25, 60],
      [T.explode + 1.1, 10, swift],
      [T.collapse, 10, (x) => x],
      [T.intoFile, -20, glide],
    ]);
    const intoFile = prog(Tm, T.intoFile - 0.12, 0.22);
    set(s.slideWrap, {
      transform: `translate3d(${sx}px, ${sy}px, 0) rotateY(${ry}deg) rotateX(${rx}deg) scale(${baseScale}) translate(-960px, -540px)`,
      opacity: prog(Tm, 28.25, 0.3) * (1 - intoFile),
    });
    s.slide.update({
      ...FINAL,
      explode,
      z: ZS,
    });
    ORDER.forEach((name, i) => {
      const el = s.labels[name];
      const t0 = T.labels + i * 0.07;
      const p = prog(Tm, t0, 0.3) * (1 - prog(Tm, T.collapse - 0.15, 0.2));
      if (p <= 0) {
        set(el, { opacity: 0 });
        return;
      }
      const a = rectIn(s.anchors[name], s.root);
      set(el, {
        opacity: p,
        transform: `translate(${a.x - 5}px, ${a.y - 5 - (1 - p) * 12}px)`,
      });
      text(el.lastChild, scramble(OOXML[name], Tm, t0, 0.5, i + 3));
    });
    set(s.glow, {
      opacity: 0.6 * explode + 0.4 * envelope(Tm, T.fileLand - 0.1, T.open + 0.4, 0.1, 0.4),
    });

    set(s.eyebrowIntro, {
      opacity: prog(Tm, T.checks[0] - 0.25, 0.3) * (1 - prog(Tm, T.collapse, 0.3)),
    });
    s.checkRows.forEach((el, i) => {
      const p = prog(Tm, T.checks[i], 0.45, outExpo);
      const out = prog(Tm, T.collapse + i * 0.03, 0.3, inCubic);
      set(el, {
        opacity: p * (1 - out),
        transform: `translateX(${(1 - p) * -40 - out * 40}px)`,
      });
      set(el.firstChild, { transform: `scale(${outBack(2.4)(prog(Tm, T.checks[i], 0.35))})` });
    });
    text(
      s.units,
      scramble('1 px = 6,350 EMU  ·  1920 × 1080 px → 13.333 × 7.5 in', Tm, T.checks[0], 0.9, 9),
    );
    set(s.units, { opacity: 1 - prog(Tm, T.collapse, 0.3) });

    const fileIn = prog(Tm, T.intoFile - 0.2, 0.3, snap);
    const fileLand = spring(Tm - T.intoFile + 0.15, { stiffness: 260, damping: 17 });
    const fileOut = prog(Tm, T.open, 0.55, inCubic);
    set(s.fileEl, {
      transform: `translate(${960 - 150}px, ${540 - 210}px) scale(${(0.4 + 0.6 * fileLand) * (1 + fileOut * 3)}) rotate(${(1 - fileIn) * -12}deg)`,
      opacity: fileIn * (1 - prog(Tm, T.open + 0.2, 0.3)),
    });

    const presIn = prog(Tm, T.open + 0.05, 0.7, outExpo);
    const settle = prog(Tm, T.open + 0.3, 0.5, glide);
    const presCx = lerp(960, PRES.cx, settle);
    const presCy = lerp(520, PRES.cy, settle);
    const presScale = (0.55 + 0.35 * presIn) * lerp(1, PRES.scale / 0.9, settle);
    set(s.presWrap, {
      opacity: presIn * (1 - prog(Tm, T.final - 0.1, 0.35)),
      transform: `translate(${presCx - 750}px, ${presCy - 400}px) scale(${presScale}) rotateX(${(1 - presIn) * 20}deg)`,
      transformOrigin: '50% 50%',
    });

    const P = s.pres;
    const slideR = (name) => {
      const r = P.slide.rect(name, FINAL);
      return {
        x: P.slideOrigin[0] + r.x * P.k,
        y: P.slideOrigin[1] + r.y * P.k,
        w: r.w * P.k,
        h: r.h * P.k,
      };
    };
    const selTarget = Tm >= T.selPill ? slideR('pill') : slideR('head');
    const selOn = Tm >= T.selHead && Tm < T.final;
    set(P.selBox, {
      opacity: selOn ? 1 : 0,
      transform: `translate(${selTarget.x - 6}px, ${selTarget.y - 6}px)`,
      width: selTarget.w + 12,
      height: selTarget.h + 12,
    });
    const hp = [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 0.5],
      [1, 1],
      [0.5, 1],
      [0, 1],
      [0, 0.5],
    ];
    P.handles.forEach((el, i) => {
      set(el, {
        opacity: selOn && !(Tm >= T.caret && Tm < T.selPill) ? 1 : 0,
        transform: `translate(${selTarget.x - 6 + (selTarget.w + 12) * hp[i][0]}px, ${selTarget.y - 6 + (selTarget.h + 12) * hp[i][1]}px)`,
      });
    });
    const typed = Tm >= T.typeBang;
    P.slide.update({ ...FINAL, wordValue: typed ? 'story!' : 'story.' });
    const wordEl = P.slide.word;
    const head = P.slide.rect('head', FINAL);
    const caretX = P.slideOrigin[0] + (head.x + wordEl.offsetLeft + wordEl.offsetWidth + 6) * P.k;
    const caretY = P.slideOrigin[1] + (head.y + wordEl.offsetTop + 20) * P.k;
    const caretOn = Tm >= T.caret && Tm < T.selPill && Math.floor((Tm - T.caret) * 3) % 2 === 0;
    set(P.caret, {
      opacity: caretOn || (Tm >= T.typeBang && Tm < T.typeBang + 0.3) ? 1 : 0,
      transform: `translate(${caretX}px, ${caretY}px)`,
      height: 150 * P.k,
    });
    P.paneItems.forEach((el, i) => {
      const active = (i === 0 && Tm < T.selPill) || (i === 1 && Tm >= T.selPill);
      set(el, { background: selOn && active ? '#dcdcdc' : 'transparent' });
    });
    text(P.paneItems[0].lastChild, typed ? 'Text: Ship the story!' : 'Text: Ship the story.');

    const toScreen = ([x, y]) => [
      PRES.cx + (x - 750) * PRES.scale,
      PRES.cy + (y - 400) * PRES.scale,
    ];
    if (!s.route) {
      s.route = route(
        [1500, 1100],
        [
          { at: T.menuClick, dur: 0.45, to: () => [dlX, dlY], bend: -0.15 },
          { at: T.hoverPptx, dur: 0.3, to: () => menuItem(2) },
          { at: T.pick, dur: 0.1, to: () => menuItem(2) },
          { at: T.explode + 0.4, dur: 0.5, to: () => [menuItem(2)[0] + 240, menuItem(2)[1] + 380] },
          {
            at: T.selHead,
            dur: 0.6,
            to: () => toScreen([slideR('head').x + 150, slideR('head').y + 120]),
          },
          {
            at: T.caret,
            dur: 0.25,
            to: () => {
              const hr = slideR('head');
              return toScreen([hr.x + hr.w * 0.62, hr.y + hr.h * 0.78]);
            },
          },
          {
            at: T.selPill,
            dur: 0.5,
            to: () => toScreen([slideR('pill').x + 60, slideR('pill').y + 14]),
          },
          {
            at: T.final,
            dur: 0.6,
            to: () => toScreen([slideR('pill').x + 260, slideR('pill').y + 240]),
          },
        ],
      );
    }
    const [cx, cy] = s.route(Tm);
    const vis =
      (Tm >= 28.6 && Tm < T.explode + 0.5) || (Tm >= T.open + 0.5 && Tm < T.final + 0.2) ? 1 : 0;
    s.cur.update(Tm, {
      x: cx,
      y: cy,
      opacity: vis,
      clicks: [T.menuClick, T.pick, T.selHead, T.caret, T.selPill],
      beam: Tm >= T.caret - 0.1 && Tm < T.selPill - 0.3 ? 1 : 0,
    });

    set(s.tag, { opacity: prog(Tm, T.tag, 0.4) * (1 - prog(Tm, T.final - 0.2, 0.3)) });
    s.capA.forEach((w, i) => {
      const p = prog(Tm, T.captions[0] + i * 0.07, 0.8, snap);
      set(w.inner, { transform: `translateY(${(1 - p) * 110}%)` });
    });
    s.capB.forEach((w, i) => {
      const p = prog(Tm, T.captions[1] + i * 0.07, 0.8, snap);
      set(w.inner, { transform: `translateY(${(1 - p) * 110}%)` });
    });
    const capOut = prog(Tm, T.final - 0.2, 0.35, inCubic);
    set(s.capA[0].el.parentElement, { opacity: 1 - capOut });
    set(s.capB[0].el.parentElement, { opacity: 1 - capOut });

    s.f1w.forEach((w, i) => {
      const p = prog(Tm, T.final + 0.1 + i * 0.08, 0.8, snap);
      set(w.inner, { transform: `translateY(${(1 - p) * 110}%)` });
    });
    text(s.f2, scramble('Runs entirely in your browser', Tm, T.final + 0.6, 0.7, 21));
  },
});
