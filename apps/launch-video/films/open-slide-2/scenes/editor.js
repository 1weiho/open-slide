import { envelope, keys, prog } from '#lib/anim.js';
import { h, set, split, text } from '#lib/dom.js';
import { clamp, glide, inCubic, lerp, outCubic, snap, spring, swift } from '#lib/ease.js';
import { route } from '#lib/route.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT, SHADOW } from '#theme';
import { slideViewer, WIN } from '#ui/app.js';
import { codeEditor } from '#ui/code.js';
import { cursor } from '#ui/cursor.js';
import { icon } from '#ui/icons.js';
import { keycap } from '#ui/kit.js';
import { LAYOUT } from '#ui/launch-slide.js';
import { guides, selection } from '#ui/selection.js';
import { SPANS } from '../timeline.js';

const WX = 160;
const WY = 70;

const T = {
  title: 10.35,
  flyIn: 10.55,
  land: 12.4,
  titleOut: 11.8,
  hover: 12.72,
  click: 13.0,
  panel: 13.05,
  press: 13.55,
  snap: 14.28,
  release: 14.55,
  imgClick: 15.0,
  handle: 15.28,
  resizeEnd: 15.95,
  keyI: 16.15,
  dbl: [16.72, 16.84],
  type: 17.08,
  reselect: 17.66,
  chip: 18.0,
  pick: 18.32,
  explode: 18.65,
  front: 19.9,
  collapse: 20.45,
  save: 21.05,
  undo: 21.4,
  redo: 21.9,
  saveClick: 22.35,
  saved: 22.78,
  code: 23.35,
  diff: [24.0, 24.5, 25.0, 25.5],
  tagline: 25.9,
};

const TYPED = ['', 's', 'st', 'sto', 'stor', 'story', 'story.'];
const PALETTE = ['#0a0a0a', '#2b7fff', '#1fae6b', 'oklch(0.6 0.2 25)', '#f5b83d'];
const VERMILLION = 'oklch(0.6 0.2 25)';

const CODE = [
  { text: 'export default function LaunchDay() {' },
  { text: '  return (' },
  { text: '    <Slide>' },
  { text: '      <Eyebrow>LAUNCH — 2026</Eyebrow>' },
  { text: '      <h1 style={{' },
  { text: '        fontSize: 190,' },
  { text: "        translate: '-80px -80px'," },
  { text: '      }}>' },
  { text: "        Ship the{' '}" },
  { text: '        deck.' },
  { text: "        <span style={{ color: '#E5484D' }}>story.</span>" },
  { text: '      </h1>' },
  { text: '      <img src={hero} style={{' },
  { text: "        width: '600px', height: '750px'," },
  { text: '        borderRadius: 28,' },
  { text: '      }} />' },
  { text: "      <Pill style={{ zIndex: '3' }}>v2.0 — out now</Pill>" },
  { text: '    </Slide>' },
  { text: '  );' },
  { text: '}' },
];
CODE[6].kind = 'add';
CODE[9].kind = 'del';
CODE[10].kind = 'add';
CODE[13].kind = 'add';
CODE[16].kind = 'add';
const DIFF_ROWS = [6, [9, 10], 13, 16];

function screenKeys(labels, where = 'left:50%;bottom:92px') {
  const caps = labels.map((l) => keycap(l, { size: 84 }));
  const el = h(
    'div',
    {
      style: `position:absolute;${where};display:flex;gap:14px;transform-origin:50% 100%;z-index:60;opacity:0`,
    },
    caps,
  );
  return { el, caps };
}

