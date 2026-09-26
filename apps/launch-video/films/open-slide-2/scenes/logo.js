import { impulse, keys, prog, tween } from '#lib/anim.js';
import { attr, h, set, split } from '#lib/dom.js';
import { clamp, inQuad, outBack, outExpo, snap, swift } from '#lib/ease.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { logoMark } from '#ui/logo.js';
import { SPANS } from '../timeline.js';

const LAND = [7.2, 7.12, 7.04, 6.95];
const FLIGHT = 0.78;
const MARK = 360;
const SLAM = 8.0;
const TAGS = [
  { text: 'Visual editor', t: 8.5 },
  { text: 'Editable PPTX', t: 9.0 },
  { text: 'A new UI', t: 9.5 },
];

export default defineScene({
  name: 'logo',
  span: SPANS.logo,
  sfx: [
    [5.7, 'riser', 1, { dur: 2.3 }],
    ...LAND.map((t, i) => [t, 'dart', 0.5 + i * 0.12]),
    [7.3, 'shimmer', 0.6],
    [SLAM, 'impact', 1],
    ...TAGS.map((g) => [g.t, 'pop', 0.7]),
  ],
  build(root) {
    const bg = h('div', { class: 'fill', style: `background:${C.void}` });
    const bloom = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(50% 55% at 50% 48%, oklch(0.6 0.2 25 / 0.35), transparent 70%);opacity:0',
    });
    const cool = h('div', {
      class: 'fill',
      style:
        'background:radial-gradient(40% 40% at 36% 50%, oklch(0.7 0.12 255 / 0.22), transparent 70%);opacity:0',
    });
    const mark = logoMark({ size: MARK, tile: false });
    const markWrap = h(
      'div',
      { style: `position:relative;width:${MARK}px;height:${MARK}px;flex:none;margin-right:-30px` },
      mark.el,
    );
    const streaks = mark.darts.map((_, i) =>
      h('div', {
        style: `position:absolute;left:0;top:0;height:${[6, 12, 18, 26][i]}px;border-radius:99px;background:linear-gradient(90deg, rgb(255 255 255 / 0), rgb(214 228 255 / 0.85));transform-origin:100% 50%;opacity:0`,
      }),
    );
    markWrap.append(...streaks);

    const word = h('div', {
      style: `font-family:${FONT.sans};font-size:190px;font-weight:700;letter-spacing:-0.055em;line-height:1;color:#f7f7f7;white-space:nowrap;margin-left:28px;padding-bottom:18px`,
    });
    const chars = split(word, 'open-slide', { by: 'char', mask: true });
    const badge = h(
      'div',
      {
        style: `margin-left:34px;padding:6px 30px 14px;border-radius:34px;background:${C.brand};color:#fff;font-family:${FONT.sans};font-size:150px;font-weight:800;letter-spacing:-0.05em;line-height:1;box-shadow:0 20px 80px -10px oklch(0.6 0.2 25 / 0.7)`,
      },
      '2.0',
    );
    const lockup = h(
      'div',
      {
        style:
          'position:absolute;left:50%;top:50%;display:flex;align-items:center;transform-origin:50% 50%',
      },
      markWrap,
      word,
      badge,
    );
    const ring = h('div', {
      style: `position:absolute;left:0;top:0;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:3px solid ${C.brand};opacity:0`,
    });
    const tagRow = h('div', {
      class: 'mono',
      style:
        'position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center;gap:38px;font-size:26px;letter-spacing:0.18em;text-transform:uppercase;color:rgb(255 255 255 / 0.78)',
    });
    const tags = TAGS.map((g, i) => {
      const el = h(
        'div',
        { style: 'display:flex;align-items:center;gap:38px' },
        i
          ? h('span', {
              style: `width:10px;height:10px;border-radius:2px;background:${C.brand};transform:rotate(45deg)`,
            })
          : null,
        h('span', { text: g.text }),
      );
      tagRow.append(el);
      return el;
    });
    root.append(bg, cool, bloom, lockup, ring, tagRow);

    const lw = lockup.offsetWidth;
    const lh = lockup.offsetHeight;
    const bw = badge.offsetWidth + 34;
    const badgeCx = lockup.offsetWidth - badge.offsetWidth / 2;
    return {
      bg,
      bloom,
      cool,
      mark,
      streaks,
      chars,
      badge,
      lockup,
      ring,
      tags,
      lw,
      lh,
      bw,
      badgeCx,
    };
  },
  update(s, _t, T) {
    set(s.bg, { opacity: prog(T, 5.6, 0.55) });

    const unit = MARK / 512;
    s.mark.darts.forEach((g, i) => {
      const land = LAND[i];
      const start = land - FLIGHT;
      const p = clamp((T - start) / FLIGHT);
      const far = -2600 - i * 300;
      let dx = far * (1 - snap(p));
      if (T >= land)
        dx = keys(T, [
          [land, 0],
          [land + 0.08, 10, swift],
          [land + 0.4, 0, swift],
        ]);
      attr(g, 'transform', `translate(${dx.toFixed(2)} 0)`);
      attr(g, 'opacity', T < start ? 0 : 1);
      const dt = 1 / 120;
      const pPrev = clamp((T - dt - start) / FLIGHT);
      const v = Math.abs(far * (snap(p) - snap(pPrev))) / dt;
      const len = Math.min(900, v * 0.045) * unit;
      const geo = s.mark.geometry[i];
      const tipX = (geo.x + geo.len * 0.35 + dx) * unit;
      set(s.streaks[i], {
        width: Math.max(1, len),
        transform: `translate(${tipX - len}px, ${s.mark.cy * unit - [3, 6, 9, 13][i]}px)`,
        opacity: T >= start && T < land + 0.1 ? clamp(len / 60) * 0.9 : 0,
      });
    });
    const glowIn = prog(T, 6.85, 0.15);
    attr(
      s.mark.glow,
      'opacity',
      (glowIn * (0.35 + impulse(T, 6.95, 0.4) * 0.65 + impulse(T, SLAM, 0.5) * 0.5)).toFixed(3),
    );
    const sheenX = tween(T, 7.25, 0.9, -200, 640, inQuad);
    attr(s.mark.sheen, 'transform', `translate(${sheenX.toFixed(1)} 0)`);

    s.chars.forEach((c, i) => {
      const p = prog(T, 7.28 + i * 0.028, 0.7, outExpo);
      set(c.inner, { transform: `translateX(${(1 - p) * -105}%)`, opacity: p > 0 ? 1 : 0 });
    });

    const slamP = prog(T, SLAM, 0.42, outExpo);
    const pre = T < SLAM;
    set(s.badge, {
      opacity: pre ? 0 : 1,
      transform: `scale(${pre ? 2.4 : 2.4 - 1.4 * slamP}) rotate(${pre ? -8 : -8 * (1 - slamP)}deg)`,
    });
    const shift = pre ? s.bw / 2 : (s.bw / 2) * (1 - outBack(1.4)(prog(T, SLAM, 0.5)));
    const lift = tween(T, SLAM + 0.3, 0.8, 0, -60, swift);
    const drift = tween(T, 6.4, 4, 0.92, 1.02, (x) => x);
    set(s.lockup, {
      transform: `translate(${-s.lw / 2 + shift}px, ${-s.lh / 2 + lift}px) scale(${drift})`,
    });

    const rp = prog(T, SLAM, 0.9, outExpo);
    const cx = 960 - s.lw / 2 + shift + s.badgeCx;
    set(s.ring, {
      transform: `translate(${cx}px, ${540 + lift}px) scale(${0.3 + rp * 7})`,
      opacity: T < SLAM ? 0 : (1 - rp) * 0.9,
    });
    set(s.bloom, { opacity: T < SLAM ? 0 : 0.35 + impulse(T, SLAM, 0.35) * 0.65 });
    set(s.cool, { opacity: prog(T, 6.8, 0.6) * (1 - 0.5 * prog(T, SLAM, 0.4)) });

    s.tags.forEach((el, i) => {
      const p = prog(T, TAGS[i].t, 0.5, outExpo);
      set(el, { opacity: p, transform: `translateY(${(1 - p) * 26 + lift * 0.5}px)` });
    });
  },
});
