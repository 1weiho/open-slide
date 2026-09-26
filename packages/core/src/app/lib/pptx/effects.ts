import type { PptxColor, PptxGradient, PptxPathCommand, PptxRect, PptxShape } from './model';
import { color, px } from './style';

export type Decoration = Omit<PptxShape, 'id' | 'order' | 'source'>;

export function splitCss(value: string, separator = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let quote = '';
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === quote && value[i - 1] !== '\\') quote = '';
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (!depth && (separator === ' ' ? /\s/.test(c) : c === separator)) {
      if (value.slice(start, i).trim()) parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (value.slice(start).trim()) parts.push(value.slice(start).trim());
  return parts;
}

function length(value: string | undefined, total: number, fallback = 0): number {
  return value === undefined || value === 'auto'
    ? fallback
    : value.endsWith('%')
      ? (px(value) * total) / 100
      : px(value);
}

function position(value: string, total: number): number {
  return (
    ({ left: 0, top: 0, center: total / 2, right: total, bottom: total } as Record<string, number>)[
      value
    ] ?? length(value, total)
  );
}

export function gradient(value: string, w: number, h: number, alpha = 1): PptxGradient {
  const match = /^(linear|radial)-gradient\((.*)\)$/.exec(value);
  if (!match) throw new Error(`Unsupported gradient: ${value}`);
  const parts = splitCss(match[2]);
  const isStop = (part: string) => CSS.supports('color', splitCss(part, ' ')[0]);
  const descriptor = isStop(parts[0]) ? '' : (parts.shift() ?? '');
  const kind = match[1] as 'linear' | 'radial';
  const result: PptxGradient = { kind, stops: [] };
  let extent: number;
  if (kind === 'linear') {
    let angle = 180;
    if (/^-?[\d.]+(?:deg|turn|rad|grad)$/.test(descriptor)) {
      angle =
        px(descriptor) *
        (descriptor.endsWith('turn')
          ? 360
          : descriptor.endsWith('grad')
            ? 0.9
            : descriptor.endsWith('rad')
              ? 180 / Math.PI
              : 1);
    } else if (descriptor.startsWith('to ')) {
      const x = descriptor.includes('right') ? h : descriptor.includes('left') ? -h : 0;
      const y = descriptor.includes('bottom') ? w : descriptor.includes('top') ? -w : 0;
      angle = (Math.atan2(x, -y) * 180) / Math.PI;
    } else if (descriptor) throw new Error(`Unsupported linear gradient direction: ${descriptor}`);
    result.angle = ((angle % 360) + 360) % 360;
    extent =
      Math.abs(Math.sin((angle * Math.PI) / 180)) * w +
      Math.abs(Math.cos((angle * Math.PI) / 180)) * h;
  } else {
    const [size, at = 'center center'] = descriptor.split(/\s*\bat\b\s*/);
    const coords = splitCss(at, ' ');
    if (coords.length === 1) coords.push('center');
    if (['top', 'bottom'].includes(coords[0])) coords.reverse();
    const cx = position(coords[0], w),
      cy = position(coords[1], h);
    const near = size.includes('closest');
    const rx = near ? Math.min(cx, w - cx) : Math.max(cx, w - cx);
    const ry = near ? Math.min(cy, h - cy) : Math.max(cy, h - cy);
    const circle = size.includes('circle');
    const side = size.includes('side');
    const explicit = splitCss(size.replace(/circle|ellipse/, '').trim(), ' ').filter((v) =>
      /^[-\d.]/.test(v),
    );
    let x: number, y: number;
    if (explicit.length) {
      x = length(explicit[0], w);
      y = explicit.length > 1 ? length(explicit[1], h) : x;
    } else if (circle) {
      x = y = side ? (near ? Math.min(rx, ry) : Math.max(rx, ry)) : Math.hypot(rx, ry);
    } else {
      x = rx * (side ? 1 : Math.SQRT2);
      y = ry * (side ? 1 : Math.SQRT2);
    }
    result.center = { x: cx / w, y: cy / h };
    result.radius = { x: x / w, y: y / h };
    extent = x;
  }
  const stops: { offset?: number; color: PptxColor }[] = [];
  for (const part of parts) {
    const tokens = splitCss(part, ' ');
    const c = tokens.shift();
    if (!c || !CSS.supports('color', c) || tokens.length > 2)
      throw new Error(`Unsupported gradient stop: ${part}`);
    if (!tokens.length) stops.push({ color: color(c, alpha) });
    else
      for (const p of tokens)
        stops.push({ color: color(c, alpha), offset: length(p, extent) / extent });
  }
  if (stops.length < 2) throw new Error('A gradient needs two color stops.');
  stops[0].offset ??= 0;
  stops[stops.length - 1].offset ??= 1;
  let previous = 0;
  for (let i = 1; i < stops.length; i++) {
    const offset = stops[i].offset;
    if (offset === undefined) continue;
    stops[i].offset = Math.max(stops[previous].offset ?? 0, offset);
    for (let j = previous + 1; j < i; j++)
      stops[j].offset =
        (stops[previous].offset ?? 0) +
        (((stops[i].offset ?? 0) - (stops[previous].offset ?? 0)) * (j - previous)) /
          (i - previous);
    previous = i;
  }
  result.stops = stops.map((stop) => ({ ...stop, offset: stop.offset ?? 0 }));
  result.stops = [
    { offset: 0, color: sampleGradient(result, 0) },
    ...result.stops.filter((s) => s.offset > 0 && s.offset < 1),
    { offset: 1, color: sampleGradient(result, 1) },
  ];
  return result;
}

