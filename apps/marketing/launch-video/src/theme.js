export const W = 1920;
export const H = 1080;
export const FPS = 60;

export const C = {
  void: '#050505',
  ink: '#0a0a0a',
  ink2: '#141414',
  ink3: '#1d1d1d',
  paper: '#f6f3ec',
  cream: '#fffdf6',
  white: '#fcfcfc',
  snow: '#f2f2f2',
  brand: 'oklch(0.6 0.2 25)',
  brandDark: 'oklch(0.63 0.2 25)',
  brandSoft: 'oklch(0.6 0.2 25 / 0.14)',
  hot: '#ff4f1a',
  amber: 'oklch(0.78 0.14 60)',
  blue: 'oklch(0.623 0.214 259.815)',
  blueSoft: 'oklch(0.623 0.214 259.815 / 0.1)',
  cyan: 'oklch(0.715 0.143 215.221)',
  green: 'oklch(0.55 0.13 165)',
  emerald: 'oklch(0.696 0.17 162.48)',
  muted: 'oklch(0.5 0 0)',
  mutedDark: 'oklch(0.68 0 0)',
};

export const LIGHT = {
  chrome: 'oklch(0.975 0 0)',
  background: 'oklch(0.99 0 0)',
  card: 'oklch(1 0 0)',
  fg: 'oklch(0.145 0 0)',
  muted: 'oklch(0.955 0 0)',
  mutedFg: 'oklch(0.5 0 0)',
  border: 'oklch(0.92 0 0)',
  hairline: 'oklch(0.885 0 0)',
  popover: 'oklch(1 0 0)',
  ring: 'oklch(0 0 0 / 0.06)',
};

export const DARK = {
  chrome: 'oklch(0.1 0 0)',
  background: 'oklch(0.175 0 0)',
  card: 'oklch(0.19 0 0)',
  fg: 'oklch(0.93 0 0)',
  muted: 'oklch(0.23 0 0)',
  mutedFg: 'oklch(0.68 0 0)',
  border: 'oklch(1 0 0 / 0.1)',
  hairline: 'oklch(1 0 0 / 0.07)',
  popover: 'oklch(0.205 0 0)',
  ring: 'oklch(1 0 0 / 0.08)',
};

export const SHADOW = {
  edge: '0 0 0 0.5px oklch(0 0 0 / 0.06), 0 1px 0 oklch(0 0 0 / 0.025)',
  floating:
    '0 0 0 0.5px oklch(0 0 0 / 0.08), 0 1px 1px oklch(0 0 0 / 0.04), 0 4px 16px -2px oklch(0 0 0 / 0.08)',
  overlay:
    '0 0 0 0.5px oklch(0 0 0 / 0.1), 0 8px 28px -4px oklch(0 0 0 / 0.18), 0 24px 64px -12px oklch(0 0 0 / 0.2)',
  hero: '0 30px 80px -20px oklch(0 0 0 / 0.55), 0 10px 30px -10px oklch(0 0 0 / 0.35)',
};

export const FONT = {
  sans: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

const BASE_LOADS = [
  ...[300, 400, 500, 600, 700, 800, 900].map((w) => `${w} 40px Geist`),
  ...[400, 500, 600, 700].map((w) => `${w} 40px "Geist Mono"`),
];

// `fonts` lists a film's extra Google Fonts as { family, weight, italic? }.
export const fontLoads = (fonts = []) => [
  ...BASE_LOADS,
  ...fonts.map((f) => `${f.italic ? 'italic ' : ''}${f.weight ?? 400} 40px "${f.family}"`),
];

export function fontCss(fonts = []) {
  const extra = new Map();
  for (const f of fonts) {
    const e = extra.get(f.family) ?? { weights: new Set(), italic: false };
    e.weights.add(f.weight ?? 400);
    e.italic ||= !!f.italic;
    extra.set(f.family, e);
  }
  const fams = [
    ['Geist', 'wght@100..900'],
    ['Geist Mono', 'wght@100..900'],
  ];
  for (const [family, e] of extra) {
    if (family === 'Geist' || family === 'Geist Mono') continue;
    const ws = [...e.weights].sort((a, b) => a - b);
    fams.push([
      family,
      e.italic
        ? `ital,wght@${[...ws.map((w) => `0,${w}`), ...ws.map((w) => `1,${w}`)].join(';')}`
        : `wght@${ws.join(';')}`,
    ]);
  }
  const q = fams.map(([f, a]) => `family=${f.replace(/ /g, '+')}:${a}`).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=block`;
}
