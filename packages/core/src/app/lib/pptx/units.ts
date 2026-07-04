export function pxToIn(px: number): number {
  return px / 96;
}

export function pxToPt(px: number): number {
  return px * 0.75;
}

export function parseCssColor(
  css: string,
  normalize: (css: string) => string | null = normalizeColorViaCanvas,
): { hex: string; alpha: number } | null {
  const direct = parseRgb(css);
  if (direct) return direct;
  // Modern color syntaxes (oklch/lab/lch/color) are preserved verbatim by
  // getComputedStyle (e.g. Tailwind v4 palettes). Round-trip them through the
  // normalizer to get an rgb() string we can parse.
  const normalized = normalize(css);
  return normalized ? parseRgb(normalized) : null;
}

function parseRgb(css: string): { hex: string; alpha: number } | null {
  const m = css.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(/[,/\s]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const [r, g, b] = parts.map((p) => Number.parseFloat(p));
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
  return { hex: toHex(r) + toHex(g) + toHex(b), alpha: Number.isFinite(alpha) ? alpha : 1 };
}

let canvasCtx: CanvasRenderingContext2D | null | undefined;

function normalizeColorViaCanvas(css: string): string | null {
  if (typeof document === 'undefined') return null;
  if (canvasCtx === undefined) {
    canvasCtx = document.createElement('canvas').getContext('2d');
  }
  if (!canvasCtx) return null;
  // The canvas paints in sRGB and reports fillStyle back as rgb()/rgba(),
  // converting any in-/out-of-gamut modern color the browser understands.
  canvasCtx.fillStyle = '#000';
  canvasCtx.fillStyle = css;
  const resolved = canvasCtx.fillStyle;
  return typeof resolved === 'string' && resolved.startsWith('rgb') ? resolved : null;
}

function toHex(channel: number): string {
  const v = Math.max(0, Math.min(255, Math.round(channel)));
  return v.toString(16).padStart(2, '0').toUpperCase();
}

export function isBold(fontWeight: string): boolean {
  if (fontWeight === 'bold' || fontWeight === 'bolder') return true;
  const n = Number.parseInt(fontWeight, 10);
  return Number.isFinite(n) && n >= 600;
}

export function mapTextAlign(align: string): 'left' | 'center' | 'right' | 'justify' {
  switch (align) {
    case 'center':
      return 'center';
    case 'right':
    case 'end':
      return 'right';
    case 'justify':
      return 'justify';
    default:
      return 'left';
  }
}

export function lineSpacingMultiple(lineHeightPx: number, fontSizePx: number): number | null {
  if (!Number.isFinite(fontSizePx) || fontSizePx <= 0) return null;
  return lineHeightPx / fontSizePx;
}

export function rotationDeg(transform: string): number {
  const m = parseMatrix(transform);
  if (!m) return 0;
  const deg = (Math.atan2(m.b, m.a) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function transformNeedsRaster(transform: string): boolean {
  if (!transform || transform === 'none') return false;
  if (/matrix3d|perspective/i.test(transform)) return true;
  const m = parseMatrix(transform);
  if (!m) return false;
  const { a, b, c, d } = m;
  const sx = Math.hypot(a, b);
  const sy = Math.hypot(c, d);
  if (sx === 0 || sy === 0) return true;
  const dot = a * c + b * d; // 0 when axes are orthogonal (pure rotation/scale)
  if (Math.abs(dot) / (sx * sy) > 1e-3) return true; // skew
  if (Math.abs(sx - sy) > 1e-3) return true; // non-uniform scale
  return false;
}

export function alphaToTransparency(alpha: number): number {
  return Math.round((1 - alpha) * 100);
}

export interface BoxShadow {
  hex: string;
  alpha: number;
  /** offset in px */
  offX: number;
  offY: number;
  /** blur radius in px */
  blur: number;
}

/**
 * Parses a computed `box-shadow` value into the first outer (non-inset) shadow.
 * Returns null for `none`, inset-only shadows, or unparseable input. Spread and
 * any shadows past the first are ignored (PowerPoint shapes take one shadow).
 */
export function parseBoxShadow(value: string): BoxShadow | null {
  if (!value || value === 'none') return null;
  for (const seg of splitTopLevelCommas(value)) {
    const s = seg.trim();
    if (!s || /(^|\s)inset(\s|$)/i.test(s)) continue;
    const colorMatch = s.match(/rgba?\([^)]*\)/i);
    if (!colorMatch) continue;
    const color = parseCssColor(colorMatch[0]);
    if (!color || color.alpha <= 0) continue;
    const nums = (s.replace(colorMatch[0], '').match(/-?[\d.]+px/g) ?? []).map((n) =>
      Number.parseFloat(n),
    );
    if (nums.length < 2) continue;
    const [offX, offY, blur = 0] = nums;
    return { hex: color.hex, alpha: color.alpha, offX, offY, blur };
  }
  return null;
}

function splitTopLevelCommas(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current);
  return out;
}

function parseMatrix(transform: string): { a: number; b: number; c: number; d: number } | null {
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return null;
  const n = m[1].split(',').map((p) => Number.parseFloat(p.trim()));
  if (n.length < 4 || n.some((v) => !Number.isFinite(v))) return null;
  return { a: n[0], b: n[1], c: n[2], d: n[3] };
}