export function sampleGradient(g: PptxGradient, offset: number): PptxColor {
  const right = g.stops.findIndex((stop) => stop.offset > offset);
  if (right === 0) return g.stops[0].color;
  if (right < 0) return g.stops[g.stops.length - 1].color;
  const a = g.stops[right - 1],
    b = g.stops[right];
  const t = (offset - a.offset) / (b.offset - a.offset);
  const opacity = a.color.opacity * (1 - t) + b.color.opacity * t;
  const hex = [0, 2, 4]
    .map((i) => {
      const ac = Number.parseInt(a.color.color.slice(i, i + 2), 16);
      const bc = Number.parseInt(b.color.color.slice(i, i + 2), 16);
      return Math.round(
        opacity ? (ac * a.color.opacity * (1 - t) + bc * b.color.opacity * t) / opacity : ac,
      )
        .toString(16)
        .padStart(2, '0');
    })
    .join('')
    .toUpperCase();
  return { color: hex, opacity };
}

export function gradientAt(g: PptxGradient, x: number, y: number, w: number, h: number): PptxColor {
  if (g.kind === 'radial') {
    return sampleGradient(
      g,
      Math.hypot(
        (x / w - (g.center?.x ?? 0.5)) / (g.radius?.x ?? 0.5),
        (y / h - (g.center?.y ?? 0.5)) / (g.radius?.y ?? 0.5),
      ),
    );
  }
  const a = ((g.angle ?? 180) * Math.PI) / 180;
  const extent = Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h;
  return sampleGradient(g, 0.5 + ((x - w / 2) * Math.sin(a) - (y - h / 2) * Math.cos(a)) / extent);
}

