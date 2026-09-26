import { h } from '../lib/dom.js';

let uid = 0;

// Vector take on the open-slide app icon: four darts converging to the right,
// the largest split along its axis. 512 × 512 units, like the PNG.
const DARTS = [
  { x: 97, hh: 23, len: 40, notch: 0 },
  { x: 128, hh: 57, len: 78, notch: 26 },
  { x: 172, hh: 97, len: 128, notch: 50 },
  { x: 232, hh: 168, len: 196, notch: 86, split: true },
];
const CY = 245;

function dartPath({ x, hh, len, notch }, half) {
  const tip = [x + len, CY];
  const top = [x, CY - hh];
  const bot = [x, CY + hh];
  const n = [x + notch, CY];
  const g = 3.5;
  if (half === 'top') return `M${top} L${tip[0]},${CY - g} L${n[0] + g},${CY - g} Z`;
  if (half === 'bottom') return `M${bot} L${tip[0]},${CY + g} L${n[0] + g},${CY + g} Z`;
  return `M${top} L${tip} L${bot} L${n} Z`;
}

export function logoMark({ size = 160, tile = true, glow = true } = {}) {
  const id = `lg${uid++}`;
  const defs = h(
    'defs',
    h(
      'linearGradient',
      { id: `${id}-metal`, x1: 0, y1: 0, x2: 0.35, y2: 1 },
      h('stop', { offset: '0', 'stop-color': '#ffffff' }),
      h('stop', { offset: '0.38', 'stop-color': '#c9ccd2' }),
      h('stop', { offset: '0.55', 'stop-color': '#eef0f3' }),
      h('stop', { offset: '1', 'stop-color': '#7d828b' }),
    ),
    h(
      'linearGradient',
      { id: `${id}-metal2`, x1: 0, y1: 0, x2: 0.3, y2: 1 },
      h('stop', { offset: '0', 'stop-color': '#dfe2e7' }),
      h('stop', { offset: '0.5', 'stop-color': '#9ea3ab' }),
      h('stop', { offset: '1', 'stop-color': '#5b6068' }),
    ),
    h(
      'radialGradient',
      { id: `${id}-tile`, cx: 0.45, cy: 0.25, r: 0.9 },
      h('stop', { offset: '0', 'stop-color': '#24262c' }),
      h('stop', { offset: '0.6', 'stop-color': '#121317' }),
      h('stop', { offset: '1', 'stop-color': '#08080a' }),
    ),
    h(
      'radialGradient',
      { id: `${id}-glow`, cx: 0.5, cy: 0.5, r: 0.5 },
      h('stop', { offset: '0', 'stop-color': '#dbe8ff', 'stop-opacity': '0.95' }),
      h('stop', { offset: '0.35', 'stop-color': '#8fb6ff', 'stop-opacity': '0.45' }),
      h('stop', { offset: '1', 'stop-color': '#5b8cff', 'stop-opacity': '0' }),
    ),
  );
  const tileEl = tile
    ? h('rect', { x: 0, y: 0, width: 512, height: 512, rx: 112, fill: `url(#${id}-tile)` })
    : null;
  const tileEdge = tile
    ? h('rect', {
        x: 1,
        y: 1,
        width: 510,
        height: 510,
        rx: 111,
        fill: 'none',
        stroke: 'rgb(255 255 255 / 0.08)',
        'stroke-width': 2,
      })
    : null;
  const darts = DARTS.map((d, i) => {
    const parts = d.split
      ? [
          h('path', { d: dartPath(d, 'top'), fill: `url(#${id}-metal)` }),
          h('path', { d: dartPath(d, 'bottom'), fill: `url(#${id}-metal2)` }),
        ]
      : [h('path', { d: dartPath(d), fill: i % 2 ? `url(#${id}-metal2)` : `url(#${id}-metal)` })];
    return h('g', { 'data-dart': i }, parts);
  });
  const glowEl = glow
    ? h('ellipse', { cx: 300, cy: CY, rx: 120, ry: 34, fill: `url(#${id}-glow)`, opacity: 0.85 })
    : null;
  defs.append(
    h(
      'clipPath',
      { id: `${id}-clip` },
      DARTS.flatMap((d) =>
        d.split
          ? [h('path', { d: dartPath(d, 'top') }), h('path', { d: dartPath(d, 'bottom') })]
          : [h('path', { d: dartPath(d) })],
      ),
    ),
    h(
      'linearGradient',
      { id: `${id}-sheen`, x1: 0, y1: 0, x2: 1, y2: 0 },
      h('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0' }),
      h('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0.95' }),
      h('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }),
    ),
  );
  const sheen = h('polygon', {
    points: '0,-40 90,-40 30,560 -60,560',
    fill: `url(#${id}-sheen)`,
  });
  const sheenGroup = h('g', { 'clip-path': `url(#${id}-clip)` }, sheen);
  const svg = h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 512 512',
      style: 'display:block;overflow:visible',
    },
    defs,
    tileEl,
    tileEdge,
    darts,
    sheenGroup,
    glowEl,
  );
  return {
    el: svg,
    darts,
    sheen,
    tile: tileEl,
    tileEdge,
    glow: glowEl,
    geometry: DARTS,
    cy: CY,
  };
}

export function logoImg(size = 24, radius = 6) {
  return h('img', {
    src: '/@repo/apps/web/public/open-slide.png',
    width: size,
    height: size,
    style: `display:block;width:${size}px;height:${size}px;border-radius:${radius}px;box-shadow:0 0 0 1px rgb(0 0 0 / 0.08)`,
  });
}
