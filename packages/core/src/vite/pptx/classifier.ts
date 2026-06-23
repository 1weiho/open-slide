import type { LeafClassification, Rect } from './types.ts';

// Re-declared inline rather than imported from extract-pw.ts because the
// classifier must remain runtime-free of Playwright. extract-pw.ts ALSO
// exports a CssFeatureFlags type; the two definitions are kept in sync by
// using the same field set verbatim.
export type CssFeatureFlags = {
  filter: string;
  mask: string;
  clipPath: string;
  mixBlendMode: string;
  transform: string;
  animationName: string;
};

// Input shapes the classifier accepts. Each `type` discriminant maps to a
// concrete branch. Field names mirror `extract-pw.ts` to keep the wiring
// in Task 5 mechanical.

export type TextClassifierInput = {
  type: 'text';
  text: string;
  rect: Rect;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  cssFeatureFlags?: CssFeatureFlags;
};

export type ImageClassifierInput = {
  type: 'image';
  rect: Rect;
  src: string;
};

export type DecorClassifierInput = {
  type: 'decor';
  rect: Rect;
  background?: string;
  // Non-empty when the element's computed background-image is a gradient
  // (linear/radial/conic) or a url() reference. pptx has no native gradient
  // fill on the decor path, so the classifier promotes to ImageFallback so
  // extract-pw can capture the element as a PNG.
  backgroundImage?: string;
  borderWidth: number;
  cssFeatureFlags?: CssFeatureFlags;
};

export type SvgClassifierInput = {
  type: 'svg';
  rect: Rect;
  hasUnsupportedPath: boolean;
  hasUse: boolean;
  hasPattern: boolean;
  hasMask: boolean;
};

export type TableClassifierInput = {
  type: 'table';
  rect: Rect;
  rows: number;
  cols: number;
  hasRowspan: boolean;
  hasColspan: boolean;
  hasNestedTable: boolean;
};

export type ClassifierInput =
  | TextClassifierInput
  | ImageClassifierInput
  | DecorClassifierInput
  | SvgClassifierInput
  | TableClassifierInput;

const LINE_THRESHOLD_PX = 2;
const SVG_ICON_MAX_DIM = 64;

function unsupportedCssReasons(flags?: CssFeatureFlags): string[] {
  if (!flags) return [];
  const out: string[] = [];
  if (flags.filter && !isNoOpFilter(flags.filter)) out.push(`filter:${flags.filter}`);
  if (flags.mask) out.push(`mask:${flags.mask}`);
  if (flags.clipPath) out.push(`clip-path:${flags.clipPath}`);
  if (flags.mixBlendMode) out.push(`mix-blend-mode:${flags.mixBlendMode}`);
  if (flags.transform) out.push(`transform:${flags.transform}`);
  // animationName is informational only — does not trigger fallback by itself
  // because Plan A's animation-freeze in extract-pw already captures the
  // final visual state.
  return out;
}

// CSS filter values that are visually a no-op and should NOT trigger
// ImageFallback. The browser still resolves these to a non-empty
// computed-style string when the author writes `filter: blur(0px)` for
// hover-state transitions, etc. — but the rendered pixels are identical
// to having no filter at all, so falling back to a screenshot is waste.
function isNoOpFilter(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  for (const p of parts) {
    if (p === 'none') continue;
    const m = /^([a-z-]+)\(([^)]*)\)$/i.exec(p);
    if (!m) return false; // Unknown shape — treat as effectful, safer.
    const name = m[1].toLowerCase();
    const arg = m[2].trim();
    if (name === 'blur' && /^0(px|em|rem|%)?$/.test(arg)) continue;
    if (
      (name === 'opacity' || name === 'brightness' || name === 'contrast' || name === 'saturate') &&
      /^1(\.0+)?$/.test(arg)
    )
      continue;
    if (
      (name === 'grayscale' || name === 'invert' || name === 'sepia') &&
      /^0(\.0+)?(%)?$/.test(arg)
    )
      continue;
    if (name === 'hue-rotate' && /^0(\.0+)?(deg|rad|grad|turn)?$/.test(arg)) continue;
    return false;
  }
  return true;
}

export function classifyLeaf(input: ClassifierInput): LeafClassification {
  const reasons: string[] = [];

  switch (input.type) {
    case 'text': {
      const cssReasons = unsupportedCssReasons(input.cssFeatureFlags);
      if (cssReasons.length > 0) {
        return { kind: 'ImageFallback', reasons: cssReasons };
      }
      return { kind: 'TextRun', reasons: ['text'] };
    }

    case 'image':
      reasons.push('img');
      return { kind: 'Image', reasons };

    case 'decor': {
      const cssReasons = unsupportedCssReasons(input.cssFeatureFlags);
      if (cssReasons.length > 0) {
        return { kind: 'ImageFallback', reasons: cssReasons };
      }
      if (input.backgroundImage) {
        return {
          kind: 'ImageFallback',
          reasons: [`background-image:${input.backgroundImage}`],
        };
      }
      const { rect } = input;
      if (rect.h <= LINE_THRESHOLD_PX || rect.w <= LINE_THRESHOLD_PX) {
        return {
          kind: 'Line',
          reasons: [`line:${rect.w <= LINE_THRESHOLD_PX ? 'narrow' : 'short'}`],
        };
      }
      return { kind: 'Box', reasons: ['decor:box'] };
    }

    case 'svg': {
      const { rect, hasUnsupportedPath, hasUse, hasPattern, hasMask } = input;
      const complex = hasUnsupportedPath || hasUse || hasPattern || hasMask;
      const fits = rect.w <= SVG_ICON_MAX_DIM && rect.h <= SVG_ICON_MAX_DIM;
      if (complex) {
        const sources = [
          hasUnsupportedPath ? 'unsupported-path' : null,
          hasUse ? 'use' : null,
          hasPattern ? 'pattern' : null,
          hasMask ? 'mask' : null,
        ]
          .filter(Boolean)
          .join('+');
        return { kind: 'ImageFallback', reasons: [`svg:${sources}`] };
      }
      return {
        kind: 'SvgIcon',
        reasons: [`svg:${fits ? 'fits' : 'oversize'}:simple`],
      };
    }

    case 'table':
      reasons.push(`table:${input.rows}x${input.cols}`);
      return { kind: 'Table', reasons };
  }
}
