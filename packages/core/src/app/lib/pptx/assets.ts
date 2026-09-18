const PRESERVED_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif']);
const IMAGE_TIMEOUT_MS = 20_000;
const MAX_CANVAS_DIMENSION = 16_384;
const MAX_CANVAS_AREA = 268_000_000;

export type ImageAssetOptions = {
  width?: number;
  height?: number;
  filter?: string;
};

export type NormalizedImageAsset = {
  data: string;
  mime: string;
  assetId: string;
  svgData?: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type ImageAssetErrorCode =
  | 'invalid-url'
  | 'invalid-dimensions'
  | 'fetch-failed'
  | 'decode-failed'
  | 'svg-invalid'
  | 'svg-unsafe'
  | 'filter-unsupported'
  | 'render-failed'
  | 'render-too-large'
  | 'timeout';

export class ImageAssetError extends Error {
  constructor(
    message: string,
    public readonly code: ImageAssetErrorCode,
  ) {
    super(message);
    this.name = 'ImageAssetError';
  }
}

function cancelled(): DOMException {
  return new DOMException('Image asset loading was cancelled.', 'AbortError');
}

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) throw cancelled();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function dataUri(mime: string, bytes: Uint8Array): string {
  return `data:${mime};base64,${base64(bytes)}`;
}

function normalizedMime(value: string | null | undefined): string {
  return value?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

function mimeFromExtension(url: string): string {
  let pathname = url;
  try {
    pathname = new URL(url, document.baseURI).pathname;
  } catch {
    // Fetch will provide the definitive URL error if this is not a usable URL.
  }
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep the original path when a malformed escape is present.
  }
  const extension = pathname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension === 'png'
    ? 'image/png'
    : extension === 'jpe' || extension === 'jpeg' || extension === 'jpg'
      ? 'image/jpeg'
      : extension === 'gif'
        ? 'image/gif'
        : extension === 'svg'
          ? 'image/svg+xml'
          : extension === 'webp'
            ? 'image/webp'
            : '';
}

function sniffMime(bytes: Uint8Array): string {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  )
    return 'image/gif';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'image/webp';
  const text = new TextDecoder()
    .decode(bytes.subarray(0, 8192))
    .replace(/^\uFEFF/, '')
    .trimStart();
  if (/<svg(?:\s|>)/i.test(text) || /^<\?xml[\s\S]*?<svg(?:\s|>)/i.test(text))
    return 'image/svg+xml';
  return '';
}

function decodeMaybePercentEncoded(text: string): string {
  const withoutBom = text.replace(/^\uFEFF/, '');
  const trimmed = withoutBom.trimStart();
  if (/<svg(?:\s|>)/i.test(trimmed) || /^<\?xml[\s\S]*?<svg(?:\s|>)/i.test(trimmed))
    return withoutBom;
  try {
    const decoded = decodeURIComponent(withoutBom);
    if (/<svg(?:\s|>)/i.test(decoded) || /^<\?xml[\s\S]*?<svg(?:\s|>)/i.test(decoded))
      return decoded;
  } catch {
    // The response is not percent-encoded SVG text.
  }
  return withoutBom;
}

