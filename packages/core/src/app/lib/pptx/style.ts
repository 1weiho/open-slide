import type { PptxColor, PptxRect, PptxRun, PptxStroke } from './model';

let colorContext: CanvasRenderingContext2D | null = null;
let fontContext: CanvasRenderingContext2D | null = null;
const fontCache = new Map<string, boolean>();
let advanceCache = new WeakMap<Element, Map<string, number>>();
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const genericFontFamilies = new Map([
  ['system-ui', 'Arial'],
  ['-apple-system', 'Arial'],
  ['blinkmacsystemfont', 'Arial'],
  ['sans-serif', 'Arial'],
  ['serif', 'Times New Roman'],
  ['monospace', 'Courier New'],
]);
type FontResolution = { fontFace: string; source: string; generic: boolean };

export function resetFontCache(): void {
  fontCache.clear();
  advanceCache = new WeakMap();
}

export function setCanvasFont(context: CanvasRenderingContext2D, font: string): void {
  context.font = '1px serif';
  context.font = font;
  const parsed = context.font;
  context.font = '2px monospace';
  context.font = font;
  if (context.font !== parsed) throw new Error(`The browser rejected a font measurement: ${font}`);
}

export function withCanvasTextStyle<T>(
  context: CanvasRenderingContext2D,
  style: CSSStyleDeclaration | null,
  language: string,
  measure: () => T,
): T {
  const canvas = context.canvas;
  canvas.lang = language;
  Object.assign(canvas.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    visibility: 'hidden',
    // Tracking is accounted for explicitly by the exporter. A connected
    // canvas also inherits body tracking unless these are reset.
    letterSpacing: '0px',
    wordSpacing: '0px',
    textTransform: 'none',
    fontFeatureSettings: style?.fontFeatureSettings ?? 'normal',
    fontVariationSettings: style?.fontVariationSettings ?? 'normal',
    fontVariant: style?.fontVariant ?? 'normal',
    fontVariantNumeric: style?.fontVariantNumeric ?? 'normal',
    fontKerning: style?.fontKerning ?? 'auto',
    fontOpticalSizing: style?.fontOpticalSizing ?? 'auto',
    fontSizeAdjust: style?.fontSizeAdjust ?? 'none',
  });
  // Chromium resolves OpenType settings from the canvas element when setting
  // its font. Detached elements silently lose those settings. Keep this scope
  // synchronous and always remove the measurement surface, including on error.
  document.body.append(canvas);
  try {
    return measure();
  } finally {
    canvas.remove();
  }
}

export function textLanguage(element: Element): string {
  return element.closest('[lang]')?.getAttribute('lang') ?? '';
}

export function trackingCount(value: string): number {
  return [...graphemes.segment(value.replace(/[\r\n\u200b]/g, ''))].length;
}

function fontAvailable(family: string): boolean {
  const cached = fontCache.get(family);
  if (cached !== undefined) return cached;
  fontContext ??= document.createElement('canvas').getContext('2d');
  const context = fontContext;
  if (!context) return false;
  const sample = 'mmmmmmWWWiii0123456789漢字';
  const available = ['monospace', 'serif'].some((fallback) => {
    context.font = `32px ${fallback}`;
    const baseline = context.measureText(sample).width;
    context.font = `32px ${JSON.stringify(family)}, ${fallback}`;
    return Math.abs(context.measureText(sample).width - baseline) > 0.01;
  });
  fontCache.set(family, available);
  return available;
}

function resolveFontFamily(families: string[]): FontResolution {
  for (const family of families) {
    const generic = genericFontFamilies.get(family.toLowerCase());
    if (generic) return { fontFace: generic, source: family, generic: true };
    if (fontAvailable(family)) return { fontFace: family, source: family, generic: false };
  }
  return { fontFace: 'Arial', source: 'Arial', generic: false };
}

