import { impulse, prog, tween } from '#lib/anim.js';
import { h, set, split, text } from '#lib/dom.js';
import { outExpo, swift } from '#lib/ease.js';
import { scramble } from '#lib/fx.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { logoMark } from '#ui/logo.js';
import { FEATURE } from '../copy.js';
import { SPANS } from '../timeline.js';

const CUE = { eyebrow: 0.5, word: 1.2, hit: 2.0 };
const EYEBROW = 'New in open-slide';

export default defineScene({
  name: 'intro',
  span: SPANS.intro,
  sfx: [
    [0.2, 'riser', 0.8, { dur: CUE.hit - 0.2 }],
    [CUE.eyebrow, 'blip', 0.5],
    [CUE.hit, 'impact', 1],
  ],
  build(root) {
    const bg = h('div', { class: 'fill', style: `background:${C.void}` });
    const bloom = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(50% 55% at 50% 52%, oklch(0.6 0.2 25 / 0.32), transparent 70%);opacity:0',
    });
    const mark = logoMark({ size: 72 });
    const eyebrow = h('div', {
      class: 'mono',
      style:
        'font-size:26px;letter-spacing:0.22em;text-transform:uppercase;color:rgb(255 255 255 / 0.7);white-space:nowrap',
    });
    const top = h(
      'div',
      { style: 'display:flex;align-items:center;gap:22px' },
      h('div', { style: 'width:72px;height:72px;flex:none' }, mark.el),
      eyebrow,
    );
    const word = h('div', {
      style: `font-family:${FONT.sans};font-size:180px;font-weight:700;letter-spacing:-0.05em;line-height:1;color:#f7f7f7;white-space:nowrap`,
    });
    const chars = split(word, FEATURE, { by: 'char', mask: true });
    const stack = h(
      'div',
      {
        style:
          'position:absolute;left:0;right:0;top:50%;display:flex;flex-direction:column;align-items:center;gap:44px',
      },
      top,
      word,
    );
    root.append(bg, bloom, stack);
    return { bloom, eyebrow, top, chars, stack, h: stack.offsetHeight };
  },
  update(s, _t, T) {
    const ep = prog(T, CUE.eyebrow, 0.6, outExpo);
    text(s.eyebrow, scramble(EYEBROW, T, CUE.eyebrow, 0.6, 3));
    set(s.top, { opacity: ep, transform: `translateY(${(1 - ep) * 16}px)` });
    s.chars.forEach((c, i) => {
      const p = prog(T, CUE.word + i * 0.03, 0.7, outExpo);
      set(c.inner, { transform: `translateY(${(1 - p) * 110}%)`, opacity: p > 0 ? 1 : 0 });
    });
    const punch = impulse(T, CUE.hit, 0.25);
    const drift = tween(T, 0, 4.4, 0.96, 1.02, swift);
    set(s.stack, { transform: `translateY(${-s.h / 2}px) scale(${drift + punch * 0.03})` });
    set(s.bloom, { opacity: T < CUE.hit ? 0 : 0.45 + punch * 0.55 });
  },
});
