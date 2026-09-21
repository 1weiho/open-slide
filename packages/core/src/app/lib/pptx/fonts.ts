import { parseFontFamilies } from './css';

type Platform = 'mac' | 'win' | 'other';

const GENERIC = new Set([
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'math',
  'emoji',
  'fangsong',
]);

const GENERIC_MAP: Record<Platform, Record<string, string>> = {
  mac: {
    system: 'Helvetica Neue',
    sans: 'Helvetica',
    serif: 'Times New Roman',
    mono: 'Menlo',
    cursive: 'Apple Chancery',
    fantasy: 'Papyrus',
  },
  win: {
    system: 'Segoe UI',
    sans: 'Arial',
    serif: 'Times New Roman',
    mono: 'Consolas',
    cursive: 'Comic Sans MS',
    fantasy: 'Impact',
  },
  other: {
    system: 'Arial',
    sans: 'Arial',
    serif: 'Times New Roman',
    mono: 'Courier New',
    cursive: 'Comic Sans MS',
    fantasy: 'Impact',
  },
};

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const p = (nav.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase();
  if (p.includes('mac') || p.includes('iphone') || p.includes('ipad')) return 'mac';
  if (p.includes('win')) return 'win';
  return 'other';
}

function mapGeneric(family: string, platform: Platform): string {
  const map = GENERIC_MAP[platform];
  switch (family.toLowerCase()) {
    case 'system-ui':
    case '-apple-system':
    case 'blinkmacsystemfont':
    case 'ui-sans-serif':
    case 'ui-rounded':
      return map.system;
    case 'serif':
    case 'ui-serif':
    case 'fangsong':
      return map.serif;
    case 'monospace':
    case 'ui-monospace':
      return map.mono;
    case 'cursive':
      return map.cursive;
    case 'fantasy':
      return map.fantasy;
    case 'math':
      return 'Cambria Math';
    default:
      return map.sans;
  }
}

const PROBE_TEXT = 'mmmmmmmmmmlliWWwwIIi@#0123';
const availability = new Map<string, boolean>();
const resolved = new Map<string, string>();
let probeCtx: CanvasRenderingContext2D | null | undefined;

function probe(): CanvasRenderingContext2D | null {
  if (probeCtx === undefined) {
    probeCtx = document.createElement('canvas').getContext('2d');
  }
  return probeCtx;
}

function widthWith(ctx: CanvasRenderingContext2D, font: string): number {
  ctx.font = `72px ${font}`;
  return ctx.measureText(PROBE_TEXT).width;
}

export function isFontAvailable(family: string): boolean {
  const cached = availability.get(family);
  if (cached !== undefined) return cached;
  const ctx = probe();
  let available = false;
  if (ctx) {
    const quoted = `"${family.replace(/"/g, '')}"`;
    for (const base of ['monospace', 'serif', 'sans-serif']) {
      if (Math.abs(widthWith(ctx, `${quoted}, ${base}`) - widthWith(ctx, base)) > 0.01) {
        available = true;
        break;
      }
    }
  }
  availability.set(family, available);
  return available;
}

/**
 * PowerPoint needs one concrete family name, so pick the first entry of the CSS
 * stack that the browser can actually render, mapping generic keywords to the
 * platform's default face.
 */
export function resolveFontFamily(stack: string): string {
  const cached = resolved.get(stack);
  if (cached) return cached;
  const platform = detectPlatform();
  let result: string | null = null;
  for (const family of parseFontFamilies(stack)) {
    if (!family) continue;
    if (GENERIC.has(family.toLowerCase())) {
      result = mapGeneric(family, platform);
      break;
    }
    if (isFontAvailable(family)) {
      result = family;
      break;
    }
  }
  const out = result ?? mapGeneric('sans-serif', platform);
  resolved.set(stack, out);
  return out;
}