function fontFamilies(style: CSSStyleDeclaration): string[] {
  return style.fontFamily.split(',').map((name) => name.trim().replace(/^['"]|['"]$/g, ''));
}

export function canvasFont(
  style: CSSStyleDeclaration,
  weight: string,
  family: string,
  size = style.fontSize,
): string {
  const variants = [
    style.fontStyle === 'normal' ? '' : style.fontStyle,
    style.fontStretch === '100%' ? '' : style.fontStretch,
  ].filter(Boolean);
  return [...variants, weight, size, family].join(' ');
}

export function sourceAdvance(
  element: Element,
  text: string,
  context: CanvasRenderingContext2D,
): number {
  const style = getComputedStyle(element);
  const language = textLanguage(element);
  context.canvas.lang = language;
  setCanvasFont(context, canvasFont(style, style.fontWeight, style.fontFamily));
  const properties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontStretch: style.fontStretch,
    fontVariant: style.fontVariant,
    fontVariantNumeric: style.fontVariantNumeric,
    fontFeatureSettings: style.fontFeatureSettings,
    fontVariationSettings: style.fontVariationSettings,
    fontKerning: style.fontKerning,
    fontOpticalSizing: style.fontOpticalSizing,
    fontSizeAdjust: style.fontSizeAdjust,
    letterSpacing: style.letterSpacing,
  };
  const key = JSON.stringify([properties, language, text]);
  const cache = advanceCache.get(element) ?? new Map<string, number>();
  advanceCache.set(element, cache);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  // DOM layout includes inherited language, OpenType features and the kerning
  // changes caused by CSS tracking; a detached canvas may choose another face.
  const span = document.createElement('span');
  span.lang = language;
  Object.assign(span.style, {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    padding: '0',
    margin: '0',
    border: '0',
    width: 'max-content',
    textTransform: 'none',
    ...properties,
  });
  span.textContent = text;
  document.body.append(span);
  try {
    const width =
      span.getBoundingClientRect().width - trackingCount(text) * px(style.letterSpacing);
    cache.set(key, width);
    return width;
  } finally {
    span.remove();
  }
}

function isBoldWeight(value: string): boolean {
  return value === 'bold' || Number(value) >= 600;
}

export function correctedLetterSpacing(
  element: Element,
  text: string,
  run: Omit<PptxRun, 'text'>,
): number {
  const count = trackingCount(text);
  if (!count) return run.letterSpacing;
  fontContext ??= document.createElement('canvas').getContext('2d');
  if (!fontContext) return run.letterSpacing;
  const measure = fontContext;
  const style = getComputedStyle(element);
  const targetWeight = run.bold ? '700' : '400';
  const sourceWidth = sourceAdvance(element, text, fontContext);
  const resolvedAdvance = withCanvasTextStyle(measure, null, textLanguage(element), () => {
    setCanvasFont(
      measure,
      canvasFont(
        style,
        targetWeight,
        [run.latinFontFace ?? run.fontFace, run.eastAsianFontFace]
          .filter(Boolean)
          .map((family) => JSON.stringify(family))
          .join(', '),
        `${run.fontSize}px`,
      ),
    );
    return measure.measureText(text).width;
  });
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(resolvedAdvance)) return run.letterSpacing;
  if (Math.abs(sourceWidth - resolvedAdvance) < 0.25) return run.letterSpacing;
  return run.letterSpacing + (sourceWidth - resolvedAdvance) / count;
}

export function color(value: string, opacity = 1): PptxColor {
  if (!colorContext) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    colorContext = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!colorContext) throw new Error('The browser cannot resolve CSS colors.');
  colorContext.clearRect(0, 0, 1, 1);
  colorContext.fillStyle = value;
  colorContext.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorContext.getImageData(0, 0, 1, 1).data;
  return {
    color: [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase(),
    opacity: (a / 255) * opacity,
  };
}

export function px(value: string): number {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

export function relativeRect(rect: DOMRect, origin: DOMRect): PptxRect {
  return { x: rect.x - origin.x, y: rect.y - origin.y, w: rect.width, h: rect.height };
}

export function visible(element: Element): boolean {
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0;
}

export function opacity(element: Element, root: Element): number {
  let result = 1;
  for (let current: Element | null = element; current; current = current.parentElement) {
    result *= Number(getComputedStyle(current).opacity);
    if (current === root) break;
  }
  return result;
}

export function runStyle(element: Element, root: Element): Omit<PptxRun, 'text'> {
  const style = getComputedStyle(element);
  const family = resolveFontFamily(fontFamilies(style));
  return {
    fontFace: family.fontFace,
    fontSize: px(style.fontSize),
    color: color(style.color, opacity(element, root)),
    bold: isBoldWeight(style.fontWeight),
    italic: style.fontStyle !== 'normal',
    underline: style.textDecorationLine.includes('underline'),
    strike: style.textDecorationLine.includes('line-through'),
    letterSpacing: px(style.letterSpacing),
    lang: element.closest('[lang]')?.getAttribute('lang') ?? 'en-US',
  };
}

export function borders(
  element: Element,
  root: Element,
): [PptxStroke, PptxStroke, PptxStroke, PptxStroke] {
  const style = getComputedStyle(element);
  return ['Top', 'Right', 'Bottom', 'Left'].map((side) => {
    const get = (suffix: string) =>
      style.getPropertyValue(`border-${side.toLowerCase()}-${suffix}`);
    const kind = get('style');
    return {
      ...color(get('color'), opacity(element, root)),
      width: kind === 'none' || kind === 'hidden' ? 0 : px(get('width')),
      dash: kind === 'dotted' ? 'dot' : kind === 'dashed' ? 'dash' : 'solid',
    };
  }) as [PptxStroke, PptxStroke, PptxStroke, PptxStroke];
}

export function sourcePath(element: Element, root: Element): string {
  const parts: string[] = [];
  for (
    let current: Element | null = element;
    current && current !== root;
    current = current.parentElement
  ) {
    const index = current.parentElement
      ? Array.from(current.parentElement.children).indexOf(current) + 1
      : 1;
    parts.unshift(`${current.localName}:nth-child(${index})`);
  }
  return parts.join(' > ') || 'page';
}
