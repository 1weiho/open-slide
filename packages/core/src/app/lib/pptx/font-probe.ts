export type GlyphProbeStatus = 'supported' | 'missing' | 'unknown';

export type GlyphProbeStyle = {
  size?: number;
  style?: string;
  weight?: string | number;
};

export type GlyphProbe = {
  hasGlyph: (family: string, text: string, style?: GlyphProbeStyle) => GlyphProbeStatus;
  dispose: () => void;
};

type Point = [number, number];

const FONT_SIZE = 64;
const CANVAS_WIDTH = 128;
const CANVAS_HEIGHT = 112;
const TEXT_X = 8;
const TEXT_Y = 80;
const SENTINEL_WEIGHT = '100 900';

let nextProbeId = 0;

class ByteWriter {
  private readonly bytes: number[] = [];

  u8(value: number): void {
    this.bytes.push(value & 0xff);
  }

  u16(value: number): void {
    this.bytes.push((value >>> 8) & 0xff, value & 0xff);
  }

  i16(value: number): void {
    this.u16(value < 0 ? value + 0x10000 : value);
  }

  u32(value: number): void {
    this.bytes.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    );
  }

  u24(value: number): void {
    this.bytes.push((value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  }

  i32(value: number): void {
    this.u32(value < 0 ? value + 0x100000000 : value);
  }

  u64(value: number): void {
    this.u32(Math.floor(value / 0x100000000));
    this.u32(value >>> 0);
  }

  raw(values: ArrayLike<number>): void {
    for (let index = 0; index < values.length; index += 1) this.bytes.push(values[index] ?? 0);
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

function simpleGlyph(points: Point[], bounds: [number, number, number, number]): Uint8Array {
  const writer = new ByteWriter();
  writer.i16(1);
  writer.i16(bounds[0]);
  writer.i16(bounds[1]);
  writer.i16(bounds[2]);
  writer.i16(bounds[3]);
  writer.u16(points.length - 1);
  writer.u16(0);
  for (let index = 0; index < points.length; index += 1) writer.u8(1);
  let previousX = 0;
  for (const [x] of points) {
    writer.i16(x - previousX);
    previousX = x;
  }
  let previousY = 0;
  for (const [, y] of points) {
    writer.i16(y - previousY);
    previousY = y;
  }
  return writer.toBytes();
}

const NOTDEF_GLYPH = simpleGlyph(
  [
    [100, 100],
    [100, 700],
    [700, 700],
    [700, 100],
  ],
  [100, 100, 700, 700],
);

const DIAMOND_GLYPH = simpleGlyph(
  [
    [450, 80],
    [820, 450],
    [450, 820],
    [80, 450],
  ],
  [80, 80, 820, 820],
);

const RING_GLYPH = simpleGlyph(
  [
    [120, 140],
    [120, 760],
    [760, 760],
    [760, 140],
  ],
  [120, 140, 760, 760],
);

function utf16be(value: string): Uint8Array {
  const writer = new ByteWriter();
  for (const character of value) writer.u16(character.codePointAt(0) ?? 0);
  return writer.toBytes();
}

function maxpTable(): Uint8Array {
  const writer = new ByteWriter();
  writer.u32(0x00010000);
  writer.u16(3);
  writer.u16(4);
  writer.u16(1);
  writer.u16(0);
  writer.u16(0);
  writer.u16(2);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  writer.u16(0);
  return writer.toBytes();
}

function headTable(): Uint8Array {
  const writer = new ByteWriter();
  writer.u32(0x00010000);
  writer.u32(0x00010000);
  writer.u32(0);
  writer.u32(0x5f0f3cf5);
  writer.u16(0x000b);
  writer.u16(1000);
  writer.u64(0);
  writer.u64(0);
  writer.i16(0);
  writer.i16(0);
  writer.i16(820);
  writer.i16(820);
  writer.u16(0);
  writer.u16(8);
  writer.i16(2);
  writer.i16(1);
  writer.i16(0);
  return writer.toBytes();
}

function hheaTable(): Uint8Array {
  const writer = new ByteWriter();
  writer.u32(0x00010000);
  writer.i16(820);
  writer.i16(-220);
  writer.i16(0);
  writer.u16(900);
  writer.i16(50);
  writer.i16(50);
  writer.i16(850);
  writer.i16(1);
  writer.i16(0);
  writer.i16(0);
  writer.i16(0);
  writer.i16(0);
  writer.i16(0);
  writer.i16(0);
  writer.i16(0);
  writer.u16(3);
  return writer.toBytes();
}

function hmtxTable(): Uint8Array {
  const writer = new ByteWriter();
  for (let index = 0; index < 3; index += 1) {
    writer.u16(900);
    writer.i16(50);
  }
  return writer.toBytes();
}

function os2Table(): Uint8Array {
  const writer = new ByteWriter();
  writer.u16(0);
  writer.i16(500);
  writer.u16(400);
  writer.u16(5);
  writer.i16(0);
  writer.i16(650);
  writer.i16(150);
  writer.i16(0);
  writer.i16(0);
  writer.i16(650);
  writer.i16(150);
  writer.i16(0);
  writer.i16(700);
  writer.i16(300);
  writer.i16(0);
  writer.i16(0);
  writer.raw(new Uint8Array(10));
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);
  writer.raw([0x4f, 0x53, 0x2f, 0x32]);
  writer.u16(0);
  writer.u16(0x20);
  writer.u16(0xff);
  writer.i16(800);
  writer.i16(-200);
  writer.i16(0);
  writer.u16(820);
  writer.u16(220);
  return writer.toBytes();
}

function nameTable(): Uint8Array {
  const records: [number, string][] = [
    [1, 'OpenSlide Glyph Probe'],
    [2, 'Regular'],
    [4, 'OpenSlide Glyph Probe'],
    [6, 'OpenSlideGlyphProbe'],
  ];
  const strings = records.map(([, value]) => utf16be(value));
  const writer = new ByteWriter();
  writer.u16(0);
  writer.u16(records.length);
  writer.u16(6 + records.length * 12);
  let offset = 0;
  for (let index = 0; index < records.length; index += 1) {
    const [nameId] = records[index] ?? [0, ''];
    const string = strings[index] ?? new Uint8Array();
    writer.u16(3);
    writer.u16(1);
    writer.u16(0x0409);
    writer.u16(nameId);
    writer.u16(string.length);
    writer.u16(offset);
    offset += string.length;
  }
  for (const string of strings) writer.raw(string);
  return writer.toBytes();
}

function postTable(): Uint8Array {
  const writer = new ByteWriter();
  writer.u32(0x00030000);
  writer.i32(0);
  writer.i16(-100);
  writer.i16(50);
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);
  writer.u32(0);
  return writer.toBytes();
}

function cmapTable(codepoints: number[]): Uint8Array {
  const writer = new ByteWriter();
  const subtableLength = 16 + codepoints.length * 12;
  const emoji = codepoints.filter(isEmoji);
  const selectors = codepoints.filter((codepoint) => codepoint === 0xfe0e || codepoint === 0xfe0f);
  const variants = emoji.length && selectors.length;
  const headerLength = variants ? 20 : 12;
  writer.u16(0);
  writer.u16(variants ? 2 : 1);
  if (variants) {
    writer.u16(0);
    writer.u16(5);
    writer.u32(headerLength + subtableLength);
  }
  writer.u16(3);
  writer.u16(10);
  writer.u32(headerLength);
  writer.u16(12);
  writer.u16(0);
  writer.u32(subtableLength);
  writer.u32(0);
  writer.u32(codepoints.length);
  for (const codepoint of codepoints) {
    writer.u32(codepoint);
    writer.u32(codepoint);
    writer.u32(1);
  }
  if (variants) {
    const recordsLength = 10 + selectors.length * 11;
    writer.u16(14);
    writer.u32(recordsLength + 4 + emoji.length * 4);
    writer.u32(selectors.length);
    for (const selector of selectors) {
      writer.u24(selector);
      writer.u32(recordsLength);
      writer.u32(0);
    }
    writer.u32(emoji.length);
    for (const codepoint of emoji) {
      writer.u24(codepoint);
      writer.u8(0);
    }
  }
  return writer.toBytes();
}

function checksum(bytes: Uint8Array): number {
  let sum = 0;
  for (let offset = 0; offset < bytes.length; offset += 4) {
    sum =
      (sum +
        ((((bytes[offset] ?? 0) << 24) >>> 0) |
          ((bytes[offset + 1] ?? 0) << 16) |
          ((bytes[offset + 2] ?? 0) << 8) |
          (bytes[offset + 3] ?? 0))) >>>
      0;
  }
  return sum >>> 0;
}

function padded(bytes: Uint8Array): Uint8Array {
  const output = new Uint8Array((bytes.length + 3) & ~3);
  output.set(bytes);
  return output;
}

function buildFont(codepoints: number[], glyph: Uint8Array): ArrayBuffer {
  const glyphs = [NOTDEF_GLYPH, glyph, RING_GLYPH];
  const glyfWriter = new ByteWriter();
  const offsets = [0];
  for (const item of glyphs) {
    glyfWriter.raw(item);
    offsets.push((offsets.at(-1) ?? 0) + item.length);
  }
  const locaWriter = new ByteWriter();
  for (const offset of offsets) locaWriter.u32(offset);
  const tables = new Map<string, Uint8Array>([
    ['OS/2', os2Table()],
    ['cmap', cmapTable(codepoints)],
    ['glyf', glyfWriter.toBytes()],
    ['head', headTable()],
    ['hhea', hheaTable()],
    ['hmtx', hmtxTable()],
    ['loca', locaWriter.toBytes()],
    ['maxp', maxpTable()],
    ['name', nameTable()],
    ['post', postTable()],
  ]);
  const tags = [...tables.keys()].sort();
  const numTables = tags.length;
  const maxPower = 2 ** Math.floor(Math.log2(numTables));
  const header = new ByteWriter();
  header.u32(0x00010000);
  header.u16(numTables);
  header.u16(maxPower * 16);
  header.u16(Math.log2(maxPower));
  header.u16(numTables * 16 - maxPower * 16);
  const directory = new ByteWriter();
  const offsetsByTag = new Map<string, number>();
  let offset = 12 + numTables * 16;
  const chunks: Uint8Array[] = [];
  for (const tag of tags) {
    const data = tables.get(tag);
    if (!data) throw new Error('Missing generated font table.');
    const chunk = padded(data);
    offsetsByTag.set(tag, offset);
    directory.raw(new TextEncoder().encode(tag));
    directory.u32(checksum(data));
    directory.u32(offset);
    directory.u32(data.length);
    chunks.push(chunk);
    offset += chunk.length;
  }
  const fontWriter = new ByteWriter();
  fontWriter.raw(header.toBytes());
  fontWriter.raw(directory.toBytes());
  for (const chunk of chunks) fontWriter.raw(chunk);
  const font = fontWriter.toBytes();
  const headOffset = offsetsByTag.get('head');
  if (headOffset === undefined) throw new Error('Missing generated font header.');
  new DataView(font.buffer).setUint32(headOffset + 8, (0xb1b0afba - checksum(font)) >>> 0);
  const output = new ArrayBuffer(font.byteLength);
  new Uint8Array(output).set(font);
  return output;
}

function scalarCodepoints(text: string): number[] | undefined {
  const codepoints: number[] = [];
  for (const character of text) {
    const codepoint = character.codePointAt(0);
    if (codepoint === undefined || (codepoint >= 0xd800 && codepoint <= 0xdfff)) return;
    codepoints.push(codepoint);
  }
  return codepoints;
}

function isEmoji(codepoint: number): boolean {
  return (
    (codepoint >= 0x1f000 && codepoint <= 0x1faff) || (codepoint >= 0x2600 && codepoint <= 0x27bf)
  );
}

function isComplexCodepoint(codepoint: number): boolean {
  return (
    (codepoint >= 0x0300 && codepoint <= 0x036f) ||
    (codepoint >= 0x1ab0 && codepoint <= 0x1aff) ||
    (codepoint >= 0x1dc0 && codepoint <= 0x1dff) ||
    (codepoint >= 0x20d0 && codepoint <= 0x20ff) ||
    (codepoint >= 0xfe20 && codepoint <= 0xfe2f) ||
    codepoint === 0x00ad ||
    codepoint === 0x061c ||
    codepoint === 0x200c ||
    codepoint === 0x200d ||
    (codepoint >= 0x200e && codepoint <= 0x200f) ||
    (codepoint >= 0x202a && codepoint <= 0x202e) ||
    (codepoint >= 0x2060 && codepoint <= 0x206f) ||
    (codepoint >= 0xfe00 && codepoint <= 0xfe0f) ||
    (codepoint >= 0xe0100 && codepoint <= 0xe01ef)
  );
}

function quoteFamily(family: string): string {
  return `"${family.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function samePixels(left: Uint8ClampedArray, right: Uint8ClampedArray): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function hasInk(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) return true;
  }
  return false;
}

function abortError(): DOMException {
  return new DOMException('The glyph probe was aborted.', 'AbortError');
}

export async function createGlyphProbe(
  characters: string,
  signal?: AbortSignal,
): Promise<GlyphProbe> {
  const codepoints = scalarCodepoints(characters);
  if (!codepoints?.length)
    throw new TypeError('Glyph probe characters must contain a Unicode scalar.');
  if (signal?.aborted) throw abortError();
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts)
    throw new Error('The browser FontFace API is unavailable.');

  const uniqueCodepoints = [...new Set(codepoints)].sort((left, right) => left - right);
  const probeId = nextProbeId++;
  const familyA = `OpenSlideGlyphProbeA${probeId}`;
  const familyB = `OpenSlideGlyphProbeB${probeId}`;
  const faces = [
    new FontFace(familyA, buildFont(uniqueCodepoints, DIAMOND_GLYPH), {
      style: 'normal',
      weight: SENTINEL_WEIGHT,
    }),
    new FontFace(familyB, buildFont(uniqueCodepoints, RING_GLYPH), {
      style: 'normal',
      weight: SENTINEL_WEIGHT,
    }),
  ];
  let disposed = false;
  let disposeProbe: (() => void) | undefined;
  const cleanup = () => {
    for (const face of faces) document.fonts.delete(face);
  };
  const onAbort = () => {
    if (disposeProbe) disposeProbe();
    else {
      disposed = true;
      cleanup();
    }
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  let abortListener: (() => void) | undefined;
  try {
    for (const face of faces) document.fonts.add(face);
    const abortPromise = signal
      ? new Promise<never>((_resolve, reject) => {
          abortListener = () => reject(abortError());
          signal.addEventListener('abort', abortListener, { once: true });
        })
      : new Promise<never>(() => undefined);
    await Promise.race([Promise.all(faces.map((face) => face.load())), abortPromise]);
    if (signal?.aborted) throw abortError();
  } catch (error) {
    cleanup();
    signal?.removeEventListener('abort', onAbort);
    if (abortListener) signal?.removeEventListener('abort', abortListener);
    throw error;
  }
  if (abortListener) signal?.removeEventListener('abort', abortListener);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    cleanup();
    signal?.removeEventListener('abort', onAbort);
    if (abortListener) signal?.removeEventListener('abort', abortListener);
    throw new Error('The browser cannot create a glyph probe canvas.');
  }
  const coverage = new Set(uniqueCodepoints);
  const cache = new Map<string, GlyphProbeStatus>();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cache.clear();
    canvas.width = 0;
    canvas.height = 0;
    cleanup();
    signal?.removeEventListener('abort', onAbort);
  };
  disposeProbe = dispose;
  const render = (family: string, text: string, style: GlyphProbeStyle): Uint8ClampedArray => {
    const size =
      Number.isFinite(style.size) && (style.size ?? 0) > 0 ? (style.size ?? FONT_SIZE) : FONT_SIZE;
    const weight = style.weight ?? '400';
    const fontStyle = style.style ?? 'normal';
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setCanvasFont(context, `${fontStyle} ${weight} ${size}px ${family}`);
    context.textBaseline = 'alphabetic';
    context.fillStyle = '#000';
    context.fillText(text, TEXT_X, TEXT_Y);
    return context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
  };
  const hasGlyph = (
    family: string,
    text: string,
    style: GlyphProbeStyle = {},
  ): GlyphProbeStatus => {
    if (disposed) return 'unknown';
    const queryCodepoints = scalarCodepoints(text);
    if (!queryCodepoints?.length) return 'unknown';
    const emojiVariant =
      queryCodepoints.length === 2 &&
      isEmoji(queryCodepoints[0]) &&
      (queryCodepoints[1] === 0xfe0e || queryCodepoints[1] === 0xfe0f);
    if (queryCodepoints.length !== 1 && !emojiVariant) return 'unknown';
    if (queryCodepoints.some((codepoint) => !coverage.has(codepoint))) return 'unknown';
    if (!emojiVariant && queryCodepoints.some(isComplexCodepoint)) return 'unknown';
    const normalizedFamily = family.trim();
    if (!normalizedFamily) return 'unknown';
    const normalizedStyle = {
      size: Number.isFinite(style.size) && (style.size ?? 0) > 0 ? style.size : FONT_SIZE,
      style: style.style ?? 'normal',
      weight: String(style.weight ?? '400'),
    };
    const key = `${normalizedFamily}\u0000${text}\u0000${normalizedStyle.size}\u0000${normalizedStyle.style}\u0000${normalizedStyle.weight}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const candidate = quoteFamily(normalizedFamily);
    const sentinelA = quoteFamily(familyA);
    const sentinelB = quoteFamily(familyB);
    const renderStyle = normalizedStyle;
    const baselineA = render(sentinelA, text, renderStyle);
    const baselineB = render(sentinelB, text, renderStyle);
    const candidateA = render(`${candidate}, ${sentinelA}`, text, renderStyle);
    const candidateB = render(`${candidate}, ${sentinelB}`, text, renderStyle);
    let result: GlyphProbeStatus = 'unknown';
    const distinctSentinels =
      hasInk(baselineA) && hasInk(baselineB) && !samePixels(baselineA, baselineB);
    const independent =
      distinctSentinels &&
      hasInk(candidateA) &&
      hasInk(candidateB) &&
      samePixels(candidateA, candidateB) &&
      !samePixels(candidateA, baselineA) &&
      !samePixels(candidateA, baselineB);
    const fallbackA = samePixels(candidateA, baselineA);
    const fallbackB = samePixels(candidateB, baselineB);
    if (independent) result = 'supported';
    else if (distinctSentinels && fallbackA && fallbackB) result = 'missing';
    cache.set(key, result);
    return result;
  };
  return { hasGlyph, dispose };
}

import { setCanvasFont } from './style';
