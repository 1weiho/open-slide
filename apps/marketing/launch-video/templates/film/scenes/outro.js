import { impulse, prog, tween } from '#lib/anim.js';
import { h, set, split } from '#lib/dom.js';
import { outExpo, swift } from '#lib/ease.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { logoMark } from '#ui/logo.js';
import { CTA, FEATURE, SITE } from '../copy.js';
import { DURATION, SPANS } from '../timeline.js';

const CUE = { word: 14.6, hit: 16.0, cta: 16.6, site: 17.0, fade: DURATION - 1.2 };

export default defineScene({
  name: 'outro',
  span: SPANS.outro,
  sfx: [
    [CUE.word - 0.4, 'riser', 0.7, { dur: CUE.hit - CUE.word + 0.4 }],
    [CUE.hit, 'impact', 0.9],
    [CUE.cta, 'pop', 0.6],
    [CUE.site, 'blip', 0.5],
  ],
  build(root) {
    set(root, { background: C.void });
    const bloom = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(45% 50% at 50% 46%, oklch(0.6 0.2 25 / 0.3), transparent 70%);opacity:0',
    });
    const mark = logoMark({ size: 150 });
    const word = h('div', {
      style: `font-family:${FONT.sans};font-size:120px;font-weight:700;letter-spacing:-0.05em;line-height:1;color:#f7f7f7;white-space:nowrap`,
    });
    const chars = split(word, 'open-slide', { by: 'char', mask: true });
    const lockup = h(
      'div',
      {
        style:
          'position:absolute;left:0;right:0;top:380px;display:flex;align-items:center;justify-content:center;gap:34px',
      },
      h('div', { style: 'width:150px;height:150px;flex:none' }, mark.el),
      word,
    );
    const line = h('div', {
      text: `${FEATURE} is here.`,
      style: `position:absolute;left:0;right:0;top:590px;text-align:center;font-family:${FONT.sans};font-size:46px;font-weight:500;letter-spacing:-0.02em;color:rgb(255 255 255 / 0.78)`,
    });
    const cta = h(
      'div',
      {
        class: 'mono',
        style: `position:absolute;left:50%;top:720px;padding:18px 30px;border-radius:14px;background:rgb(255 255 255 / 0.06);box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.12);font-size:30px;color:#f2f2f2;white-space:nowrap`,
      },
      h('span', { text: '$ ', style: `color:${C.brand};font-weight:700` }),
      CTA,
    );
    const site = h('div', {
      class: 'mono',
      text: SITE,
      style:
        'position:absolute;left:0;right:0;top:850px;text-align:center;font-size:24px;letter-spacing:0.12em;color:rgb(255 255 255 / 0.5)',
    });
    const black = h('div', { class: 'fill', style: 'background:#000;opacity:0' });
    root.append(bloom, lockup, line, cta, site, black);
    return { bloom, chars, lockup, line, cta, site, black };
  },
  update(s, _t, T) {
    s.chars.forEach((c, i) => {
      const p = prog(T, CUE.word + i * 0.04, 0.7, outExpo);
      set(c.inner, { transform: `translateY(${(1 - p) * 110}%)`, opacity: p > 0 ? 1 : 0 });
    });
    const punch = impulse(T, CUE.hit, 0.3);
    const drift = tween(T, 13.6, 6.4, 0.97, 1.02, swift);
    set(s.lockup, { transform: `scale(${drift + punch * 0.04})` });
    set(s.bloom, { opacity: T < CUE.hit ? 0 : 0.4 + punch * 0.6 });

    const lp = prog(T, CUE.hit + 0.1, 0.6, outExpo);
    set(s.line, { opacity: lp, transform: `translateY(${(1 - lp) * 18}px)` });
    const cp = prog(T, CUE.cta, 0.6, outExpo);
    set(s.cta, { opacity: cp, transform: `translateX(-50%) translateY(${(1 - cp) * 18}px)` });
    const sp = prog(T, CUE.site, 0.6, outExpo);
    set(s.site, { opacity: sp, transform: `translateY(${(1 - sp) * 14}px)` });
    set(s.black, { opacity: prog(T, CUE.fade, 1.1) });
  },
});