export function cropGradient(g: PptxGradient, old: PptxRect, box: PptxRect): PptxGradient {
  if (g.kind === 'radial')
    return {
      ...g,
      center: {
        x: ((g.center?.x ?? 0.5) * old.w + old.x - box.x) / box.w,
        y: ((g.center?.y ?? 0.5) * old.h + old.y - box.y) / box.h,
      },
      radius: {
        x: ((g.radius?.x ?? 0.5) * old.w) / box.w,
        y: ((g.radius?.y ?? 0.5) * old.h) / box.h,
      },
    };
  const a = ((g.angle ?? 180) * Math.PI) / 180;
  const extent = Math.abs(Math.sin(a)) * old.w + Math.abs(Math.cos(a)) * old.h;
  const newExtent = Math.abs(Math.sin(a)) * box.w + Math.abs(Math.cos(a)) * box.h;
  const mid =
    0.5 +
    ((box.x + box.w / 2 - old.x - old.w / 2) * Math.sin(a) -
      (box.y + box.h / 2 - old.y - old.h / 2) * Math.cos(a)) /
      extent;
  const lo = mid - newExtent / extent / 2,
    hi = mid + newExtent / extent / 2;
  return {
    ...g,
    stops: [
      { offset: 0, color: sampleGradient(g, lo) },
      ...g.stops
        .filter((s) => s.offset > lo && s.offset < hi)
        .map((s) => ({ ...s, offset: (s.offset - lo) / (hi - lo) })),
      { offset: 1, color: sampleGradient(g, hi) },
    ],
  };
}

export function intersect(a: PptxRect, b: PptxRect): PptxRect | undefined {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x,
    h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : undefined;
}

function layerValue(value: string, index: number): string {
  const values = splitCss(value);
  return values[index % values.length] ?? '';
}

export function backgroundShapes(
  style: CSSStyleDeclaration,
  box: PptxRect,
  alpha: number,
): Decoration[] {
  if (style.backgroundImage === 'none') return [];
  const layers = splitCss(style.backgroundImage);
  const result: Decoration[] = [];
  const mask =
    style.maskImage && style.maskImage !== 'none'
      ? gradient(style.maskImage, box.w, box.h)
      : undefined;
  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i] === 'none') continue;
    const size = splitCss(layerValue(style.backgroundSize, i), ' ');
    const w = length(size[0], box.w, box.w),
      h = length(size[1], box.h, box.h);
    if (w <= 0 || h <= 0) continue;
    const checker = /^repeating-conic-gradient\((.*)\)$/.exec(layers[i]);
    if (checker) {
      const stops = splitCss(checker[1]).map((value) => splitCss(value, ' '));
      if (
        stops.length !== 4 ||
        stops.map((stop) => stop[1]).join(',') !== '0deg,90deg,90deg,180deg'
      )
        throw new Error(`Unsupported conic background: ${layers[i]}`);
      const colors = [color(stops[0][0], alpha), color(stops[2][0], alpha)];
      if (Math.ceil(box.w / w) * Math.ceil(box.h / h) > 4096)
        throw new Error('The checkerboard exceeds the native object limit.');
      for (let row = 0; row < Math.ceil(box.h / (h / 2)); row++)
        for (let col = 0; col < Math.ceil(box.w / (w / 2)); col++) {
          const fill = colors[(row + col + 1) % 2];
          const tile = intersect(box, {
            x: box.x + (col * w) / 2,
            y: box.y + (row * h) / 2,
            w: w / 2,
            h: h / 2,
          });
          if (tile && fill.opacity > 0)
            result.push({ ...tile, kind: 'shape', geometry: 'rect', fill });
        }
      continue;
    }
    const g = gradient(layers[i], w, h, alpha);
    const repeat = layerValue(style.backgroundRepeat, i).split(' ');
    const repeatX = ['repeat', 'repeat-x'].includes(repeat[0]);
    const repeatY =
      repeat.length > 1 ? repeat[1] === 'repeat' : ['repeat', 'repeat-y'].includes(repeat[0]);
    const pos = splitCss(layerValue(style.backgroundPosition, i), ' ');
    const x = position(pos[0] ?? '0%', box.w - w),
      y = position(pos[1] ?? '0%', box.h - h);
    // Repeated one-pixel CSS grid lines stay independent native lines with the radial mask sampled along each line.
    const hardEdge = g.stops.findIndex(
      (s, j) => j > 0 && s.offset === g.stops[j - 1].offset && s.color.opacity === 0,
    );
    const stripe =
      g.kind === 'linear' &&
      [0, 90, 180, 270].includes(g.angle ?? 180) &&
      hardEdge > 0 &&
      g.stops.slice(hardEdge).every((s) => s.color.opacity === 0);
    if (stripe && repeatX && repeatY) {
      const vertical = [90, 270].includes(g.angle ?? 180);
      const period = vertical ? w : h;
      const thickness = period * g.stops[hardEdge].offset;
      const start = vertical ? x : y;
      const total = vertical ? box.w : box.h;
      for (let offset = (start % period) - period; offset < total; offset += period) {
        const offsetInTile = [0, 270].includes(g.angle ?? 180) ? period - thickness : 0;
        const line = intersect(
          box,
          vertical
            ? { x: box.x + offset + offsetInTile, y: box.y, w: thickness, h: box.h }
            : { x: box.x, y: box.y + offset + offsetInTile, w: box.w, h: thickness },
        );
        if (!line) continue;
        const fill = g.stops[0].color;
        const masked = mask
          ? {
              kind: 'linear' as const,
              angle: vertical ? 180 : 90,
              stops: Array.from({ length: 33 }, (_, n) => {
                const t = n / 32;
                const mx = line.x - box.x + (vertical ? line.w / 2 : line.w * t);
                const my = line.y - box.y + (vertical ? line.h * t : line.h / 2);
                return {
                  offset: t,
                  color: {
                    ...fill,
                    opacity: fill.opacity * gradientAt(mask, mx, my, box.w, box.h).opacity,
                  },
                };
              }),
            }
          : undefined;
        result.push({
          ...line,
          kind: 'shape',
          geometry: 'rect',
          fill: masked ? undefined : fill,
          gradient: masked,
        });
      }
      continue;
    }
    if (mask) throw new Error('A gradient mask currently requires repeated grid lines.');
    const startX = repeatX ? (x % w) - w : x,
      startY = repeatY ? (y % h) - h : y;
    const cols = repeatX ? Math.ceil((box.w - startX) / w) : 1,
      rows = repeatY ? Math.ceil((box.h - startY) / h) : 1;
    if (cols * rows > 4096)
      throw new Error('The repeated background exceeds the native object limit.');
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const tile = { x: box.x + startX + col * w, y: box.y + startY + row * h, w, h };
        const clipped = intersect(tile, box);
        if (clipped)
          result.push({
            ...clipped,
            kind: 'shape',
            geometry: 'rect',
            gradient: cropGradient(g, tile, clipped),
          });
      }
  }
  return result;
}

