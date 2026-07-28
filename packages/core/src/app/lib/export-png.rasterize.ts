/**
 * Hand-rolled rasterisation helpers for the PNG exporter. Split from
 * `export-png.ts` per the CR's "helpers may be split into sibling files in the
 * same namespace if the count is exceeded" escape hatch (NFR-1), so the main
 * module respects the small-single-purpose-file SHOULD-under-300-lines target.
 *
 * The pipeline clones the mounted slide subtree with computed styles inlined
 * (including `::before` / `::after` pseudo-elements), embeds Geist
 * `@font-face` rules, same-origin `<img>` bytes, and same-origin `url()`
 * background images as `data:` URIs, serialises the clone inside an SVG
 * `<foreignObject>`, then `drawImage`s it onto an offscreen canvas — rendering
 * the SVG at ×2 density and drawing it down to the exact 1920×1080 output so
 * the PNG is crisp yet matches the canonical canvas size.
 *
 * Self-containment note: a `<foreignObject>` painted via an `Image` runs in an
 * isolated context with no network and no access to the page's stylesheet or
 * font registry, so every visual input (computed styles, pseudo-elements,
 * fonts, images, background images) must be flattened into the serialised
 * markup. That is why the clone is so thorough — it is the only way the SVG
 * renderer reproduces the live DOM pixel-for-pixel.
 *
 * @agents-index PNG rasterisation helpers — DOM clone with pseudo-elements,
 *               style/font/image/background inlining, SVG foreignObject wrap,
 *               ×2-supersampled 1920×1080 canvas PNG.
 */

/**
 * Rasteriser seam used by `export-png.ts`. Tests swap this with a stub so they
 * can simulate success / failure without a real `Image`/`canvas.toBlob`.
 */
export type Rasteriser = (url: string, width: number, height: number) => Promise<Blob>;

/** Supersample factor: render the SVG at this density, then draw down. */
const SUPERSAMPLE = 2;

let pseudoUid = 0;

/**
 * Deep-clone `source`, flattening every element's computed style (and its
 * `::before` / `::after` pseudo-elements) into the serialised markup, and
 * neutralise the root's offscreen positioning so the clone paints from the
 * top-left of the `<foreignObject>` viewport instead of off-screen.
 *
 * SVG `<foreignObject>` only paints styles present in the serialised markup,
 * so flattening computed styles is the bridge between "looks right in the live
 * DOM" and "looks right after serialisation". Pseudo-elements are emitted as
 * generated `[data-osp]::before/::after` rules in a prepended `<style>` rather
 * than as injected elements, so they do not perturb the clone's layout.
 */
export function cloneWithInlinedStyles(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const srcAll: Element[] = [source, ...Array.from(source.querySelectorAll('*'))];
  const dstAll: Element[] = [clone, ...Array.from(clone.querySelectorAll('*'))];
  const pseudoRules: string[] = [];
  const len = Math.min(srcAll.length, dstAll.length);
  for (let i = 0; i < len; i++) {
    const s = srcAll[i];
    const d = dstAll[i];
    if (s && d) {
      copyComputedStyle(s, d);
      capturePseudoElements(s, d, pseudoRules);
    }
  }
  neutraliseRootPositioning(clone);
  if (pseudoRules.length > 0) {
    const style = document.createElement('style');
    style.textContent = pseudoRules.join('\n');
    clone.insertBefore(style, clone.firstChild);
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
 * The offscreen host is positioned at `left: -99999px` so the user never sees
 * it; copying that computed style onto the clone root would push the whole
 * slide out of the `<foreignObject>` viewport and produce a blank PNG. Reset
 * the root to static, zero-inset, no-transform so it fills the canvas.
 */
function neutraliseRootPositioning(el: HTMLElement): void {
  for (const [prop, value] of [
    ['position', 'static'],
    ['left', '0'],
    ['top', '0'],
    ['right', 'auto'],
    ['bottom', 'auto'],
    ['margin', '0'],
    ['transform', 'none'],
  ] as const) {
    el.style.setProperty(prop, value, 'important');
  }
}

/**
 * Capture an element's `::before` / `::after` pseudo-elements as generated CSS
 * rules. `cloneNode` does not reproduce pseudo-elements, so without this any
 * slide decoration drawn via `content` / pseudo-element backgrounds would be
 * missing from the PNG.
 */
function capturePseudoElements(src: Element, dst: Element, out: string[]): void {
  if (!(src instanceof HTMLElement) || !(dst instanceof HTMLElement)) return;
  let uid: string | null = null;
  for (const pseudo of ['::before', '::after'] as const) {
    const cs = window.getComputedStyle(src, pseudo);
    const content = cs.getPropertyValue('content');
    if (!content || content === 'none' || content === 'normal') continue;
    if (uid === null) {
      uid = `osp${pseudoUid++}`;
      dst.setAttribute('data-osp', uid);
    }
    let cssText = '';
    for (let i = 0; i < cs.length; i++) {
      const prop = cs.item(i);
      const value = cs.getPropertyValue(prop);
      if (value) cssText += `${prop}:${value};`;
    }
    // The values above are the settled ones, but they carry the `animation`
    // shorthand with them — and a rule that re-declares the animation replays
    // it from its (typically invisible) 0% frame in the clone. `freezeForCapture`
    // cannot reach pseudo-elements, so neutralise them here instead.
    cssText += 'animation:none !important;transition:none !important;';
    out.push(`[data-osp="${uid}"]${pseudo}{${cssText}}`);
  }
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
  const seen = new Map<string, string>();
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
      cssChunks.push(await inlineCssUrls(rule.cssText, seen));
    }
  }
  if (cssChunks.length === 0) return;
  const style = document.createElement('style');
  style.textContent = cssChunks.join('\n');
  clone.insertBefore(style, clone.firstChild);
}

