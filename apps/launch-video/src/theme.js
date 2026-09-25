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

export const SPECIMENS = [
  { family: 'Instrument Serif', category: 'Serif', weight: 400 },
  { family: 'Space Grotesk', category: 'Sans Serif', weight: 600 },
  { family: 'Playfair Display', category: 'Serif', weight: 800 },
  { family: 'Bricolage Grotesque', category: 'Sans Serif', weight: 700 },
  { family: 'Fraunces', category: 'Serif', weight: 600 },
  { family: 'Syne', category: 'Sans Serif', weight: 800 },
  { family: 'Unbounded', category: 'Display', weight: 700 },
  { family: 'DM Serif Display', category: 'Serif', weight: 400 },
  { family: 'JetBrains Mono', category: 'Monospace', weight: 700 },
  { family: 'Bebas Neue', category: 'Display', weight: 400 },
  { family: 'Caveat', category: 'Handwriting', weight: 700 },
  { family: 'Archivo Black', category: 'Sans Serif', weight: 400 },
  { family: 'Young Serif', category: 'Serif', weight: 400 },
  { family: 'Rubik Mono One', category: 'Display', weight: 400 },
  { family: 'Sora', category: 'Sans Serif', weight: 700 },
  { family: 'Instrument Serif', category: 'Serif', weight: 400, italic: true },
];

export const FONT_LOADS = [
  ...[300, 400, 500, 600, 700, 800, 900].map((w) => `${w} 40px Geist`),
  ...[400, 500, 600, 700].map((w) => `${w} 40px "Geist Mono"`),
  ...SPECIMENS.map((s) => `${s.italic ? 'italic ' : ''}${s.weight} 40px "${s.family}"`),
];

export const FONT_CSS = (() => {
  const fams = new Map();
  fams.set('Geist', 'wght@100..900');
  fams.set('Geist Mono', 'wght@100..900');
  for (const s of SPECIMENS) {
    if (s.family === 'Instrument Serif') fams.set(s.family, 'ital@0;1');
    else if (!fams.has(s.family)) fams.set(s.family, `wght@${s.weight}`);
  }
  const q = [...fams].map(([f, a]) => `family=${f.replace(/ /g, '+')}:${a}`).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=block`;
})();
