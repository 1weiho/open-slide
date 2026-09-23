import type { Geometry } from './scene';

export type Rgba = { r: number; g: number; b: number; a: number };
export type ColorParser = (value: string) => Rgba | null;

export function splitTopLevel(value: string, separator = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: string | null = null;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === separator && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter((p) => p.length > 0);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function channel(token: string): number {
  const t = token.trim();
  if (t.endsWith('%')) return Math.round((Number.parseFloat(t) / 100) * 255);
  return Math.round(Number.parseFloat(t));
}

function alphaChannel(token: string | undefined): number {
  if (token === undefined) return 1;
  const t = token.trim();
  if (t.endsWith('%')) return clamp01(Number.parseFloat(t) / 100);
  return clamp01(Number.parseFloat(t));
}

export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const expand = (s: string) => Number.parseInt(s.length === 1 ? s + s : s, 16);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: expand(hex[0]),
        g: expand(hex[1]),
        b: expand(hex[2]),
        a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: expand(hex.slice(0, 2)),
        g: expand(hex.slice(2, 4)),
        b: expand(hex.slice(4, 6)),
        a: hex.length === 8 ? expand(hex.slice(6, 8)) / 255 : 1,
      };
    }
    return null;
  }
  const m = /^rgba?\((.*)\)$/.exec(value);
  if (!m) return null;
  const body = m[1].trim();
  let parts: string[];
  let alpha: string | undefined;
  if (body.includes(',')) {
    parts = body.split(',').map((p) => p.trim());
    alpha = parts[3];
    parts = parts.slice(0, 3);
  } else {
    const [channels, a] = body.split('/');
    parts = channels.trim().split(/\s+/);
    alpha = a?.trim();
  }
  if (parts.length !== 3) return null;
  const [r, g, b] = parts.map(channel);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a: alphaChannel(alpha) };
}

export function isVisibleColor(color: Rgba | null): color is Rgba {
  return color !== null && color.a > 0.002;
}

