/**
 * Canvas sizing. Slides render into a fixed pixel canvas; everything else
 * (viewer, thumbnails, presenter, and the PDF/HTML/PPTX exporters) scales that
 * canvas rather than reflowing it, so the size is a workspace-wide setting
 * rather than a per-slide one.
 */

export type CanvasPreset = '16:9' | '4:3' | '4:5' | '1:1' | '9:16';

export type CanvasSize = {
  width: number;
  height: number;
};

/** `open-slide.config.ts` accepts a named preset or explicit pixel dimensions. */
export type CanvasOption = CanvasPreset | CanvasSize;

/**
 * Landscape presets keep the 1080px height so decks authored at 1920×1080 keep
 * their type scale when narrowed. Portrait and square presets key off a 1080px
 * width instead, which is what the social platforms they target expect
 * (LinkedIn documents at 4:5, Stories/Reels at 9:16).
 */
export const CANVAS_PRESETS: Record<CanvasPreset, CanvasSize> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};

export const DEFAULT_CANVAS_PRESET: CanvasPreset = '16:9';

export const DEFAULT_CANVAS_SIZE: CanvasSize = CANVAS_PRESETS[DEFAULT_CANVAS_PRESET];

const PRESET_NAMES = Object.keys(CANVAS_PRESETS) as CanvasPreset[];

// Chromium prints via an integer pixel canvas, and a non-integer page size
// rounds inconsistently between the @page rule and the frame element, leaving a
// hairline of background on one edge. Reject the ambiguity up front.
function isValidDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Normalise a `canvas` config value into explicit pixel dimensions. Runs at
 * dev-server / build start so a bad value fails loudly there rather than
 * silently producing a mis-sized export.
 */
export function resolveCanvasSize(canvas?: CanvasOption): CanvasSize {
  if (canvas === undefined) return { ...DEFAULT_CANVAS_SIZE };

  if (typeof canvas === 'string') {
    const preset = CANVAS_PRESETS[canvas];
    if (!preset) {
      throw new Error(
        `Invalid "canvas" preset ${JSON.stringify(canvas)} in open-slide.config.ts. ` +
          `Expected one of ${PRESET_NAMES.join(', ')}, or explicit { width, height }.`,
      );
    }
    return { ...preset };
  }

  if (typeof canvas !== 'object' || canvas === null) {
    throw new Error(
      `Invalid "canvas" value in open-slide.config.ts. Expected a preset ` +
        `(${PRESET_NAMES.join(', ')}) or { width, height }.`,
    );
  }

  const { width, height } = canvas;
  if (!isValidDimension(width) || !isValidDimension(height)) {
    throw new Error(
      `Invalid "canvas" dimensions in open-slide.config.ts: ` +
        `{ width: ${String(width)}, height: ${String(height)} }. ` +
        `Both must be positive integers in CSS pixels.`,
    );
  }

  return { width, height };
}