function arrangeCard() {
  const item = (name, label, key) =>
    h(
      'div',
      {
        class: `ar-${key}`,
        style:
          'display:flex;align-items:center;gap:12px;height:48px;padding:0 16px;border-radius:9px;font-size:19px;color:oklch(0.145 0 0)',
      },
      icon(name, { size: 20 }),
      label,
    );
  const front = item('bring-to-front', 'Bring to front', 'front');
  const el = h(
    'div',
    {
      style: `position:absolute;left:1440px;top:320px;width:400px;padding:18px 14px;border-radius:16px;background:#fff;box-shadow:${SHADOW.overlay};font-family:${FONT.sans};opacity:0;z-index:55`,
    },
    h(
      'div',
      {
        style:
          'display:flex;align-items:center;gap:10px;padding:0 16px 10px;font-size:15px;font-weight:600;color:oklch(0.145 0 0)',
      },
      icon('move', { size: 17 }),
      'Arrange',
    ),
    h('div', {
      class: 'eyebrow',
      text: 'Layer',
      style: 'font-size:13px;padding:6px 16px 8px;color:oklch(0.5 0 0)',
    }),
    front,
    item('arrow-up', 'Bring forward', 'fwd'),
    item('arrow-down', 'Send backward', 'back'),
    item('send-to-back', 'Send to back', 'bottom'),
  );
  return { el, front };
}

function layerLabel(label) {
  return h('div', {
    class: 'mono',
    text: label,
    style:
      'position:absolute;left:0;top:-64px;padding:8px 16px;border-radius:8px;background:#0a0a0a;color:#fff;font-size:28px;white-space:nowrap;opacity:0',
  });
}