export function toHex(color: Rgba): string {
  const h = (n: number) =>
    Math.min(255, Math.max(0, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `${h(color.r)}${h(color.g)}${h(color.b)}`.toUpperCase();
}

export function withAlpha(color: Rgba, factor: number): Rgba {
  return factor >= 1 ? color : { ...color, a: color.a * factor };
}

export function parsePx(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type Mat = readonly [number, number, number, number, number, number];
export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

export function parseTransform(value: string | null | undefined): Mat | null {
  if (!value || value === 'none') return IDENTITY;
  const m2 = /^matrix\((.*)\)$/.exec(value.trim());
  if (m2) {
    const n = m2[1].split(',').map((s) => Number.parseFloat(s));
    if (n.length !== 6 || n.some((x) => !Number.isFinite(x))) return null;
    return [n[0], n[1], n[2], n[3], n[4], n[5]];
  }
  const m3 = /^matrix3d\((.*)\)$/.exec(value.trim());
  if (m3) {
    const n = m3[1].split(',').map((s) => Number.parseFloat(s));
    if (n.length !== 16 || n.some((x) => !Number.isFinite(x))) return null;
    const eps = 1e-6;
    const flat =
      Math.abs(n[2]) < eps &&
      Math.abs(n[3]) < eps &&
      Math.abs(n[6]) < eps &&
      Math.abs(n[7]) < eps &&
      Math.abs(n[8]) < eps &&
      Math.abs(n[9]) < eps &&
      Math.abs(n[10] - 1) < eps &&
      Math.abs(n[11]) < eps &&
      Math.abs(n[14]) < eps &&
      Math.abs(n[15] - 1) < eps;
    if (!flat) return null;
    return [n[0], n[1], n[4], n[5], n[12], n[13]];
  }
  return null;
}

export function multiply(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function translation(x: number, y: number): Mat {
  return [1, 0, 0, 1, x, y];
}

export function rotationDeg(deg: number): Mat {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, -s, c, 0, 0];
}

export function scaling(sx: number, sy: number): Mat {
  return [sx, 0, 0, sy, 0, 0];
}

export function applyToPoint(m: Mat, x: number, y: number): { x: number; y: number } {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

export function isIdentity(m: Mat, eps = 1e-4): boolean {
  return (
    Math.abs(m[0] - 1) < eps &&
    Math.abs(m[1]) < eps &&
    Math.abs(m[2]) < eps &&
    Math.abs(m[3] - 1) < eps &&
    Math.abs(m[4]) < eps &&
    Math.abs(m[5]) < eps
  );
}

export function isTranslation(m: Mat, eps = 1e-4): boolean {
  return (
    Math.abs(m[0] - 1) < eps &&
    Math.abs(m[1]) < eps &&
    Math.abs(m[2]) < eps &&
    Math.abs(m[3] - 1) < eps
  );
}

export type Decomposed = {
  rotationDeg: number;
  scaleX: number;
  scaleY: number;
  flipV: boolean;
  skewed: boolean;
};

export function decompose(m: Mat): Decomposed | null {
  const [a, b, c, d] = m;
  const scaleX = Math.hypot(a, b);
  if (scaleX < 1e-9) return null;
  const det = a * d - b * c;
  const scaleY = det / scaleX;
  if (Math.abs(scaleY) < 1e-9) return null;
  const skew = (a * c + b * d) / (scaleX * scaleX);
  const rotation = (Math.atan2(b, a) * 180) / Math.PI;
  return {
    rotationDeg: rotation,
    scaleX,
    scaleY: Math.abs(scaleY),
    flipV: scaleY < 0,
    skewed: Math.abs(skew) > 1e-3,
  };
}

export function transformedBounds(
  m: Mat,
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const pts = [
    applyToPoint(m, x, y),
    applyToPoint(m, x + w, y),
    applyToPoint(m, x, y + h),
    applyToPoint(m, x + w, y + h),
  ];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

export function parseAngleDeg(token: string): number | null {
  const m = /^(-?[\d.]+)(deg|turn|rad|grad)$/.exec(token.trim());
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  switch (m[2]) {
    case 'deg':
      return n;
    case 'turn':
      return n * 360;
    case 'rad':
      return (n * 180) / Math.PI;
    case 'grad':
      return n * 0.9;
  }
  return null;
}

export type GradientStop = { color: Rgba; pos: number };
export type LinearGradient = { angleDeg: number; stops: GradientStop[] };

function sideOrCornerAngle(spec: string, w: number, h: number): number | null {
  const words = spec
    .replace(/^to\s+/, '')
    .split(/\s+/)
    .sort()
    .join(' ');
  const corner = (Math.atan2(w, h) * 180) / Math.PI;
  switch (words) {
    case 'top':
      return 0;
    case 'right':
      return 90;
    case 'bottom':
      return 180;
    case 'left':
      return 270;
    case 'right top':
      return corner;
    case 'bottom right':
      return 180 - corner;
    case 'bottom left':
      return 180 + corner;
    case 'left top':
      return 360 - corner;
  }
  return null;
}

export function gradientLineLength(angleDeg: number, w: number, h: number): number {
  const r = (angleDeg * Math.PI) / 180;
  return Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
}

export function parseLinearGradient(
  layer: string,
  w: number,
  h: number,
  colorParser: ColorParser = parseColor,
): LinearGradient | null {
  const m = /^linear-gradient\((.*)\)$/s.exec(layer.trim());
  if (!m) return null;
  const args = splitTopLevel(m[1]);
  if (args.length < 2) return null;
  let angle = 180;
  let first = args[0];
  const explicitAngle = parseAngleDeg(first);
  if (explicitAngle !== null) {
    angle = explicitAngle;
    args.shift();
  } else if (first.startsWith('to ')) {
    const a = sideOrCornerAngle(first, w, h);
    if (a === null) return null;
    angle = a;
    args.shift();
  }
  first = args[0];
  const length = gradientLineLength(angle, w, h) || 1;
  const raw: { color: Rgba; pos: number | null }[] = [];
  for (const arg of args) {
    const tokens = splitTopLevel(arg, ' ');
    const colorToken = tokens.find((t) => colorParser(t) !== null);
    if (!colorToken) {
      if (tokens.length === 1 && /^[\d.]+(%|px)$/.test(tokens[0])) continue;
      return null;
    }
    const color = colorParser(colorToken);
    if (!color) return null;
    const positions = tokens.filter((t) => t !== colorToken);
    if (positions.length === 0) {
      raw.push({ color, pos: null });
      continue;
    }
    for (const p of positions) {
      const pos = parseStopPosition(p, length);
      if (pos === null) return null;
      raw.push({ color, pos });
    }
  }
  if (raw.length < 2) return null;
  if (raw[0].pos === null) raw[0].pos = 0;
  if (raw[raw.length - 1].pos === null) raw[raw.length - 1].pos = 1;
  let running = 0;
  for (let i = 0; i < raw.length; i++) {
    const stop = raw[i];
    if (stop.pos === null) {
      let j = i + 1;
      while (raw[j].pos === null) j++;
      const end = raw[j].pos as number;
      const count = j - i + 1;
      for (let k = i; k < j; k++) raw[k].pos = running + ((end - running) * (k - i + 1)) / count;
    }
    const pos = Math.max(running, stop.pos as number);
    stop.pos = pos;
    running = pos;
  }
  const stops = raw.map((s) => ({ color: s.color, pos: clamp01(s.pos as number) }));
  return { angleDeg: ((angle % 360) + 360) % 360, stops };
}

function parseStopPosition(token: string, length: number): number | null {
  const t = token.trim();
  if (t.endsWith('%')) return Number.parseFloat(t) / 100;
  if (t.endsWith('px')) return Number.parseFloat(t) / length;
  if (t === '0') return 0;
  return null;
}

export type Shadow = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: Rgba;
  inset: boolean;
};

export function parseShadows(value: string, colorParser: ColorParser = parseColor): Shadow[] {
  if (!value || value === 'none') return [];
  const out: Shadow[] = [];
  for (const layer of splitTopLevel(value)) {
    const tokens = splitTopLevel(layer, ' ');
    let inset = false;
    let color: Rgba | null = null;
    const lengths: number[] = [];
    for (const token of tokens) {
      if (token === 'inset') inset = true;
      else if (/^-?[\d.]+(px)?$/.test(token)) lengths.push(Number.parseFloat(token));
      else {
        const c = colorParser(token);
        if (c) color = c;
      }
    }
    if (!color || lengths.length < 2) continue;
    out.push({
      x: lengths[0],
      y: lengths[1],
      blur: Math.max(0, lengths[2] ?? 0),
      spread: lengths[3] ?? 0,
      color,
      inset,
    });
  }
  return out;
}

export type CornerRadius = { x: number; y: number };
export type Radii = [CornerRadius, CornerRadius, CornerRadius, CornerRadius];

export function parseCornerRadius(value: string, w: number, h: number): CornerRadius {
  const parts = value.trim().split(/\s+/);
  const resolve = (token: string, base: number) =>
    token.endsWith('%') ? (Number.parseFloat(token) / 100) * base : parsePx(token);
  const x = Math.max(0, resolve(parts[0] ?? '0', w));
  const y = Math.max(0, resolve(parts[1] ?? parts[0] ?? '0', h));
  return { x, y };
}

export function normalizeRadii(radii: Radii, w: number, h: number): Radii {
  const [tl, tr, br, bl] = radii;
  const factors = [
    w / Math.max(1e-9, tl.x + tr.x),
    h / Math.max(1e-9, tr.y + br.y),
    w / Math.max(1e-9, br.x + bl.x),
    h / Math.max(1e-9, bl.y + tl.y),
  ];
  const f = Math.min(1, ...factors);
  const scale = (c: CornerRadius): CornerRadius => ({ x: c.x * f, y: c.y * f });
  return [scale(tl), scale(tr), scale(br), scale(bl)];
}

export function hasRadius(radii: Radii): boolean {
  return radii.some((c) => c.x > 0.01 && c.y > 0.01);
}

export function geometryFor(radii: Radii, w: number, h: number): Geometry {
  if (!hasRadius(radii)) return { kind: 'rect' };
  const [tl, ...rest] = radii;
  const uniform = rest.every((c) => Math.abs(c.x - tl.x) < 0.5 && Math.abs(c.y - tl.y) < 0.5);
  if (!uniform) return { kind: 'custom', radii };
  if (tl.x >= w / 2 - 0.5 && tl.y >= h / 2 - 0.5) return { kind: 'ellipse' };
  if (Math.abs(tl.x - tl.y) < 0.5) return { kind: 'roundRect', radius: tl.x };
  return { kind: 'custom', radii };
}

export function parseBlurPx(filter: string): number {
  if (!filter || filter === 'none') return 0;
  let total = 0;
  for (const m of filter.matchAll(/blur\(\s*(-?[\d.]+)px\s*\)/g)) total += Number.parseFloat(m[1]);
  return total;
}

export function parseFontFamilies(value: string): string[] {
  return splitTopLevel(value).map((f) => f.replace(/^["']|["']$/g, '').trim());
}

export function applyTextTransform(text: string, transform: string): string {
  if (transform.includes('uppercase')) return text.toUpperCase();
  if (transform.includes('lowercase')) return text.toLowerCase();
  if (transform.includes('capitalize'))
    return text.replace(/(^|[\s(\-"'])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
  return text;
}
