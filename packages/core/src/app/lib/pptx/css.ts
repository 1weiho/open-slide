import { resolvePptxFontFace } from './fonts';
import { PPTX_CANVAS_HEIGHT, PPTX_CANVAS_WIDTH } from './scene';

export type PptxRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
};

export type PptxTextStyle = {
  fontFace?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
  charSpacing?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  fontFallbackWarning?: string;
};

const HEX_COLOR_RE = /^#(?<hex>[0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR_RE =
  /^rgba?\(\s*(?<red>\d{1,3})\s*,\s*(?<green>\d{1,3})\s*,\s*(?<blue>\d{1,3})(?:\s*,\s*(?<alpha>0|0?\.\d+|1(?:\.0+)?))?\s*\)$/i;
const PX_RE = /^(?<value>-?\d+(?:\.\d+)?)px$/i;

export function normalizeCssColor(value: string): string | undefined {
  const color = value.trim();

  if (!color || color.toLowerCase() === 'transparent') {
    return undefined;
  }

  const hexMatch = color.match(HEX_COLOR_RE);
  if (hexMatch?.groups?.hex) {
    const hex = hexMatch.groups.hex;
    return hex.length === 3
      ? hex
          .split('')
          .map((part) => `${part}${part}`)
          .join('')
          .toUpperCase()
      : hex.toUpperCase();
  }

  const rgbMatch = color.match(RGB_COLOR_RE);
  if (!rgbMatch?.groups) {
    return undefined;
  }

  const alpha = rgbMatch.groups.alpha === undefined ? 1 : Number(rgbMatch.groups.alpha);
  if (alpha <= 0) {
    return undefined;
  }

  const red = parseRgbChannel(rgbMatch.groups.red);
  const green = parseRgbChannel(rgbMatch.groups.green);
  const blue = parseRgbChannel(rgbMatch.groups.blue);

  if (red === undefined || green === undefined || blue === undefined) {
    return undefined;
  }

  return [red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function parseCssPx(value: string): number | undefined {
  const match = value.trim().match(PX_RE);
  if (!match?.groups?.value) {
    return undefined;
  }

  const parsed = Number(match.groups.value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function fontWeightToBold(value: string): boolean {
  const weight = value.trim().toLowerCase();

  if (weight === 'bold' || weight === 'bolder') {
    return true;
  }

  const numericWeight = Number(weight);
  return Number.isFinite(numericWeight) && numericWeight >= 700;
}

export function readElementTextStyle(el: Element): PptxTextStyle {
  const style = getElementComputedStyle(el);
  if (!style) {
    return {};
  }

  const resolvedFont = resolvePptxFontFace(style.fontFamily);
  const fontSize = parseCssPx(style.fontSize);
  const color = normalizeCssColor(style.color);
  const lineHeight = parseCssPx(style.lineHeight);
  const charSpacing = parseCssPx(style.letterSpacing ?? '');
  const align = normalizeTextAlign(style.textAlign);

  return {
    ...(resolvedFont?.fontFace ? { fontFace: resolvedFont.fontFace } : {}),
    ...(resolvedFont?.warning ? { fontFallbackWarning: resolvedFont.warning } : {}),
    ...(fontSize !== undefined ? { fontSize } : {}),
    ...(color ? { color } : {}),
    bold: fontWeightToBold(style.fontWeight),
    ...(style.fontStyle === 'italic' || style.fontStyle === 'oblique' ? { italic: true } : {}),
    ...(lineHeight !== undefined ? { lineHeight } : {}),
    ...(charSpacing !== undefined ? { charSpacing } : {}),
    ...(align ? { align } : {}),
  };
}

export function readElementRect(el: Element, canvas: Element): PptxRect | null {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width > 0 ? PPTX_CANVAS_WIDTH / canvasRect.width : 1;
  const scaleY = canvasRect.height > 0 ? PPTX_CANVAS_HEIGHT / canvasRect.height : 1;
  return {
    x: (rect.left - canvasRect.left) * scaleX,
    y: (rect.top - canvasRect.top) * scaleY,
    w: rect.width * scaleX,
    h: rect.height * scaleY,
  };
}

function parseRgbChannel(value: string): number | undefined {
  const channel = Number(value);
  if (!Number.isInteger(channel) || channel < 0 || channel > 255) {
    return undefined;
  }

  return channel;
}

function getElementComputedStyle(el: Element): CSSStyleDeclaration | null {
  const readStyle = globalThis.getComputedStyle;
  return typeof readStyle === 'function' ? readStyle(el) : null;
}

function normalizeTextAlign(value: string): PptxTextStyle['align'] | undefined {
  if (value === 'left' || value === 'center' || value === 'right' || value === 'justify') {
    return value;
  }

  return undefined;
}
