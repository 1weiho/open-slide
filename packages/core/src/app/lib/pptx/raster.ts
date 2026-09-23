import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../sdk';
import type { Rect } from './scene';

const MAX_PIXEL_RATIO = 2;
const MAX_RASTER_PIXELS = 3_000_000;
const JPEG_QUALITY = 0.92;
const ISOLATE_CLASS = 'os-pptx-isolate';
const TARGET_ATTR = 'data-os-raster-target';
const ALPHA_THRESHOLD = 2;

export type RasterMode = 'subtree' | 'self';

export type RasterRequest = {
  target: Element;
  mode: RasterMode;
  /** Frame-space region to keep, already expanded for bleed and clamped to the slide. */
  region: Rect;
  /** Trim transparent margins so the picture box hugs the painted pixels. */
  trim: boolean;
};

export type RasterResult = { bytes: Uint8Array; rect: Rect; format: 'png' | 'jpeg' };

function pixelRatioFor(region: Rect): number {
  const area = Math.max(1, region.w * region.h);
  return Math.min(MAX_PIXEL_RATIO, Math.max(1, Math.sqrt(MAX_RASTER_PIXELS / area)));
}

const isolateStyleText = `
.${ISOLATE_CLASS} { background: transparent !important; }
.${ISOLATE_CLASS} * { visibility: hidden !important; }
.${ISOLATE_CLASS} [${TARGET_ATTR}], .${ISOLATE_CLASS} [${TARGET_ATTR}] * { visibility: visible !important; }
.${ISOLATE_CLASS} [${TARGET_ATTR}="self"] * { visibility: hidden !important; }
`;

export function clampToSlide(rect: Rect): Rect {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const right = Math.min(CANVAS_WIDTH, Math.ceil(rect.x + rect.w));
  const bottom = Math.min(CANVAS_HEIGHT, Math.ceil(rect.y + rect.h));
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

export function expandRect(rect: Rect, by: number): Rect {
  return { x: rect.x - by, y: rect.y - by, w: rect.w + 2 * by, h: rect.h + 2 * by };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

type Batch = { ratio: number; requests: RasterRequest[] };

function batchRequests(requests: RasterRequest[]): Batch[] {
  const batches: Batch[] = [];
  for (const req of requests) {
    const ratio = pixelRatioFor(req.region);
    const batch = batches.find(
      (b) =>
        b.ratio === ratio && b.requests.every((other) => !intersects(other.region, req.region)),
    );
    if (batch) batch.requests.push(req);
    else batches.push({ ratio, requests: [req] });
  }
  return batches;
}

export class Rasterizer {
  private fontCss: string | null = null;
  private toCanvas: typeof import('html-to-image').toCanvas | null = null;

  constructor(private readonly frame: HTMLElement) {}

  async rasterize(requests: RasterRequest[]): Promise<(RasterResult | null)[]> {
    const results: (RasterResult | null)[] = requests.map(() => null);
    const live = requests.filter((r) => r.region.w > 0 && r.region.h > 0);
    if (live.length === 0) return results;

    const lib = await import('html-to-image');
    this.toCanvas = lib.toCanvas;
    if (this.fontCss === null) {
      this.fontCss = await lib.getFontEmbedCSS(this.frame).catch(() => '');
    }

    const style = document.createElement('style');
    style.textContent = isolateStyleText;
    document.head.appendChild(style);
    this.frame.classList.add(ISOLATE_CLASS);
    try {
      for (const batch of batchRequests(live)) {
        for (const req of batch.requests) req.target.setAttribute(TARGET_ATTR, req.mode);
        try {
          const canvas = await this.toCanvas(this.frame, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            pixelRatio: batch.ratio,
            cacheBust: true,
            skipAutoScale: true,
            fontEmbedCSS: this.fontCss,
          });
          for (const req of batch.requests) {
            results[requests.indexOf(req)] = await crop(canvas, req, batch.ratio);
          }
        } catch (err) {
          console.warn(
            '[open-slide] pptx export: could not rasterize an element, skipping it',
            err,
          );
        } finally {
          for (const req of batch.requests) req.target.removeAttribute(TARGET_ATTR);
        }
      }
    } finally {
      this.frame.classList.remove(ISOLATE_CLASS);
      style.remove();
    }
    return results;
  }
}

async function crop(
  source: HTMLCanvasElement,
  req: RasterRequest,
  ratio: number,
): Promise<RasterResult | null> {
  const { region } = req;
  const sx = Math.round(region.x * ratio);
  const sy = Math.round(region.y * ratio);
  const sw = Math.round(region.w * ratio);
  const sh = Math.round(region.h * ratio);
  if (sw <= 0 || sh <= 0) return null;
  const ctx = source.getContext('2d');
  if (!ctx) return null;
  const data = ctx.getImageData(sx, sy, sw, sh);
  const bounds = req.trim ? opaqueBounds(data) : { x: 0, y: 0, w: sw, h: sh };
  if (!bounds) return null;

  const out = document.createElement('canvas');
  out.width = bounds.w;
  out.height = bounds.h;
  const octx = out.getContext('2d');
  if (!octx) return null;
  octx.putImageData(data, -bounds.x, -bounds.y);
  const opaque = isFullyOpaque(octx.getImageData(0, 0, bounds.w, bounds.h));
  const blob = await new Promise<Blob | null>((resolve) =>
    opaque ? out.toBlob(resolve, 'image/jpeg', JPEG_QUALITY) : out.toBlob(resolve, 'image/png'),
  );
  if (!blob) return null;
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    format: opaque ? 'jpeg' : 'png',
    rect: {
      x: region.x + bounds.x / ratio,
      y: region.y + bounds.y / ratio,
      w: bounds.w / ratio,
      h: bounds.h / ratio,
    },
  };
}

function isFullyOpaque(data: ImageData): boolean {
  const px = data.data;
  for (let i = 3; i < px.length; i += 4) {
    if (px[i] !== 255) return false;
  }
  return true;
}

function opaqueBounds(data: ImageData): Rect | null {
  const { width, height } = data;
  const px = data.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4 + 3;
    for (let x = 0; x < width; x++) {
      if (px[rowStart + x * 4] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
