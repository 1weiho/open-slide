import type { ImageFormat, SceneImage } from './scene';

export type LoadedImage = { id: number; width: number; height: number };

function sniffFormat(bytes: Uint8Array): ImageFormat | 'other' {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) return 'png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpeg';
  if (bytes.length > 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
    .trimStart();
  if (head.startsWith('<') && /<svg[\s>]/i.test(head)) return 'svg';
  return 'other';
}

async function decodeSize(blob: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

async function encodePng(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const SVG_RASTER_SCALE = 2;

export class ImageStore {
  readonly images: SceneImage[] = [];
  private readonly byKey = new Map<string, Promise<LoadedImage | null>>();
  private nextId = 1;

  add(bytes: Uint8Array, format: ImageFormat, svg?: Uint8Array): number {
    const id = this.nextId++;
    this.images.push({ id, bytes, format, svg });
    return id;
  }

  fromUrl(url: string): Promise<LoadedImage | null> {
    let pending = this.byKey.get(url);
    if (!pending) {
      pending = this.load(url);
      this.byKey.set(url, pending);
    }
    return pending;
  }

  private async load(url: string): Promise<LoadedImage | null> {
    let bytes: Uint8Array | null = null;
    try {
      const res = await fetch(url);
      if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
    } catch {}

    if (bytes) {
      const format = sniffFormat(bytes);
      if (format === 'png' || format === 'jpeg' || format === 'gif') {
        const size = await decodeSize(new Blob([bytes as BlobPart]));
        if (!size) return null;
        return { id: this.add(bytes, format), ...size };
      }
      if (format === 'svg') {
        const img = await loadImageElement(url);
        if (!img || img.naturalWidth === 0) return null;
        const png = await encodePng(
          img,
          img.naturalWidth * SVG_RASTER_SCALE,
          img.naturalHeight * SVG_RASTER_SCALE,
        );
        if (!png) return null;
        return {
          id: this.add(png, 'png', bytes),
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
      }
    }

    const img = await loadImageElement(url);
    if (!img || img.naturalWidth === 0) return null;
    const png = await encodePng(img, img.naturalWidth, img.naturalHeight);
    if (!png) return null;
    return { id: this.add(png, 'png'), width: img.naturalWidth, height: img.naturalHeight };
  }
}