export default defineScene({
  name: 'editor',
  span: SPANS.editor,
  sfx: [
    [T.flyIn, 'whoosh', 0.7],
    [T.land, 'thud', 0.5],
    [T.click, 'click', 1],
    [T.panel, 'slide', 0.4],
    [T.press, 'grab', 0.6],
    [T.snap, 'snap', 1],
    [T.imgClick, 'click', 0.9],
    [T.handle, 'grab', 0.6],
    [T.resizeEnd, 'tick', 0.5],
    [T.keyI, 'key', 0.8],
    [T.dbl[0], 'click', 0.8],
    [T.dbl[1], 'click', 0.8],
    ...TYPED.slice(1).map((_, i) => [T.type + i * 0.085, 'type', 0.7]),
    [T.chip, 'click', 0.8],
    [T.pick, 'pop', 0.8],
    [T.explode, 'whoosh', 0.8],
    [T.explode + 0.4, 'swell', 0.6],
    [T.front, 'click', 0.9],
    [T.front + 0.05, 'rise', 0.8],
    [T.collapse, 'thud', 0.6],
    [T.save, 'pop', 0.5],
    [T.undo, 'key', 0.8],
    [T.undo + 0.02, 'rewind', 0.6],
    [T.redo, 'key', 0.8],
    [T.saveClick, 'click', 1],
    [T.saved, 'success', 0.8],
    [T.code, 'whoosh', 0.7],
    ...T.diff.map((t) => [t, 'blip', 0.7]),
  ],
  build(root) {
    set(root, {
      background:
        'radial-gradient(120% 100% at 50% 20%, oklch(0.985 0 0) 0%, oklch(0.93 0.004 80) 70%, oklch(0.88 0.006 80) 100%)',
      perspective: '2600px',
      perspectiveOrigin: '50% 50%',
    });
    const dots = h('div', {
      class: 'fill',
      style:
        'background-image:radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.07) 1px, transparent 1.4px);background-size:40px 40px',
    });
    const cam = h('div', {
      class: 'abs preserve',
      style: 'width:1920px;height:1080px;transform-origin:0 0',
    });
    const app = slideViewer();
    const winWrap = h(
      'div',
      { class: 'abs preserve', style: `transform-origin:${WIN.w / 2}px ${WIN.h / 2}px` },
      app.el,
    );
    cam.append(winWrap);

    const sel = selection();
    const gd = guides(2);
    const cur = cursor();
    const shiftCap = keycap('⇧', { size: 36 });
    shiftCap.style.position = 'absolute';
    shiftCap.style.opacity = '0';
    const palette = h(
      'div',
      {
        style: `position:absolute;left:0;top:0;display:flex;gap:8px;padding:8px;border-radius:10px;background:#fff;box-shadow:${SHADOW.floating};opacity:0`,
      },
      PALETTE.map((c) =>
        h('div', {
          style: `width:22px;height:22px;border-radius:6px;background:${c};box-shadow:inset 0 0 0 1px rgb(0 0 0 / 0.1)`,
        }),
      ),
    );
    app.overlay.append(gd.el, sel.el, palette, shiftCap, cur.el);

    const labels = {
      bg: layerLabel('background · z 0'),
      img: layerLabel('<img> · z 1'),
      head: layerLabel('<h1> · z 2'),
      pill: layerLabel('<Pill> · z 0'),
    };
    for (const [k, el] of Object.entries(labels)) app.slide.layers[k].append(el);
    set(labels.bg, { top: '40px', left: '40px' });

    const arrange = arrangeCard();
    const cur2 = cursor({ size: 40 });
    const keysI = screenKeys(['I']);
    const keysUndo = screenKeys(['⌘', 'Z']);
    const keysRedo = screenKeys(['⇧', '⌘', 'Z']);

    const code = codeEditor({ file: 'slides/launch-day/index.tsx', lines: CODE, startLine: 12 });
    const codeWrap = h('div', { class: 'abs', style: 'opacity:0' }, code.el);
    cam.append(codeWrap);

    const title = h(
      'div',
      { style: 'position:absolute;left:140px;top:250px;z-index:50' },
      h(
        'div',
        {
          class: 'mono',
          style: `display:flex;gap:14px;align-items:center;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:${C.brand};margin-bottom:26px`,
        },
        h('span', { class: 'ttag', text: '01' }),
        h('span', { class: 'ttag', text: '—' }),
        h('span', { class: 'ttag', text: 'Visual editor' }),
      ),
      ['Click it.', 'Drag it.', 'Snap it.'].map((line) =>
        h('div', {
          class: 'tline',
          'data-line': line,
          style: `font-family:${FONT.sans};font-size:140px;font-weight:700;letter-spacing:-0.055em;line-height:0.96;color:${C.ink};white-space:nowrap`,
        }),
      ),
    );
    const tw = [...title.querySelectorAll('.tline')].flatMap((el) =>
      split(el, el.dataset.line, { by: 'word', mask: true }),
    );
    tw.at(-1).inner.style.color = C.brand;
    const ttags = [...title.querySelectorAll('.ttag')];

    const tagline = h('div', {
      style: `position:absolute;left:120px;top:846px;z-index:50;font-family:${FONT.sans};font-size:92px;font-weight:700;letter-spacing:-0.05em;line-height:1;color:${C.ink};white-space:nowrap`,
    });
    const tagWords = split(tagline, 'Every edit writes back to your source.', {
      by: 'word',
      mask: true,
    });
    tagWords.at(-1).inner.style.color = C.brand;

    root.append(dots, cam, arrange.el, title, tagline, keysI.el, keysUndo.el, keysRedo.el, cur2.el);

    app.update({ panelOpen: 0 });
    const headSize = {
      w: app.slide.layers.head.offsetWidth,
      h: app.slide.layers.head.offsetHeight,
    };
    app.slide.update({ wordValue: 'story.' });
    const headSize2 = {
      w: app.slide.layers.head.offsetWidth,
      h: app.slide.layers.head.offsetHeight,
    };
    const wordRect = {
      x: app.slide.word.offsetLeft,
      y: app.slide.word.offsetTop,
      w: app.slide.word.offsetWidth,
      h: app.slide.word.offsetHeight,
    };
    app.slide.update({});
    const wordRect0 = {
      x: app.slide.word.offsetLeft,
      y: app.slide.word.offsetTop,
      w: app.slide.word.offsetWidth,
      h: app.slide.word.offsetHeight,
    };
    const frontRect = arrange.front.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const k = rootRect.width / root.offsetWidth || 1;
    const frontPos = [
      (frontRect.left - rootRect.left) / k + 60,
      (frontRect.top - rootRect.top) / k + 26,
    ];

    const L0 = app.layout(0);
    const L1 = app.layout(WIN.panel);
    const tbEl = app.textToolbar.el;
    const cb = app.textToolbar.colorBtn;
    const headEdit = {
      x: L0.sx + LAYOUT.head.x * L0.k,
      y: L0.sy + LAYOUT.head.y * L0.k,
      w: headSize2.w * L0.k,
    };
    const chip = {
      x: headEdit.x + headEdit.w / 2 - tbEl.offsetWidth / 2 + cb.offsetLeft + 15,
      y: headEdit.y - 10 - tbEl.offsetHeight + cb.offsetTop + 15,
    };
    const saveBtn = [
      L0.cardX + L0.cardW / 2 + app.saveBar.el.offsetWidth / 2 - 38,
      WIN.h - WIN.notes - 64 + 20,
    ];
    return {
      chip,
      saveBtn,
      cam,
      winWrap,
      app,
      sel,
      gd,
      cur,
      cur2,
      shiftCap,
      palette,
      labels,
      arrange,
      keysI,
      keysUndo,
      keysRedo,
      code,
      codeWrap,
      title,
      tw,
      ttags,
      tagline,
      tagWords,
      headSize,
      headSize2,
      wordRect,
      wordRect0,
      frontPos,
      L0,
      L1,
      routeFn: null,
    };
  },
  update(s, _t, T0) {
    const Tm = T0;
    const { app } = s;

    const headOffset = (() => {
      const [ox, oy] = LAYOUT.headStartOffset;
      if (Tm < T.press + 0.05) return [ox, oy];
      if (Tm >= T.snap) return [0, 0];
      const p = glide(clamp((Tm - T.press - 0.05) / (T.snap - T.press - 0.05)));
      return [
        lerp(ox, 7, p) + Math.sin(p * Math.PI) * 10,
        lerp(oy, -8, p) - Math.sin(p * Math.PI) * 22,
      ];
    })();
    const resizeP = outCubic(clamp((Tm - T.handle - 0.05) / (T.resizeEnd - T.handle - 0.05)));
    const imgW = lerp(LAYOUT.img.w0, LAYOUT.img.w1, resizeP);
    const imgH = lerp(LAYOUT.img.h0, LAYOUT.img.h1, resizeP);
    const typedIdx = clamp(Math.floor((Tm - T.type) / 0.085) + 1, 0, TYPED.length - 1);
    const editing = Tm >= T.dbl[1] && Tm < T.explode;
    const wordValue = Tm < T.type ? 'deck.' : TYPED[typedIdx];
    const colorOn = (() => {
      if (Tm < T.pick) return 0;
      if (Tm < T.undo) return prog(Tm, T.pick, 0.2);
      if (Tm < T.redo) return 1 - prog(Tm, T.undo + 0.03, 0.18);
      return prog(Tm, T.redo + 0.03, 0.18);
    })();
    const wordColor =
      colorOn <= 0
        ? '#0a0a0a'
        : colorOn >= 1
          ? VERMILLION
          : `color-mix(in oklch, ${VERMILLION} ${Math.round(colorOn * 100)}%, #0a0a0a)`;
    const highlight =
      (Tm >= T.dbl[1] + 0.02 && Tm < T.type ? 1 : 0) ||
      (Tm >= T.reselect && Tm < T.pick + 0.05 ? 1 : 0);

    const explodeIn = prog(Tm, T.explode + 0.2, 0.7, swift);
    const explodeOut = prog(Tm, T.collapse, 0.6, glide);
    const explode = explodeIn * (1 - explodeOut);
    const frontP = spring(Tm - T.front - 0.05, { stiffness: 140, damping: 14 });
    const pillZ = Tm < T.front ? 90 : lerp(90, 760, frontP);
    app.slide.update({
      headOffset,
      imgW,
      imgH,
      wordValue,
      caretOn: Tm >= T.type - 0.1 && Tm < T.reselect,
      highlight,
      wordColor,
      explode,
      z: { bg: 0, rule: 70, eyebrow: 380, head: 560, sub: 440, img: 240, pill: 0, folio: 70 },
      lift: { pill: pillZ * explode },
    });

    const panelOpen =
      Tm < T.panel ? 0 : Tm < T.keyI ? prog(Tm, T.panel, 0.4) : 1 - prog(Tm, T.keyI + 0.05, 0.35);
    const chromeFade = prog(Tm, T.explode, 0.5) * (1 - prog(Tm, T.collapse + 0.15, 0.5));
    const tiltP =
      swift(clamp((Tm - T.explode) / 0.9)) * (1 - glide(clamp((Tm - T.collapse) / 0.7)));
    const slideTilt =
      tiltP > 0
        ? { rx: 58 * tiltP, rz: -38 * tiltP, dx: -40 * tiltP, dy: 150 * tiltP, s: 1 - 0.12 * tiltP }
        : null;
    const saveShow =
      Tm >= T.save ? prog(Tm, T.save, 0.3) * (1 - prog(Tm, T.saved + 0.55, 0.25)) : 0;
    const saveState = Tm >= T.saved ? 'saved' : Tm >= T.saveClick ? 'saving' : 'idle';
    const count = Tm >= T.undo && Tm < T.redo ? 3 : 4;

    const Lnow = app.layout(WIN.panel * swift(clamp(panelOpen)));
    const headR = app.slide.rect('head', { headOffset });
    const headRw = app.toWin(headR, Lnow);
    const tbShow = editing ? prog(Tm, T.dbl[1] + 0.06, 0.25) : 0;
    const L = app.update({
      panelOpen,
      panelKind: Tm >= T.imgClick && Tm < T.dbl[0] ? 'image' : 'text',
      save: { show: saveShow, count, state: saveState, t: Tm },
      toolbarAt: { show: tbShow, x: headRw.x + headRw.w / 2, y: headRw.y - 10 },
      chromeFade,
      slideTilt,
    });

    text(app.panel.imgW, String(Math.round(imgW)));
    text(app.panel.imgH, String(Math.round(imgH)));
    text(app.panel.content, `Ship the ${wordValue}`);
    set(app.textToolbar.chip, { background: wordColor });
    set(app.thumbAfter, { opacity: prog(Tm, T.saved, 0.3) });

    const imgR = app.toWin(app.slide.rect('img', { imgW, imgH }), L);
    const wordWin = (() => {
      const wr = Tm >= T.type ? s.wordRect : s.wordRect0;
      return app.toWin({ x: headR.x + wr.x, y: headR.y + wr.y, w: wr.w, h: wr.h }, L);
    })();
    const chipRect = s.chip;
    const saveBtnPos = s.saveBtn;

    if (!s.routeFn) {
      const L0 = s.L0;
      const L1 = s.L1;
      const head0 = app.toWin(
        { x: LAYOUT.head.x + 80, y: LAYOUT.head.y + 80, w: s.headSize.w, h: s.headSize.h },
        L0,
      );
      const head1 = app.toWin(
        { x: LAYOUT.head.x + 80, y: LAYOUT.head.y + 80, w: s.headSize.w, h: s.headSize.h },
        L1,
      );
      const img1 = app.toWin(
        { x: LAYOUT.img.x, y: LAYOUT.img.y, w: LAYOUT.img.w0, h: LAYOUT.img.h0 },
        L1,
      );
      const grab = [head1.w * 0.42, head1.h * 0.4];
      const w0 = app.toWin(
        {
          x: LAYOUT.head.x + s.wordRect0.x,
          y: LAYOUT.head.y + s.wordRect0.y,
          w: s.wordRect0.w,
          h: s.wordRect0.h,
        },
        L0,
      );
      s.routeFn = route(
        [1480, 980],
        [
          {
            at: T.hover,
            dur: 0.55,
            to: [head0.x + head0.w * 0.46, head0.y + head0.h * 0.42],
            bend: -0.2,
          },
          { at: T.press, dur: 0.35, to: [head1.x + grab[0], head1.y + grab[1]] },
          {
            from: T.press,
            until: T.release,
            fn: (tt) => {
              const off = (() => {
                if (tt < T.press + 0.05) return [80, 80];
                if (tt >= T.snap) return [0, 0];
                const p = glide(clamp((tt - T.press - 0.05) / (T.snap - T.press - 0.05)));
                return [
                  lerp(80, 7, p) + Math.sin(p * Math.PI) * 10,
                  lerp(80, -8, p) - Math.sin(p * Math.PI) * 22,
                ];
              })();
              const settle = tt >= T.snap ? prog(tt, T.snap, 0.25) : 0;
              return [
                L1.sx + (LAYOUT.head.x + off[0]) * L1.k + grab[0] + lerp(3.5, 1, settle),
                L1.sy + (LAYOUT.head.y + off[1]) * L1.k + grab[1] + lerp(-4, -1, settle),
              ];
            },
          },
          { at: T.imgClick, dur: 0.4, to: [img1.x + img1.w * 0.5, img1.y + img1.h * 0.45] },
          { at: T.handle, dur: 0.24, to: [img1.x + img1.w, img1.y + img1.h] },
          {
            from: T.handle,
            until: T.resizeEnd,
            fn: (tt) => {
              const p = outCubic(clamp((tt - T.handle - 0.05) / (T.resizeEnd - T.handle - 0.05)));
              return [
                L1.sx + (LAYOUT.img.x + lerp(LAYOUT.img.w0, LAYOUT.img.w1, p)) * L1.k,
                L1.sy + (LAYOUT.img.y + lerp(LAYOUT.img.h0, LAYOUT.img.h1, p)) * L1.k,
              ];
            },
          },
          { at: T.dbl[0] - 0.02, dur: 0.5, to: [w0.x + w0.w * 0.45, w0.y + w0.h * 0.5], bend: 0.2 },
          { at: T.chip - 0.02, dur: 0.3, to: () => [chipRect.x, chipRect.y] },
          { at: T.pick - 0.02, dur: 0.22, to: () => [chipRect.x + 105, chipRect.y + 42] },
          { at: T.explode, dur: 0.3, to: () => [chipRect.x + 140, chipRect.y + 80] },
          { at: T.saveClick - 0.02, dur: 0.55, to: () => saveBtnPos, bend: 0.15 },
          { at: T.code, dur: 0.5, to: () => [saveBtnPos[0] + 180, saveBtnPos[1] + 160] },
        ],
      );
    }
    const [cx, cy] = s.routeFn(Tm);
    const beam = editing && Tm < T.chip - 0.3 ? 1 : 0;
    const curVis =
      Tm >= 12.15 && Tm < T.explode + 0.2 ? 1 : Tm >= T.collapse + 0.6 && Tm < T.code + 0.4 ? 1 : 0;
    s.cur.update(Tm, {
      x: cx,
      y: cy,
      opacity: curVis,
      clicks: [
        T.click,
        T.press,
        T.imgClick,
        T.handle,
        T.dbl[0],
        T.dbl[1],
        T.chip,
        T.pick,
        T.saveClick,
      ],
      beam,
    });

    const hoverHead = Tm >= T.hover && Tm < T.click;
    const selHead = (Tm >= T.click && Tm < T.imgClick) || (Tm >= T.dbl[1] && Tm < T.explode);
    const selImg = Tm >= T.imgClick && Tm < T.keyI + 0.1;
    let box = null;
    if (hoverHead || selHead) box = headRw;
    if (selImg) box = imgR;
    const dragging = Tm >= T.press + 0.05 && Tm < T.release;
    const resizing = Tm >= T.handle && Tm < T.resizeEnd + 0.15;
    const hs = Tm >= T.type ? s.headSize2 : s.headSize;
    s.sel.update({
      ...(box ?? { x: 0, y: 0, w: 0, h: 0 }),
      show: box ? 1 : 0,
      dashed: hoverHead,
      handles: editing
        ? 0
        : selImg
          ? prog(Tm, T.imgClick, 0.45)
          : selHead
            ? prog(Tm, T.click, 0.45)
            : 0,
      badgeText: resizing
        ? `${Math.round(imgW)} × ${Math.round(imgH)}`
        : `${Math.round(hs.w)} × ${Math.round(hs.h)}`,
      badgeShow: dragging || resizing ? 1 : 0,
      knob: 1,
    });

    const snapOn = Tm >= T.snap && Tm < T.release + 0.35;
    const gFade = snapOn ? 1 - prog(Tm, T.release + 0.1, 0.25) : 0;
    const gGrow = prog(Tm, T.snap, 0.3, swift);
    const vx = L.sx + LAYOUT.eyebrow.x * L.k;
    const hy = L.sy + LAYOUT.head.y * L.k;
    s.gd.update([
      { x1: vx, y1: L.sy + 140 * L.k, x2: vx, y2: L.sy + 940 * L.k, opacity: gFade, grow: gGrow },
      {
        x1: vx,
        y1: hy,
        x2: L.sx + (LAYOUT.img.x + imgW) * L.k,
        y2: hy,
        opacity: gFade,
        grow: gGrow,
      },
    ]);

    set(s.shiftCap, {
      opacity: envelope(Tm, T.handle, T.resizeEnd + 0.2, 0.15, 0.2),
      transform: `translate(${cx + 26}px, ${cy + 18}px)`,
    });
    const palShow = Tm >= T.chip + 0.04 && Tm < T.pick + 0.12 ? prog(Tm, T.chip + 0.04, 0.2) : 0;
    set(s.palette, {
      opacity: palShow,
      transform: `translate(${chipRect.x - 20}px, ${chipRect.y + 24 + (1 - palShow) * -6}px)`,
    });

    const keyShow = (el, t0, dur) => {
      const p = envelope(Tm, t0 - 0.05, t0 + dur, 0.12, 0.2);
      const press = envelope(Tm, t0, t0 + 0.14, 0.03, 0.08);
      set(el.el, {
        opacity: p,
        transform: `translateX(-50%) translateY(${(1 - p) * 20 + press * 6}px) scale(${0.92 + 0.08 * p})`,
      });
    };
    keyShow(s.keysI, T.keyI, 0.55);
    keyShow(s.keysUndo, T.undo, 0.5);
    keyShow(s.keysRedo, T.redo, 0.5);

    for (const [name, el] of Object.entries(s.labels)) {
      set(el, { opacity: prog(Tm, T.explode + 0.55, 0.3) * (1 - prog(Tm, T.collapse - 0.1, 0.2)) });
      if (name === 'pill') text(el, Tm >= T.front + 0.15 ? '<Pill> · z 3' : '<Pill> · z 0');
    }
    const arrShow = prog(Tm, T.explode + 0.5, 0.4) * (1 - prog(Tm, T.collapse, 0.3));
    set(s.arrange.el, {
      opacity: arrShow,
      transform: `translateX(${(1 - arrShow) * 40}px)`,
    });
    set(s.arrange.front, {
      background: Tm >= T.front - 0.35 && Tm < T.collapse ? 'oklch(0.955 0 0)' : 'transparent',
    });
    const c2from = [1700, 1000];
    const c2to = s.frontPos;
    const c2p = prog(Tm, T.front - 0.55, 0.5, swift);
    s.cur2.update(Tm, {
      x: lerp(c2from[0], c2to[0], c2p),
      y: lerp(c2from[1], c2to[1], c2p),
      opacity: envelope(Tm, T.front - 0.6, T.collapse, 0.1, 0.2),
      clicks: [T.front],
    });

    const codeP = prog(Tm, T.code, 1.1, swift);
    set(s.codeWrap, {
      opacity: prog(Tm, T.code, 0.35),
      transform: `translate(${lerp(2500, 1580, codeP)}px, ${lerp(220, 150, codeP)}px) rotateY(${(1 - codeP) * -18}deg)`,
    });
    const watch = prog(Tm, T.diff[0] - 0.2, 0.3);
    set(s.code.watching, { opacity: watch });
    const pulse = (Tm * 1.2) % 1;
    set(s.code.watching.querySelector('.pulse'), {
      boxShadow: `0 0 0 ${pulse * 8}px oklch(0.696 0.17 162.48 / ${0.5 * (1 - pulse)})`,
    });
    DIFF_ROWS.forEach((rows, i) => {
      const list = Array.isArray(rows) ? rows : [rows];
      list.forEach((r, j) => {
        const t0 = T.diff[i] + j * 0.12;
        const p = prog(Tm, t0, 0.35, outCubic);
        const isAdd = CODE[r].kind === 'add';
        s.code.reveal(r, p, isAdd ? prog(Tm, t0, 0.3) : null);
      });
    });

    if (Tm >= T.diff[0] - 0.05) {
      const targets = [headRw, wordWin, imgR, app.toWin(app.slide.rect('pill'), L)];
      const idx = Math.min(3, Math.floor((Tm - T.diff[0] + 0.05) / 0.5));
      const local = Tm - T.diff[idx];
      const flash = Math.max(0, 1 - Math.max(0, local) / 0.45);
      s.sel.update({
        ...targets[idx],
        show: flash,
        handles: flash > 0 ? 1 : 0,
        knob: 0,
      });
    }

    const titleIn = (i) => prog(Tm, T.title + i * 0.08, 0.8, snap);
    const titleOut = prog(Tm, T.titleOut, 0.55, inCubic);
    s.tw.forEach((w, i) => {
      set(w.inner, { transform: `translateY(${(1 - titleIn(i)) * 110}%)` });
    });
    s.ttags.forEach((el, i) => {
      set(el, { opacity: prog(Tm, T.title + 0.1 + i * 0.06, 0.3) });
    });
    set(s.title, {
      opacity: 1 - titleOut,
      transform: `translateX(${-titleOut * 160}px)`,
      filter: titleOut > 0 ? `blur(${titleOut * 10}px)` : 'none',
    });
    s.tagWords.forEach((w, i) => {
      const p = prog(Tm, T.tagline + i * 0.06, 0.8, snap);
      set(w.inner, { transform: `translateY(${(1 - p) * 110}%)` });
    });

    const [wdx, wdy, wdz, wry, wrx] = keys(Tm, [
      [T.flyIn, [1500, 120, -1400, -40, 12]],
      [T.flyIn + 0.95, [880, 40, -380, -24, 6], snap],
      [T.titleOut, [860, 40, -340, -22, 6], (x) => x],
      [T.land, [0, 0, 0, 0, 0], glide],
    ]);
    set(s.winWrap, {
      transform: `translate3d(${WX + wdx}px, ${WY + wdy}px, ${wdz}px) rotateY(${wry}deg) rotateX(${wrx}deg)`,
      opacity: prog(Tm, T.flyIn, 0.25),
    });

    const headFocus = [WX + headRw.x + headRw.w / 2, WY + headRw.y + headRw.h / 2];
    const cam = keys(Tm, [
      [10.2, [960, 540, 0.8]],
      [T.titleOut, [960, 540, 0.84], (x) => x],
      [T.land, [960, 540, 0.9], glide],
      [12.55, [960, 540, 0.93]],
      [13.2, [WX + 700, WY + 470, 1.22], glide],
      [T.press, [WX + 640, WY + 470, 1.35], glide],
      [T.release, [WX + 620, WY + 450, 1.45], glide],
      [T.imgClick + 0.2, [WX + 880, WY + 500, 1.3], glide],
      [T.resizeEnd, [WX + 900, WY + 520, 1.34], glide],
      [T.keyI + 0.3, [WX + 820, WY + 470, 1.08], glide],
      [T.dbl[0], [headFocus[0], headFocus[1] - 30, 1.5], glide],
      [T.pick + 0.2, [headFocus[0] + 30, headFocus[1] - 60, 1.6], glide],
      [T.explode + 0.5, [WX + 1010, WY + 400, 0.86], glide],
      [T.collapse - 0.2, [WX + 990, WY + 380, 0.9], (x) => x],
      [T.collapse + 0.6, [960, 540, 1.0], glide],
      [T.save + 0.35, [WX + 900, WY + 640, 1.3], glide],
      [T.saved + 0.25, [WX + 900, WY + 650, 1.34], (x) => x],
      [T.code + 1.2, [1260, 685, 0.78], glide],
      [28.25, [1270, 680, 0.8], (x) => x],
    ]);
    set(s.cam, {
      transform: `translate(960px, 540px) scale(${cam[2]}) translate(${-cam[0]}px, ${-cam[1]}px)`,
    });
    set(s.tagline, { opacity: Tm >= T.tagline ? 1 : 0 });
  },
});
