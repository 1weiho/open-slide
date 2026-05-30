/**
 * Hand-rolled rasterisation helpers for the PNG exporter. Split from
 * `export-png.ts` per the CR's "helpers may be split into sibling files in the
 * same namespace if the count is exceeded" escape hatch (NFR-1), so the main
 * module respects the small-single-purpose-file SHOULD-under-300-lines target.
 *
 * The pipeline is: clone the mounted slide subtree with computed styles
 * inlined, embed Geist `@font-face` rules + same-origin `<img>` bytes as
 * `data:` URIs, serialise the clone inside an SVG `<foreignObject>` of the
 * canonical 1920×1080 viewBox, then `drawImage` it onto an offscreen canvas
 * supersampled ×2 and encode as PNG via `canvas.toBlob`.
 *
 * @agents-index PNG rasterisation helpers — DOM clone, style/font/image
 *               inlining, SVG foreignObject wrap, ×2 supersampled canvas PNG.
 */

/**
 * Rasteriser seam used by `export-png.ts`. Tests swap this with a stub so they
 * can simulate success / failure without a real `Image`/`canvas.toBlob`.
 */
export type Rasteriser = (url: string, width: number, height: number) => Promise<Blob>;

/**
 * Deep-clone `source` and, for every element in the clone, copy the source
 * element's computed style onto an inline `style` attribute. SVG
 * `<foreignObject>` only paints styles present in the serialised markup, so
 * flattening computed styles is the bridge between "looks right in the live
 * DOM" and "looks right after serialisation".
 */
export function cloneWithInlinedStyles(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const srcAll = source.querySelectorAll<HTMLElement>('*');
  const dstAll = clone.querySelectorAll<HTMLElement>('*');
  copyComputedStyle(source, clone);
  const len = Math.min(srcAll.length, dstAll.length);
  for (let i = 0; i < len; i++) {
    const s = srcAll[i];
    const d = dstAll[i];
    if (s && d) copyComputedStyle(s, d);
  }
  return clone;
}

function copyComputedStyle(src: Element, dst: Element): void {
  if (!(src instanceof HTMLElement) || !(dst instanceof HTMLElement)) return;
  const cs = window.getComputedStyle(src);
  let cssText = '';
  for (let i = 0; i < cs.length; i++) {
    const prop = cs.item(i);
    const value = cs.getPropertyValue(prop);
    if (!value) continue;
    const priority = cs.getPropertyPriority(prop);
    cssText += `${prop}:${value}${priority ? ' !important' : ''};`;
  }
  dst.setAttribute('style', cssText);
}

/**
 * Embed open-slide's bundled Geist `@font-face` rules as `data:` URIs in a
 * `<style>` prepended to `clone`. Geist is shipped by open-slide itself, so
 * all the source URLs are same-origin and safe to fetch. Without this step
 * the serialised `<foreignObject>` renders Geist as a fallback system font
 * (the SVG image loader does not consult the page's font registry).
 */
export async function inlineGeistFonts(clone: HTMLElement): Promise<void> {
  const cssChunks: string[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue('font-family');
      if (!/geist/i.test(family)) continue;
      const inlined = await inlineFontFaceSources(rule.cssText, seen);
      if (inlined) cssChunks.push(inlined);
    }
  }
  if (cssChunks.length === 0) return;
  const style = document.createElement('style');
  style.textContent = cssChunks.join('\n');
  clone.insertBefore(style, clone.firstChild);
}

async function inlineFontFaceSources(cssText: string, seen: Set<string>): Promise<string | null> {
  const urlRe = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  const matches: { full: string; url: string }[] = [];
  for (const m of cssText.matchAll(urlRe)) {
    matches.push({ full: m[0], url: m[2] });
  }
  let out = cssText;
  for (const { full, url } of matches) {
    if (url.startsWith('data:')) continue;
    const abs = toAbsoluteUrl(url);
    if (!abs) continue;
    try {
      const sameOrigin = new URL(abs).origin === window.location.origin;
      if (!sameOrigin) continue;
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      const res = await fetch(abs);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUri = await blobToDataUrl(blob);
      out = out.split(full).join(`url(${dataUri})`);
    } catch {}
  }
  return out;
}

/**
 * For each `<img>` in `clone` whose `src` is same-origin, fetch the bytes and
 * rewrite the `src` to a `data:` URI so the serialised SVG can paint the
 * image without a cross-origin canvas taint. Cross-origin `<img>` elements
 * are deliberately left untouched (documented limitation in the CR).
 */
export async function inlineSameOriginImages(clone: HTMLElement): Promise<void> {
  const imgs = Array.from(clone.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const abs = toAbsoluteUrl(src);
      if (!abs) return;
      try {
        if (new URL(abs).origin !== window.location.origin) return;
      } catch {
        return;
      }
      try {
        const res = await fetch(abs);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUri = await blobToDataUrl(blob);
        img.setAttribute('src', dataUri);
      } catch {}
    }),
  );
}

/**
 * Wrap `node` in an SVG `<foreignObject>` of the canonical viewBox and return
 * a `data:image/svg+xml` URL ready to feed to an `Image`. Serialisation uses
 * the platform `XMLSerializer` so attribute escaping matches what the SVG
 * image decoder expects.
 */
export function nodeToSvgDataUrl(node: HTMLElement, width: number, height: number): string {
  const xhtml = new XMLSerializer().serializeToString(node);
  const wrapped = xhtml.includes('xmlns="http://www.w3.org/1999/xhtml"')
    ? xhtml
    : xhtml.replace(/^<([a-zA-Z][\w-]*)/, '<$1 xmlns="http://www.w3.org/1999/xhtml"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${wrapped}</foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Load an SVG data URL into an `Image` and draw it onto an offscreen canvas
 * supersampled ×2 (backing-store 3840×2160, drawn down to the 1920×1080
 * output). The ×2 supersample mirrors the `zoom: 2` / `transform: scale(0.5)`
 * trick `export-pdf.ts` uses so the PNG matches the PDF's perceived
 * sharpness on filtered / composited layers.
 */
export function defaultRasteriseSvgToPng(
  url: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('export-png: 2d canvas context unavailable'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('export-png: canvas.toBlob produced no blob'));
            return;
          }
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error('export-png: SVG <foreignObject> image failed to load'));
    img.src = url;
  });
}

function toAbsoluteUrl(url: string): string | null {
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('FileReader failed'));
    fr.readAsDataURL(blob);
  });
}
