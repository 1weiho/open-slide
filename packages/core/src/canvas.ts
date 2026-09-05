export type CanvasSize = {
  width: number;
  height: number;
};

export const CANVAS_PRESETS = {
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
  '8k': { width: 7680, height: 4320 },
} as const satisfies Record<string, CanvasSize>;

export type CanvasPreset = keyof typeof CANVAS_PRESETS;
export type CanvasOption = CanvasPreset | CanvasSize;

export const DEFAULT_CANVAS_SIZE: CanvasSize = CANVAS_PRESETS['1080p'];
export const MAX_CANVAS_DIMENSION = 8192;
export const MAX_CANVAS_AREA = 8192 * 4320;

const PRESET_NAMES = Object.keys(CANVAS_PRESETS).join(', ');

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function resolveCanvasSize(value?: unknown): CanvasSize {
  if (value === undefined) return { ...DEFAULT_CANVAS_SIZE };

  if (typeof value === 'string') {
    const preset = Object.hasOwn(CANVAS_PRESETS, value)
      ? CANVAS_PRESETS[value as CanvasPreset]
      : undefined;
    if (!preset) {
      throw new Error(
        `Invalid open-slide canvas preset ${JSON.stringify(value)}. Expected one of: ${PRESET_NAMES}, or explicit { width, height }.`,
      );
    }
    return { ...preset };
  }

  if (typeof value !== 'object' || value === null) {
    throw new Error(
      `Invalid open-slide canvas value ${JSON.stringify(value)}. Expected one of: ${PRESET_NAMES}, or explicit { width, height }.`,
    );
  }

  const { width, height } = value as Record<string, unknown>;
  if (!isPositiveInteger(width) || !isPositiveInteger(height)) {
    throw new Error(
      `Invalid open-slide canvas dimensions { width: ${String(width)}, height: ${String(height)} }. Both must be positive integers.`,
    );
  }
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `Invalid open-slide canvas dimensions { width: ${width}, height: ${height} }. Each dimension must be at most ${MAX_CANVAS_DIMENSION} pixels.`,
    );
  }
  if (width * height > MAX_CANVAS_AREA) {
    throw new Error(
      `Invalid open-slide canvas dimensions { width: ${width}, height: ${height} }. Canvas area must be at most ${MAX_CANVAS_AREA} pixels.`,
    );
  }

  return { width, height };
}

function isDefaultCanvas(canvas: CanvasSize): boolean {
  return canvas.width === DEFAULT_CANVAS_SIZE.width && canvas.height === DEFAULT_CANVAS_SIZE.height;
}

export function getPptxCapturePixelRatio(canvas: CanvasSize): number {
  return isDefaultCanvas(canvas) ? 2 : 1;
}

export function getPrintSupersample(canvas: CanvasSize): {
  zoom: number;
  inverseScale: number;
} {
  return isDefaultCanvas(canvas) ? { zoom: 2, inverseScale: 0.5 } : { zoom: 1, inverseScale: 1 };
}
