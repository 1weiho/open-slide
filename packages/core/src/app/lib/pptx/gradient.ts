import { parseCssColor } from './units';

export interface GradientStop {
  hex: string;
  alpha: number;
  pos: number;
}

export interface ParsedGradient {
  // `linear` and `radial` map to native OOXML gradient fills; `conic` has no
  // native OOXML equivalent (PowerPoint only supports linear/path fills) and is
  // kept only so callers can fall back to a solid first stop; `other` is any
  // gradient we couldn't classify.
  kind: 'linear' | 'radial' | 'conic' | 'other';
  angleDeg: number;
  stops: GradientStop[];
}

/** Injectable resolver for modern color syntaxes; defaults to the canvas round-trip in units. */
export type ColorNormalizer = (css: string) => string | null;

const SIDE_ANGLES: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
  'top right': 45,
  'right top': 45,
  'bottom right': 135,
  'right bottom': 135,
  'bottom left': 225,
  'left bottom': 225,
  'top left': 315,
  'left top': 315,
};

export function cssAngleToOoxml(cssDeg: number): number {
  const norm = (((cssDeg - 90) % 360) + 360) % 360;
  return Math.round(norm * 60000);
}

export function parseGradient(css: string, normalize?: ColorNormalizer): ParsedGradient | null {
  if (!css || css === 'none') return null;
  const linear = css.match(/(repeating-)?linear-gradient\(([\s\S]*)\)/i);
  const radial = css.match(/(repeating-)?(radial|conic)-gradient\(([\s\S]*)\)/i);
  if (!linear && !radial) return null;

  const inner = linear ? linear[2] : (radial as RegExpMatchArray)[3];
  const parts = splitTopLevel(inner);

  let angleDeg = 180;
  let stopParts = parts;
  if (linear && parts.length > 0) {
    const head = parts[0].trim();
    const deg = head.match(/^(-?[\d.]+)deg$/i);
    if (deg) {
      angleDeg = Number.parseFloat(deg[1]);
      stopParts = parts.slice(1);
    } else if (/^to\s/i.test(head)) {
      const side = head
        .replace(/^to\s+/i, '')
        .trim()
        .toLowerCase();
      angleDeg = SIDE_ANGLES[side] ?? 180;
      stopParts = parts.slice(1);
    } else if (/^[\d.]+(turn|rad|grad)$/i.test(head)) {
      angleDeg = toDeg(head);
      stopParts = parts.slice(1);
    }
  } else if (radial) {
    // Drop the shape/position head (e.g. "circle at center") if it carries no color.
    if (parts.length > 0 && !hasColor(parts[0], normalize)) stopParts = parts.slice(1);
  }

  const stops = parseStops(stopParts, normalize);
  if (stops.length === 0) return null;

  let kind: ParsedGradient['kind'] = 'other';
  if (linear) kind = 'linear';
  else if (radial) kind = radial[2].toLowerCase() === 'conic' ? 'conic' : 'radial';
  return { kind, angleDeg, stops };
}

/** Splits a "color [position]" gradient stop into its color expression and %-position. */
function splitColorAndPos(part: string): { color: string; pos: number | null } {
  const p = part.trim();
  let color = p;
  let rest = '';
  // A modern color function (oklch(), rgb(), color(), …) is wrapped in parens, so
  // anything after the final ')' is the position. Otherwise (named/hex color) the
  // position is whatever follows the first whitespace.
  const lastParen = p.lastIndexOf(')');
  if (lastParen >= 0) {
    color = p.slice(0, lastParen + 1).trim();
    rest = p.slice(lastParen + 1).trim();
  } else {
    const sp = p.search(/\s/);
    if (sp >= 0) {
      color = p.slice(0, sp).trim();
      rest = p.slice(sp).trim();
    }
  }
  const posMatch = rest.match(/(-?[\d.]+)%/);
  return { color, pos: posMatch ? Number.parseFloat(posMatch[1]) : null };
}

function hasColor(part: string, normalize?: ColorNormalizer): boolean {
  const { color } = splitColorAndPos(part);
  return parseCssColor(color, normalize) !== null;
}

function parseStops(parts: string[], normalize?: ColorNormalizer): GradientStop[] {
  const raw = parts
    .map((p) => {
      const { color: colorExpr, pos } = splitColorAndPos(p);
      const color = parseCssColor(colorExpr, normalize);
      if (!color) return null;
      return { hex: color.hex, alpha: color.alpha, pos };
    })
    .filter((s): s is { hex: string; alpha: number; pos: number | null } => s !== null);

  const n = raw.length;
  return raw.map((s, i) => ({
    hex: s.hex,
    alpha: s.alpha,
    pos: s.pos ?? (n <= 1 ? 0 : (i / (n - 1)) * 100),
  }));
}

export function buildGradFillXml(grad: ParsedGradient): string {
  const gs = grad.stops
    .map((s) => {
      const pos = Math.round(Math.max(0, Math.min(100, s.pos)) * 1000);
      const clr =
        s.alpha < 1
          ? `<a:srgbClr val="${s.hex}"><a:alpha val="${Math.round(s.alpha * 100000)}"/></a:srgbClr>`
          : `<a:srgbClr val="${s.hex}"/>`;
      return `<a:gs pos="${pos}">${clr}</a:gs>`;
    })
    .join('');
  // Radial gradients use a centered "circle" path fill; everything else is linear.
  const shade =
    grad.kind === 'radial'
      ? '<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>'
      : `<a:lin ang="${cssAngleToOoxml(grad.angleDeg)}" scaled="1"/>`;
  return `<a:gradFill><a:gsLst>${gs}</a:gsLst>${shade}</a:gradFill>`;
}

export function patchSlideXmlGradients(xml: string, gradients: Map<string, string>): string {
  if (gradients.size === 0) return xml;
  return xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const name = shape.match(/<p:cNvPr[^>]*\bname="([^"]+)"/);
    if (!name) return shape;
    const gradFill = gradients.get(name[1]);
    if (!gradFill) return shape;
    return shape.replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/, gradFill);
  });
}

function splitTopLevel(input: string): string[] {
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

function toDeg(value: string): number {
  const num = Number.parseFloat(value);
  if (/turn$/i.test(value)) return num * 360;
  if (/rad$/i.test(value)) return (num * 180) / Math.PI;
  if (/grad$/i.test(value)) return num * 0.9;
  return num;
}