function isAllowedEmbeddedReference(value: string): boolean {
  const reference = value.trim().replace(/^['"]|['"]$/g, '');
  if (!reference || reference === 'none' || reference.startsWith('#')) return true;
  return /^data:image\/(?:png|jpe?g|gif|webp);/i.test(reference);
}

function rejectUnsafeSvg(svg: string, assetId: string): void {
  if (/<!doctype[^>]+(?:system|public)|<!entity|<\?xml-stylesheet\b/i.test(svg))
    throw new ImageAssetError(
      `SVG asset ${assetId} contains an external XML declaration or stylesheet. Remove the external reference.`,
      'svg-unsafe',
    );
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (document.querySelector('parsererror'))
    throw new ImageAssetError(
      `SVG asset ${assetId} could not be parsed. Provide valid self-contained SVG markup.`,
      'svg-invalid',
    );
  const root = document.documentElement;
  if (root?.localName.toLowerCase() !== 'svg')
    throw new ImageAssetError(
      `Asset ${assetId} is labelled as SVG but has no <svg> root element.`,
      'svg-invalid',
    );
  const forbiddenElements = new Set([
    'script',
    'foreignobject',
    'iframe',
    'object',
    'embed',
    'link',
    'audio',
    'video',
  ]);
  for (const element of document.querySelectorAll('*')) {
    const localName = element.localName.toLowerCase();
    if (forbiddenElements.has(localName))
      throw new ImageAssetError(
        `SVG asset ${assetId} contains <${element.localName}> content. Remove scripts, foreignObject, or external resources.`,
        'svg-unsafe',
      );
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on'))
        throw new ImageAssetError(
          `SVG asset ${assetId} contains the ${attribute.name} event handler. Remove script attributes.`,
          'svg-unsafe',
        );
      if (name === 'xml:base' && value)
        throw new ImageAssetError(
          `SVG asset ${assetId} contains xml:base. Remove the external base URL.`,
          'svg-unsafe',
        );
      if (
        ['href', 'xlink:href', 'src', 'data', 'poster'].includes(name) &&
        !isAllowedEmbeddedReference(value)
      )
        throw new ImageAssetError(
          `SVG asset ${assetId} references ${value}. Embed the resource as a data URI or use a local fragment such as #mask.`,
          'svg-unsafe',
        );
      for (const match of value.matchAll(/url\(\s*([^)]*?)\s*\)/gi)) {
        if (!isAllowedEmbeddedReference(match[1]))
          throw new ImageAssetError(
            `SVG asset ${assetId} references ${match[1]}. Use a local fragment or embedded data URI.`,
            'svg-unsafe',
          );
      }
    }
  }
  for (const style of document.querySelectorAll('style')) {
    const css = style.textContent ?? '';
    if (/@import\b/i.test(css))
      throw new ImageAssetError(
        `SVG asset ${assetId} imports an external stylesheet. Inline the stylesheet before exporting.`,
        'svg-unsafe',
      );
    for (const match of css.matchAll(/url\(\s*([^)]*?)\s*\)/gi)) {
      if (!isAllowedEmbeddedReference(match[1]))
        throw new ImageAssetError(
          `SVG asset ${assetId} references ${match[1]}. Use a local fragment or embedded data URI.`,
          'svg-unsafe',
        );
    }
  }
}

function positiveDimension(value: number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value <= 0)
    throw new ImageAssetError(
      `Image ${name} must be a positive finite number.`,
      'invalid-dimensions',
    );
  return value;
}

function renderDimensions(
  naturalWidth: number,
  naturalHeight: number,
  options: ImageAssetOptions,
  supersample: boolean,
): { width: number; height: number } {
  const requestedWidth = positiveDimension(options.width, 'width') ?? naturalWidth;
  const requestedHeight = positiveDimension(options.height, 'height') ?? naturalHeight;
  const factor = supersample ? 2 : 1;
  const scale = Math.max(
    1,
    (factor * requestedWidth) / naturalWidth,
    (factor * requestedHeight) / naturalHeight,
  );
  const width = Math.ceil(naturalWidth * scale);
  const height = Math.ceil(naturalHeight * scale);
  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION ||
    width * height > MAX_CANVAS_AREA
  )
    throw new ImageAssetError(
      `Image fallback would require a ${width} × ${height} canvas. Reduce the requested dimensions.`,
      'render-too-large',
    );
  return { width, height };
}