/**
 * For each `<img>` in `clone` whose `src` is same-origin, fetch the bytes and
 * rewrite the `src` to a `data:` URI so the serialised SVG can paint the
 * image without a cross-origin canvas taint. Cross-origin `<img>` elements
 * are deliberately left untouched (documented limitation in the CR).
 */
export async function inlineSameOriginImages(clone: HTMLElement): Promise<void> {
  const cache = new Map<string, string>();
  const imgs = Array.from(clone.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const dataUri = await fetchSameOriginAsDataUrl(src, cache);
      if (dataUri) img.setAttribute('src', dataUri);
    }),
  );
}

/**
 * Inline same-origin `url()` references inside flattened `background-image`
 * inline styles as `data:` URIs. Computed-style flattening leaves background
 * images as absolute `http(s)` URLs that the SVG image loader cannot fetch, so
 * they must be embedded for backgrounds to appear in the PNG.
 */
export async function inlineBackgroundImages(clone: HTMLElement): Promise<void> {
  const cache = new Map<string, string>();
  const all: HTMLElement[] = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  await Promise.all(
    all.map(async (el) => {
      const bg = el.style.backgroundImage;
      if (!bg?.includes('url(')) return;
      const replaced = await inlineCssUrls(bg, cache);
      if (replaced !== bg) el.style.backgroundImage = replaced;
    }),
  );
}

/**
 * Replace every `url(...)` in a CSS fragment that points at a same-origin
 * resource with a `data:` URI, memoising fetches via `cache`. Cross-origin and
 * already-`data:` URLs are left untouched.
 */
async function inlineCssUrls(cssText: string, cache: Map<string, string>): Promise<string> {
  const urlRe = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  const matches: { full: string; url: string }[] = [];
  for (const m of cssText.matchAll(urlRe)) {
    if (m[2]) matches.push({ full: m[0], url: m[2] });
  }
  let out = cssText;
  for (const { full, url } of matches) {
    if (url.startsWith('data:')) continue;
    const dataUri = await fetchSameOriginAsDataUrl(url, cache);
    if (dataUri) out = out.split(full).join(`url(${dataUri})`);
  }
  return out;
}

async function fetchSameOriginAsDataUrl(
  url: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const abs = toAbsoluteUrl(url);
  if (!abs) return null;
  const cached = cache.get(abs);
  if (cached !== undefined) return cached || null;
  try {
    if (new URL(abs).origin !== window.location.origin) {
      cache.set(abs, '');
      return null;
    }
    const res = await fetch(abs);
    if (!res.ok) {
      cache.set(abs, '');
      return null;
    }
    const dataUri = await blobToDataUrl(await res.blob());
    cache.set(abs, dataUri);
    return dataUri;
  } catch {
    cache.set(abs, '');
    return null;
  }
}

/**
 * Wrap `node` in an SVG `<foreignObject>` and return a `data:image/svg+xml`
 * URL ready to feed to an `Image`. The SVG's pixel `width`/`height` are the
 * output dimensions multiplied by `SUPERSAMPLE` while the `viewBox` stays at
 * the output dimensions, so the browser rasterises the content at ×2 density;
 * `defaultRasteriseSvgToPng` then draws it down to the exact output size.
 */
export function nodeToSvgDataUrl(node: HTMLElement, width: number, height: number): string {
  const xhtml = new XMLSerializer().serializeToString(node);
  const wrapped = xhtml.includes('xmlns="http://www.w3.org/1999/xhtml"')
    ? xhtml
    : xhtml.replace(/^<([a-zA-Z][\w-]*)/, '<$1 xmlns="http://www.w3.org/1999/xhtml"');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SUPERSAMPLE}" height="${height * SUPERSAMPLE}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">${wrapped}</foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Load an SVG data URL into an `Image` and draw it onto an offscreen canvas
 * sized to the exact 1920×1080 output (FR-3). The SVG is rasterised by the
 * browser at ×2 density (see `nodeToSvgDataUrl`) and drawn down here with
 * high-quality smoothing, which is the PNG analogue of the `zoom: 2` /
 * `scale(0.5)` supersample trick `export-pdf.ts` uses for crisp output.
 */
export function defaultRasteriseSvgToPng(
  url: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('export-png: 2d canvas context unavailable'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
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
