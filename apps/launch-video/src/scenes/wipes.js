import { h, set } from '../lib/dom.js';
import { clamp, lerp, whip } from '../lib/ease.js';
import { defineScene } from '../lib/scene.js';
import { C, LIGHT } from '../theme.js';
import { DURATION, WIPES } from '../timeline.js';

const K = 420;
const HALF = 0.44;
const TONES = { paper: C.paper, void: C.void, chrome: LIGHT.chrome };

// A stack of chevron bands, echoing the logo's darts, sweeps left → right.
const BANDS = [
  { lead: 0, width: 1920 + K * 2, color: null },
  { lead: 150, width: 150, color: C.brand },
  { lead: 250, width: 70, color: '#f4f4f4' },
];

function chevron(a, b) {
  return `polygon(${a}px 0, ${b}px 0, ${b + K}px 50%, ${b}px 100%, ${a}px 100%, ${a + K}px 50%)`;
}

export default defineScene({
  name: 'wipes',
  span: [0, DURATION],
  z: 800,
  sfx: WIPES.map((w) => [w.t - 0.2, 'wipe', 1]),
  build(root) {
    set(root, { pointerEvents: 'none' });
    const layers = WIPES.map(() => {
      const bands = BANDS.map(() => h('div', { class: 'fill', style: 'display:none' }));
      root.append(...bands.slice().reverse());
      return bands;
    });
    return { layers };
  },
  update(s, t) {
    WIPES.forEach((w, i) => {
      const p = clamp((t - (w.t - HALF)) / (HALF * 2));
      const active = p > 0 && p < 1;
      s.layers[i].forEach((el, j) => {
        if (!active) {
          set(el, { display: 'none' });
          return;
        }
        const band = BANDS[j];
        const e = whip(p);
        const trail = lerp(-BANDS[0].width - K, 1920 + K, e);
        const lead = trail + BANDS[0].width;
        const a = j === 0 ? trail : lead + band.lead - band.width;
        const b = j === 0 ? lead : lead + band.lead;
        set(el, {
          display: 'block',
          background: band.color ?? TONES[w.tone],
          clipPath: chevron(a, b),
        });
      });
    });
  },
});
