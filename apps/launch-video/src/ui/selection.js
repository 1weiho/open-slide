import { h, set, text } from '../lib/dom.js';
import { clamp, outBack, swift } from '../lib/ease.js';
import { C } from '../theme.js';

const HANDLES = [
  ['nw', 0, 0],
  ['n', 0.5, 0],
  ['ne', 1, 0],
  ['e', 1, 0.5],
  ['se', 1, 1],
  ['s', 0.5, 1],
  ['sw', 0, 1],
  ['w', 0, 0.5],
];

export function selection({ handleSize = 12, stroke = 1, knob = true } = {}) {
  const box = h('div', {
    style: `position:absolute;left:0;top:0;border:${stroke}px solid ${C.blue};pointer-events:none`,
  });
  const handles = HANDLES.map(([name, fx, fy]) => ({
    name,
    fx,
    fy,
    el: h('div', {
      style: `position:absolute;left:0;top:0;width:${handleSize}px;height:${handleSize}px;margin:${-handleSize / 2}px 0 0 ${-handleSize / 2}px;border-radius:2px;border:${stroke}px solid ${C.blue};background:#fff;box-shadow:0 1px 2px rgb(0 0 0 / 0.12)`,
    }),
  }));
  const stem = h('div', {
    style: `position:absolute;left:0;top:0;width:${stroke}px;height:24px;background:${C.blue}`,
  });
  const knobEl = h('div', {
    style: `position:absolute;left:0;top:0;width:${handleSize}px;height:${handleSize}px;margin-left:${-handleSize / 2}px;border-radius:50%;border:${stroke}px solid ${C.blue};background:#fff`,
  });
  const badge = h('div', {
    class: 'mono',
    style:
      'position:absolute;left:0;top:0;padding:4px 8px;border-radius:4px;background:oklch(0.145 0 0);color:#fafafa;font-size:10px;white-space:nowrap;transform-origin:50% 0',
  });
  const el = h(
    'div',
    { style: 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:40' },
    box,
    stem,
    knobEl,
    ...handles.map((hd) => hd.el),
    badge,
  );

  return {
    el,
    update({
      x,
      y,
      w,
      h: hh,
      show = 1,
      handles: hp = 1,
      dashed = false,
      badgeText = null,
      badgeShow = 0,
      knob: knobShow = knob ? 1 : 0,
      color = C.blue,
    }) {
      set(el, { opacity: clamp(show), display: show <= 0.001 ? 'none' : 'block' });
      if (show <= 0.001) return;
      set(box, {
        transform: `translate(${x}px, ${y}px)`,
        width: w,
        height: hh,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: dashed ? 'oklch(0.623 0.214 259.815 / 0.7)' : color,
      });
      handles.forEach((hd, i) => {
        const p = clamp((hp - i * 0.04) / 0.68);
        const s = p <= 0 ? 0 : outBack(2.2)(p);
        set(hd.el, {
          transform: `translate(${x + w * hd.fx}px, ${y + hh * hd.fy}px) scale(${s})`,
          opacity: p > 0 ? 1 : 0,
        });
      });
      const kp = swift(clamp((hp - 0.3) / 0.7)) * knobShow;
      set(stem, {
        transform: `translate(${x + w / 2 - 0.5}px, ${y - 24}px) scaleY(${kp})`,
        transformOrigin: '50% 100%',
        opacity: kp > 0 ? 1 : 0,
      });
      set(knobEl, {
        transform: `translate(${x + w / 2}px, ${y - 24 - 12 + (1 - kp) * 16}px) scale(${kp})`,
        opacity: kp > 0 ? 1 : 0,
      });
      if (badgeText != null) text(badge, badgeText);
      const bp = clamp(badgeShow);
      set(badge, {
        transform: `translate(${x + w / 2}px, ${y + hh + 12 + (1 - bp) * 6}px) translateX(-50%) scale(${0.9 + 0.1 * bp})`,
        opacity: bp,
      });
    },
  };
}

// Pool of 1px cyan smart-guide lines.
export function guides(count = 4) {
  const lines = Array.from({ length: count }, () =>
    h('div', { style: `position:absolute;left:0;top:0;background:${C.cyan};opacity:0` }),
  );
  const el = h('div', { style: 'position:absolute;inset:0;pointer-events:none;z-index:39' }, lines);
  return {
    el,
    update(list) {
      lines.forEach((ln, i) => {
        const g = list[i];
        if (!g || g.opacity <= 0) {
          set(ln, { opacity: 0 });
          return;
        }
        const vertical = g.x1 === g.x2;
        const len = vertical ? g.y2 - g.y1 : g.x2 - g.x1;
        const grow = g.grow ?? 1;
        set(ln, {
          opacity: g.opacity,
          width: vertical ? (g.thick ?? 1) : len,
          height: vertical ? len : (g.thick ?? 1),
          transform: `translate(${g.x1}px, ${g.y1}px) ${vertical ? `scaleY(${grow})` : `scaleX(${grow})`}`,
          transformOrigin: vertical ? '50% 50%' : '50% 50%',
        });
      });
    },
  };
}
