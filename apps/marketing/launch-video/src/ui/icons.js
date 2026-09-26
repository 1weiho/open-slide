import { h } from '../lib/dom.js';
import { ICONS } from './icon-data.js';

export function icon(
  name,
  { size = 16, stroke = 1.75, color = 'currentColor', fill = 'none' } = {},
) {
  const node = ICONS[name];
  if (!node) throw new Error(`unknown icon ${name}`);
  return h(
    'svg',
    {
      class: 'ico',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill,
      stroke: color,
      'stroke-width': stroke,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    node.map(([tag, attrs]) => h(tag, attrs)),
  );
}