export function roundPath(w: number, h: number, radii: number[]): PptxPathCommand[] {
  const values = radii.map((r) => Math.max(0, r));
  const scale = Math.min(
    1,
    w / (values[0] + values[1] || 1),
    w / (values[2] + values[3] || 1),
    h / (values[0] + values[3] || 1),
    h / (values[1] + values[2] || 1),
  );
  const [tl, tr, br, bl] = values.map((r) => r * scale);
  const k = 0.552284749831;
  return [
    { type: 'move', x: tl, y: 0 },
    { type: 'line', x: w - tr, y: 0 },
    { type: 'cubic', x1: w - tr + k * tr, y1: 0, x2: w, y2: tr - k * tr, x: w, y: tr },
    { type: 'line', x: w, y: h - br },
    { type: 'cubic', x1: w, y1: h - br + k * br, x2: w - br + k * br, y2: h, x: w - br, y: h },
    { type: 'line', x: bl, y: h },
    { type: 'cubic', x1: bl - k * bl, y1: h, x2: 0, y2: h - bl + k * bl, x: 0, y: h - bl },
    { type: 'line', x: 0, y: tl },
    { type: 'cubic', x1: 0, y1: tl - k * tl, x2: tl - k * tl, y2: 0, x: tl, y: 0 },
    { type: 'close' },
  ];
}
