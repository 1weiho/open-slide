import { clamp, impulse } from '../lib/anim.js';
import { h, set, tf } from '../lib/dom.js';

const ARROW = 'M5.5 3.2 L5.5 21.2 L10.1 16.9 L13.1 23.6 L16.2 22.3 L13.3 15.7 L19.6 15.7 Z';

export function cursor({ size = 34, variant = 'arrow' } = {}) {
  const ripple = h('div', {
    style:
      'position:absolute;left:0;top:0;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:2px solid oklch(0.623 0.214 259.815 / 0.9);opacity:0',
  });
  const arrow = h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 26 26',
      style:
        'position:absolute;left:-6px;top:-3px;overflow:visible;filter:drop-shadow(0 3px 5px rgb(0 0 0 / 0.35))',
    },
    h('path', {
      d: ARROW,
      fill: '#111',
      stroke: '#fff',
      'stroke-width': 1.6,
      'stroke-linejoin': 'round',
    }),
  );
  const beam = h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      style: 'position:absolute;left:-17px;top:-17px;overflow:visible;opacity:0',
    },
    h('path', {
      d: 'M9 3h2.5c.3 0 .5.2.5.5V20.5c0 .3-.2.5-.5.5H9m6-18h-2.5c-.3 0-.5.2-.5.5v17c0 .3.2.5.5.5H15',
      fill: 'none',
      stroke: '#fff',
      'stroke-width': 3.2,
      'stroke-linecap': 'round',
    }),
    h('path', {
      d: 'M9 3h2.5c.3 0 .5.2.5.5V20.5c0 .3-.2.5-.5.5H9m6-18h-2.5c-.3 0-.5.2-.5.5v17c0 .3.2.5.5.5H15',
      fill: 'none',
      stroke: '#111',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
    }),
  );
  const body = h('div', { style: 'position:absolute;left:0;top:0' }, arrow, beam);
  const el = h(
    'div',
    { class: 'cursor', style: 'position:absolute;left:0;top:0;z-index:500;pointer-events:none' },
    ripple,
    body,
  );
  if (variant === 'beam') {
    arrow.style.opacity = '0';
    beam.style.opacity = '1';
  }

  return {
    el,
    // clicks: array of times; press dips the pointer and fires a ripple.
    update(t, { x, y, opacity = 1, clicks = [], beam: beamAmt = 0, scale = 1 }) {
      let press = 0;
      let rip = 0;
      let ripT = -1;
      for (const c of clicks) {
        const d = t - c;
        if (d > -0.08 && d < 0.18) press = Math.max(press, 1 - Math.abs(d - 0.02) / 0.12);
        if (d >= 0 && d < 0.5) {
          ripT = d;
          rip = impulse(t, c, 0.18);
        }
      }
      set(el, { transform: tf({ x, y, s: scale }), opacity });
      set(body, { transform: `scale(${1 - 0.14 * clamp(press)})` });
      set(arrow, { opacity: 1 - beamAmt });
      set(beam, { opacity: beamAmt });
      if (ripT >= 0) {
        const s = 0.3 + ripT * 2.6;
        set(ripple, { opacity: rip * 0.9, transform: `scale(${s})` });
      } else set(ripple, { opacity: 0 });
    },
  };
}
