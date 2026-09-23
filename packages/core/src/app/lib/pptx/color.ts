import { type ColorParser, parseColor, type Rgba } from './css';

/**
 * Computed styles keep modern syntaxes such as `oklch()` verbatim, and canvas
 * `fillStyle` echoes them back unchanged, so the only reliable way to get sRGB
 * bytes is to paint the colour and read the pixel. Painting over white and black
 * recovers the alpha channel.
 */
export function createColorNormalizer(): ColorParser {
  const cache = new Map<string, Rgba | null>();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const sample = (value: string, backdrop: string): Uint8ClampedArray | null => {
    if (!ctx) return null;
    ctx.globalCompositeOperation = 'copy';
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, 1, 1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#123456';
    ctx.fillStyle = value;
    if (ctx.fillStyle === '#123456' && !/123456/i.test(value)) return null;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
  };

  return (value: string): Rgba | null => {
    const direct = parseColor(value);
    if (direct) return direct;
    const cached = cache.get(value);
    if (cached !== undefined) return cached;
    let result: Rgba | null = null;
    const onWhite = sample(value, '#ffffff');
    const onBlack = sample(value, '#000000');
    if (onWhite && onBlack) {
      const diffs = [0, 1, 2].map((i) => onWhite[i] - onBlack[i]);
      const alpha = Math.min(1, Math.max(0, 1 - Math.max(...diffs) / 255));
      if (alpha <= 0.002) result = { r: 0, g: 0, b: 0, a: 0 };
      else {
        const c = (i: number) => Math.min(255, Math.max(0, Math.round(onBlack[i] / alpha)));
        result = { r: c(0), g: c(1), b: c(2), a: Number(alpha.toFixed(3)) };
      }
    }
    cache.set(value, result);
    return result;
  };
}
