import { arc, envelope, prog, tween } from '#lib/anim.js';
import { h, set, split, text } from '#lib/dom.js';
import { clamp, glide, inCubic, inExpo, lerp, snap, swift } from '#lib/ease.js';
import { defineScene, rectIn } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { cursor } from '#ui/cursor.js';
import { guides, selection } from '#ui/selection.js';
import { SPANS } from '../timeline.js';

const T = {
  line1: 0.45,
  dim: 2.05,
  line2: 2.2,
  cursorIn: 2.85,
  hover: 3.45,
  click: 3.75,
  drag: 4.0,
  snap: 4.52,
  fall: 4.02,
  zoom: 4.95,
};

const lineStyle = `position:absolute;left:0;right:0;text-align:center;font-family:${FONT.sans};font-size:112px;font-weight:600;letter-spacing:-0.045em;line-height:1;color:${C.snow};white-space:nowrap`;

export default defineScene({
  name: 'hook',
  span: SPANS.hook,
  sfx: [
    ...[0, 1, 2, 3, 4].map((i) => [T.line1 + i * 0.07, 'tick', 0.5]),
    ...[0, 1, 2, 3, 4].map((i) => [T.line2 + i * 0.07, 'tick', 0.55]),
    [T.cursorIn, 'swish', 0.25],
    [T.click, 'click', 1],
    [T.drag, 'grab', 0.6],
    [T.snap, 'snap', 1],
    [T.zoom, 'whoosh', 0.9],
  ],
  build(root) {
    set(root, { background: C.void });
    const grid = h('div', {
      class: 'fill',
      style:
        'background-image:radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.11) 1px, transparent 1.4px);background-size:48px 48px;background-position:24px 12px',
    });
    const marks = h(
      'div',
      { class: 'fill' },
      [
        [60, 60, 1, 1],
        [1860, 60, -1, 1],
        [60, 1020, 1, -1],
        [1860, 1020, -1, -1],
      ].map(([x, y, sx, sy]) =>
        h(
          'div',
          { style: `position:absolute;left:${x}px;top:${y}px` },
          h('div', {
            class: 'mh',
            style: `position:absolute;top:0;${sx > 0 ? 'left:0' : 'right:0'};height:1px;width:36px;background:rgb(255 255 255 / 0.35);transform-origin:${sx > 0 ? 'left' : 'right'}`,
          }),
          h('div', {
            class: 'mv',
            style: `position:absolute;left:0;${sy > 0 ? 'top:0' : 'bottom:0'};width:1px;height:36px;background:rgb(255 255 255 / 0.35);transform-origin:${sy > 0 ? 'top' : 'bottom'}`,
          }),
        ),
      ),
    );
    const label = h('div', {
      class: 'mono',
      style:
        'position:absolute;left:76px;top:76px;font-size:14px;color:rgb(255 255 255 / 0.4);letter-spacing:0.02em',
    });
    const label2 = h('div', {
      class: 'mono',
      style:
        'position:absolute;right:76px;bottom:76px;font-size:14px;color:rgb(255 255 255 / 0.4);letter-spacing:0.02em',
    });

    const line1 = h('div', { style: `${lineStyle};top:398px` });
    const line2 = h('div', { style: `${lineStyle};top:548px` });
    const w1 = split(line1, 'Your agent writes the slides.', { by: 'word', mask: true });
    const w2 = split(line2, 'You get the last word.', { by: 'word', mask: true });
    const target = w2[w2.length - 1];
    target.inner.innerHTML = 'word<span style="color:oklch(0.6 0.2 25)">.</span>';

    const sel = selection();
    const gd = guides(2);
    const cur = cursor();
    root.append(grid, marks, label, label2, line1, line2, gd.el, sel.el, cur.el);

    const rest = rectIn(target.inner, root);
    return { grid, marks, label, label2, line1, line2, w1, w2, target, rest, sel, gd, cur };
  },
  update(s, t) {
    const push = tween(t, 0, 6.4, 1, 1.05, (x) => x);
    const through = prog(t, T.zoom, 1.1, inExpo);
    set(s.grid, {
      transform: `scale(${push + through * 0.9})`,
      opacity: tween(t, 0, 0.8, 0, 1) * (1 - through * 0.8),
    });
    const markP = prog(t, 0.15, 0.9, swift);
    for (const m of s.marks.querySelectorAll('.mh')) set(m, { transform: `scaleX(${markP})` });
    for (const m of s.marks.querySelectorAll('.mv')) set(m, { transform: `scaleY(${markP})` });
    set(s.marks, { opacity: 1 - prog(t, T.zoom, 0.4), transform: `scale(${1 + through * 0.4})` });
    text(s.label, t < 0.3 ? '' : 'canvas  1920 × 1080');
    text(s.label2, t < 0.45 ? '' : 'open-slide / 2.0');
    set(s.label, { opacity: prog(t, 0.3, 0.5) * (1 - prog(t, T.zoom, 0.3)) });
    set(s.label2, { opacity: prog(t, 0.45, 0.5) * (1 - prog(t, T.zoom, 0.3)) });

    const dimP = prog(t, T.dim, 0.7, swift);
    set(s.line1, { transform: `translateY(${-40 * dimP}px)`, opacity: 1 - 0.7 * dimP });
    set(s.line2, { transform: `translateY(${-24 * dimP}px)` });

    const fallFor = (i) => prog(t, T.fall + i * 0.035, 0.55, inCubic);
    s.w1.forEach((w, i) => {
      const rise = prog(t, T.line1 + i * 0.07, 0.9, snap);
      const f = fallFor(i + 5);
      set(w.inner, {
        transform: `translateY(${(1 - rise) * 110 + f * 90}%) rotate(${f * (i % 2 ? 6 : -5)}deg)`,
        opacity: 1 - f,
        filter: f > 0 ? `blur(${f * 8}px)` : 'none',
      });
      set(w.el, { overflow: f > 0 ? 'visible' : 'hidden' });
    });

    const dragEnd = [960, 540];
    const grab = [14, 10];
    const start = [s.rest.cx + 40, s.rest.cy + 10];
    let cx;
    let cy;
    if (t < T.hover) {
      [cx, cy] = arc(t, T.cursorIn, T.hover - T.cursorIn, [1560, 1140], start, -0.18, swift);
    } else if (t < T.drag) {
      [cx, cy] = [start[0], start[1]];
      const p = prog(t, T.hover + 0.05, 0.25, swift);
      cx = lerp(start[0], s.rest.cx + grab[0], p);
      cy = lerp(start[1], s.rest.cy + grab[1], p);
    } else {
      const from = [s.rest.cx + grab[0], s.rest.cy + grab[1]];
      const to = [dragEnd[0] + grab[0] + 26, dragEnd[1] + grab[1] - 14];
      [cx, cy] = arc(t, T.drag, T.snap - T.drag, from, to, 0.12, glide);
      const settle = prog(t, T.snap, 0.3, swift);
      cx = lerp(cx, dragEnd[0] + grab[0] + 4, settle);
      cy = lerp(cy, dragEnd[1] + grab[1] - 2, settle);
    }

    let wx = s.rest.cx;
    let wy = s.rest.cy;
    if (t >= T.drag && t < T.snap) {
      wx = cx - grab[0];
      wy = cy - grab[1];
    } else if (t >= T.snap) {
      wx = dragEnd[0];
      wy = dragEnd[1];
    }
    const dx = wx - s.rest.cx;
    const dy = wy - s.rest.cy;

    const zoomP = prog(t, T.zoom, 0.95, glide);
    const wordScale = 1 + inExpo(clamp((t - T.zoom) / 0.95)) * 11;
    const wordFade = prog(t, T.zoom + 0.35, 0.45);
    s.w2.forEach((w, i) => {
      const rise = prog(t, T.line2 + i * 0.07, 0.9, snap);
      if (w === s.target) {
        set(w.inner, {
          transform: `translate(${dx}px, ${dy + (1 - rise) * 130}px) scale(${wordScale})`,
          opacity: 1 - wordFade,
          filter: wordFade > 0 ? `blur(${wordFade * 14}px)` : 'none',
        });
        set(w.el, { overflow: t >= T.hover ? 'visible' : 'hidden' });
        return;
      }
      const f = fallFor(i);
      set(w.inner, {
        transform: `translateY(${(1 - rise) * 110 + f * 90}%) rotate(${f * (i % 2 ? -6 : 5)}deg)`,
        opacity: 1 - f,
        filter: f > 0 ? `blur(${f * 8}px)` : 'none',
      });
      set(w.el, { overflow: f > 0 ? 'visible' : 'hidden' });
    });

    const lineShift = -24 * dimP;
    const pad = 10;
    const bw = s.rest.w + pad * 2;
    const bh = s.rest.h + pad * 2 - 18;
    let bx = wx - bw / 2;
    let by = wy - bh / 2 + (t < T.snap ? lineShift : 0) + 4;
    let bww = bw;
    let bhh = bh;
    if (zoomP > 0) {
      bx = lerp(bx, 44, zoomP);
      by = lerp(by, 44, zoomP);
      bww = lerp(bw, 1832, zoomP);
      bhh = lerp(bh, 992, zoomP);
    }
    const hover = t >= T.hover && t < T.click;
    const selected = t >= T.click;
    s.sel.update({
      x: bx,
      y: by,
      w: bww,
      h: bhh,
      show: hover || selected ? 1 : 0,
      dashed: hover,
      handles: selected ? prog(t, T.click, 0.5) : 0,
      badgeText: `${Math.round(s.rest.w * 1.6)} × ${Math.round(s.rest.h * 1.6)}`,
      badgeShow: envelope(t, T.drag + 0.05, T.zoom + 0.1, 0.2, 0.2),
      knob: 1 - zoomP,
    });

    const g = t >= T.snap ? 1 : 0;
    const grow = prog(t, T.snap, 0.35, swift);
    const gFade = 1 - prog(t, T.zoom - 0.1, 0.35);
    s.gd.update([
      { x1: 960, y1: 0, x2: 960, y2: 1080, opacity: g * gFade, grow },
      { x1: 0, y1: 540, x2: 1920, y2: 540, opacity: g * gFade, grow },
    ]);

    const leave = prog(t, T.zoom + 0.05, 0.6, inCubic);
    s.cur.update(t, {
      x: cx + leave * 260,
      y: cy + leave * 320,
      opacity: prog(t, T.cursorIn, 0.2) * (1 - leave),
      clicks: [T.click, T.drag],
    });
    set(s.cur.el, { display: t < T.cursorIn ? 'none' : 'block' });
  },
});