async function decodeImage(
  blob: Blob,
  signal: AbortSignal,
  assetId: string,
): Promise<HTMLImageElement> {
  checkAbort(signal);
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        signal.removeEventListener('abort', onAbort);
        image.onload = null;
        image.onerror = null;
      };
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
      };
      const onAbort = () => finish(cancelled());
      image.onload = () => {
        if (image.naturalWidth > 0 && image.naturalHeight > 0) finish();
        else
          finish(
            new ImageAssetError(
              `Image asset ${assetId} decoded without usable dimensions.`,
              'decode-failed',
            ),
          );
      };
      image.onerror = () =>
        finish(
          new ImageAssetError(
            `Image asset ${assetId} could not be decoded by the browser. Check that the file is a supported image.`,
            'decode-failed',
          ),
        );
      signal.addEventListener('abort', onAbort, { once: true });
      image.decoding = 'async';
      image.src = objectUrl;
      if (image.complete) {
        if (image.naturalWidth > 0 && image.naturalHeight > 0) finish();
        else if (image.currentSrc) image.onerror?.(new Event('error'));
      }
    });
    return image;
  } catch (error) {
    image.src = '';
    throw error;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function renderPng(
  image: HTMLImageElement,
  options: ImageAssetOptions,
  supersample: boolean,
  assetId: string,
): string {
  const dimensions = renderDimensions(
    image.naturalWidth,
    image.naturalHeight,
    options,
    supersample,
  );
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  try {
    const context = canvas.getContext('2d');
    if (!context)
      throw new ImageAssetError(
        `The browser cannot create a canvas for image asset ${assetId}.`,
        'render-failed',
      );
    const filter = options.filter?.trim() ?? '';
    if (filter && filter !== 'none') {
      if (filter.includes('url('))
        throw new ImageAssetError(
          `CSS filter ${filter} for image asset ${assetId} may reference another resource. Use a self-contained CSS filter.`,
          'filter-unsupported',
        );
      context.filter = filter;
      if (context.filter === 'none')
        throw new ImageAssetError(
          `CSS filter ${filter} is not supported by this browser for image asset ${assetId}.`,
          'filter-unsupported',
        );
    }
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    return canvas.toDataURL('image/png');
  } catch (error) {
    if (error instanceof ImageAssetError) throw error;
    throw new ImageAssetError(
      `Image asset ${assetId} could not be rendered as PNG: ${String(error)}.`,
      'render-failed',
    );
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function loadAsset(
  url: string,
  signal: AbortSignal,
  options: ImageAssetOptions,
): Promise<NormalizedImageAsset> {
  if (!url.trim()) throw new ImageAssetError('Image asset URL must not be empty.', 'invalid-url');
  checkAbort(signal);
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ImageAssetError(
      `Image asset ${url} could not be fetched: ${String(error)}.`,
      'fetch-failed',
    );
  }
  if (!response.ok)
    throw new ImageAssetError(
      `Image asset ${url} returned HTTP ${response.status}. Check that the asset is available.`,
      'fetch-failed',
    );
  let blob: Blob;
  let bytes: Uint8Array;
  try {
    blob = await response.blob();
    bytes = new Uint8Array(await blob.arrayBuffer());
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ImageAssetError(
      `Image asset ${url} could not be read after fetching: ${String(error)}.`,
      'fetch-failed',
    );
  }
  checkAbort(signal);
  const mime =
    sniffMime(bytes) ||
    normalizedMime(response.headers.get('content-type')) ||
    mimeFromExtension(url);
  if (mime === 'image/svg+xml') {
    const svgText = decodeMaybePercentEncoded(await blob.text());
    rejectUnsafeSvg(svgText, url);
    const svgBytes = new TextEncoder().encode(svgText);
    const svgBlob = new Blob([svgBytes], { type: 'image/svg+xml' });
    const image = await decodeImage(svgBlob, signal, url);
    try {
      const filter = options.filter?.trim() ?? '';
      return {
        data: renderPng(image, options, true, url),
        mime: 'image/png',
        assetId: url,
        ...(filter && filter !== 'none' ? {} : { svgData: dataUri('image/svg+xml', svgBytes) }),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    } finally {
      image.src = '';
    }
  }
  const image = await decodeImage(blob, signal, url);
  try {
    const filter = options.filter?.trim() ?? '';
    if (PRESERVED_MIMES.has(mime) && (!filter || filter === 'none'))
      return {
        data: dataUri(mime, bytes),
        mime,
        assetId: url,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    return {
      data: renderPng(image, options, false, url),
      mime: 'image/png',
      assetId: url,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  } finally {
    image.src = '';
  }
}

export async function normalizeImageAsset(
  url: string,
  signal: AbortSignal,
  options: ImageAssetOptions = {},
): Promise<NormalizedImageAsset> {
  const controller = new AbortController();
  let timedOut = false;
  const propagateAbort = () => controller.abort();
  signal.addEventListener('abort', propagateAbort, { once: true });
  let timeout: number | undefined;
  const timeoutError = () =>
    new ImageAssetError(
      `Image asset ${url} did not finish loading within ${IMAGE_TIMEOUT_MS} ms. Check the asset and retry.`,
      'timeout',
    );
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(timeoutError());
    }, IMAGE_TIMEOUT_MS);
  });
  try {
    checkAbort(signal);
    return await Promise.race([loadAsset(url, controller.signal, options), timeoutPromise]);
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (timedOut || (controller.signal.aborted && isAbortError(error))) throw timeoutError();
    if (isAbortError(error)) throw cancelled();
    throw error;
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
    signal.removeEventListener('abort', propagateAbort);
  }
}
