import { h } from '../lib/dom.js';
import { C, FONT, LIGHT, SHADOW } from '../theme.js';
import { icon } from './icons.js';

export const P = LIGHT;

export function iconBtn(name, { size = 28, iconSize = 15, active = false, color } = {}) {
  return h(
    'div',
    {
      style: `width:${size}px;height:${size}px;border-radius:5px;display:grid;place-items:center;flex:none;color:${color ?? (active ? P.fg : 'oklch(0.145 0 0 / 0.72)')};${active ? `background:${P.card};box-shadow:${SHADOW.edge}` : ''}`,
    },
    icon(name, { size: iconSize }),
  );
}

export function divider(height = 20) {
  return h('div', {
    style: `width:1px;height:${height}px;background:${P.hairline};margin:0 6px;flex:none`,
  });
}

export function kbd(label, { dark = false } = {}) {
  return h('span', {
    class: 'mono',
    text: label,
    style: `font-size:9.5px;line-height:1;padding:3px 5px;border-radius:3px;border:1px solid ${dark ? 'rgb(255 255 255 / 0.14)' : P.hairline};color:${dark ? 'rgb(255 255 255 / 0.6)' : P.mutedFg};background:${dark ? 'transparent' : P.card}`,
  });
}

export function eyebrow(label, extra = '') {
  return h('div', {
    class: 'eyebrow',
    text: label,
    style: `color:${P.mutedFg};${extra}`,
  });
}

export function folio(label, extra = '') {
  return h('span', {
    class: 'mono nums',
    text: label,
    style: `font-size:10.5px;letter-spacing:0.08em;color:${P.mutedFg};${extra}`,
  });
}

export function textBtn(label, iconName, { active = false, gap = 6, extra = '' } = {}) {
  return h(
    'div',
    {
      style: `height:28px;padding:0 9px;border-radius:5px;display:flex;align-items:center;gap:${gap}px;font-size:12.5px;font-weight:500;color:${P.fg};${active ? `background:${P.muted}` : ''};flex:none;${extra}`,
    },
    iconName ? icon(iconName, { size: 14 }) : null,
    h('span', { text: label }),
  );
}

export function field({ prefix, value, unit, width = '100%', iconName, extra = '' }) {
  return h(
    'div',
    {
      style: `height:28px;width:${width};border-radius:5px;border:1px solid ${P.border};background:${P.card};display:flex;align-items:center;gap:6px;padding:0 8px;${extra}`,
    },
    iconName ? h('span', { style: `color:${P.mutedFg}` }, icon(iconName, { size: 13 })) : null,
    prefix
      ? h('span', { class: 'mono', text: prefix, style: `font-size:10px;color:${P.mutedFg}` })
      : null,
    h('span', {
      class: 'mono nums fv',
      text: value,
      style: `flex:1;text-align:right;font-size:11px;color:${P.fg}`,
    }),
    unit
      ? h('span', {
          class: 'mono',
          text: unit,
          style: `font-size:9.5px;text-transform:uppercase;color:${P.mutedFg}`,
        })
      : null,
  );
}

export function toggleGroup(icons, pressed = []) {
  return h(
    'div',
    { style: 'display:flex' },
    icons.map((name, i) =>
      h(
        'div',
        {
          style: `width:28px;height:28px;display:grid;place-items:center;border:1px solid ${P.border};margin-left:${i ? -1 : 0}px;${pressed.includes(i) ? `background:${P.fg};color:#fff;border-color:${P.fg}` : `background:${P.card};color:${P.fg}`};border-radius:${i === 0 ? '5px 0 0 5px' : i === icons.length - 1 ? '0 5px 5px 0' : '0'}`,
        },
        icon(name, { size: 14 }),
      ),
    ),
  );
}

export function swatch(color, { size = 28, inner = 16 } = {}) {
  const chip = h('div', {
    style: `width:${inner}px;height:${inner}px;border-radius:3px;background:${color};box-shadow:inset 0 0 0 1px oklch(0.145 0 0 / 0.15)`,
  });
  return {
    chip,
    el: h(
      'div',
      {
        style: `width:${size}px;height:${size}px;border-radius:5px;border:1px solid ${P.border};background:${P.card};display:grid;place-items:center;flex:none`,
      },
      chip,
    ),
  };
}

export const checker =
  'background-color:#fff;background-image:linear-gradient(45deg,#e6e6e6 25%,transparent 25%,transparent 75%,#e6e6e6 75%),linear-gradient(45deg,#e6e6e6 25%,transparent 25%,transparent 75%,#e6e6e6 75%);background-size:8px 8px;background-position:0 0,4px 4px';

export function keycap(label, { size = 64, dark = false } = {}) {
  return h('div', {
    text: label,
    style: `min-width:${size}px;height:${size}px;padding:0 ${size * 0.28}px;border-radius:${size * 0.22}px;display:grid;place-items:center;font-family:${FONT.sans};font-weight:600;font-size:${size * 0.42}px;color:${dark ? '#f4f4f4' : C.ink};background:${dark ? 'linear-gradient(#2a2a2a,#1b1b1b)' : 'linear-gradient(#ffffff,#f1f1f1)'};box-shadow:0 ${size * 0.06}px 0 ${dark ? '#0a0a0a' : '#cfcfcf'}, 0 ${size * 0.18}px ${size * 0.4}px -${size * 0.1}px rgb(0 0 0 / 0.35), inset 0 0 0 1px ${dark ? 'rgb(255 255 255 / 0.08)' : 'rgb(0 0 0 / 0.08)'}`,
  });
}
