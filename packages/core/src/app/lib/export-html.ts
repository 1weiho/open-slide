import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { designToCssVars } from './design';
import type { SlideModule } from './sdk';

type AssetEntry = { name: string; bytes: Uint8Array };

const ASSET_EXT_RE =
  /\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|woff2?|ttf|otf|mp3|wav|ogg)(?:\?[^#]*)?(?:#.*)?$/i;

export async function exportSlideAsHtml(slide: SlideModule, slideId: string): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const title = slide.meta?.title ?? slideId;

  const pagesHtml = await renderPagesToHtml(pages);
  const bundledCss = collectCss();
  const externalLinks = collectExternalStylesheetLinks();

  const assets = new Map<string, AssetEntry>();
  const usedNames = new Set<string>();

  const urls = new Set<string>([
    ...findHtmlAssetUrls(pagesHtml.join('\n')),
    ...findCssAssetUrls(bundledCss),
  ]);

  for (const url of urls) {
    const absolute = toAbsolute(url);
    if (!absolute) continue;
    try {
      const res = await fetch(absolute);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      const name = uniqueAssetName(absolute, usedNames);
      assets.set(url, { name, bytes: buf });
    } catch {}
  }

  const rewrittenPages = pagesHtml.map((html) => rewriteUrls(html, assets, 'html'));
  const rewrittenCss = rewriteUrls(bundledCss, assets, 'css');

  const html = buildHtml({
    title,
    pagesHtml: rewrittenPages,
    bundledCss: rewrittenCss,
    externalLinks,
    design: slide.design,
  });

  const htmlBytes = new TextEncoder().encode(html);

  if (assets.size === 0) {
    downloadBlob(new Blob([htmlBytes as BlobPart], { type: 'text/html' }), `${slideId}.html`);
    return;
  }

  const { zipSync } = await import('fflate');
  const zipTree: Record<string, Uint8Array | Record<string, Uint8Array>> = {
    [`${slideId}.html`]: htmlBytes,
    assets: {},
  };
  for (const { name, bytes } of assets.values()) {
    (zipTree.assets as Record<string, Uint8Array>)[name] = bytes;
  }
  const zipped = zipSync(zipTree as Parameters<typeof zipSync>[0]);
  downloadBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), `${slideId}.zip`);
}

async function renderPagesToHtml(pages: NonNullable<SlideModule['default']>): Promise<string[]> {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: '1920px',
    height: '1080px',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const result: string[] = [];
  try {
    for (const Page of pages) {
      const host = document.createElement('div');
      host.style.width = '1920px';
      host.style.height = '1080px';
      container.appendChild(host);
      const root = createRoot(host);
      root.render(createElement(Page));
      await nextPaint();
      await nextPaint();
      result.push(host.innerHTML);
      root.unmount();
      container.removeChild(host);
    }
  } finally {
    container.remove();
  }
  return result;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function collectCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      chunks.push(rule.cssText);
    }
  }
  return chunks.join('\n');
}

function collectExternalStylesheetLinks(): string {
  const links: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      void sheet.cssRules;
    } catch {
      if (sheet.href) {
        links.push(`<link rel="stylesheet" href="${escapeAttr(sheet.href)}">`);
      }
    }
  }
  return links.join('\n');
}

function findHtmlAssetUrls(html: string): string[] {
  const out: string[] = [];
  const attrRe = /\s(?:src|href)="([^"]+)"/g;
  for (const m of html.matchAll(attrRe)) {
    if (looksLikeAsset(m[1])) out.push(m[1]);
  }
  const srcsetRe = /\ssrcset="([^"]+)"/g;
  for (const m of html.matchAll(srcsetRe)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url && looksLikeAsset(url)) out.push(url);
    }
  }
  return out;
}

function findCssAssetUrls(css: string): string[] {
  const out: string[] = [];
  const re = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  for (const m of css.matchAll(re)) {
    const url = m[2].trim();
    if (looksLikeAsset(url)) out.push(url);
  }
  return out;
}

function looksLikeAsset(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) return false;
  if (url.startsWith('mailto:') || url.startsWith('javascript:')) return false;
  const abs = toAbsolute(url);
  if (!abs) return false;
  try {
    const u = new URL(abs);
    if (u.origin !== window.location.origin) return false;
  } catch {
    return false;
  }
  return ASSET_EXT_RE.test(url);
}

function toAbsolute(url: string): string | null {
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return null;
  }
}

function uniqueAssetName(absoluteUrl: string, used: Set<string>): string {
  let base: string;
  try {
    const u = new URL(absoluteUrl);
    base = u.pathname.split('/').pop() || 'asset';
  } catch {
    base = 'asset';
  }
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const hash = shortHash(absoluteUrl);
  const dot = base.lastIndexOf('.');
  const name = dot > 0 ? `${base.slice(0, dot)}-${hash}${base.slice(dot)}` : `${base}-${hash}`;
  used.add(name);
  return name;
}

function shortHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}

function rewriteUrls(
  source: string,
  assets: Map<string, AssetEntry>,
  kind: 'html' | 'css',
): string {
  let out = source;
  for (const [orig, { name }] of assets) {
    const replacement = kind === 'css' ? `./assets/${name}` : `assets/${name}`;
    out = out.split(orig).join(replacement);
  }
  return out;
}

function buildHtml(opts: {
  title: string;
  pagesHtml: string[];
  bundledCss: string;
  externalLinks: string;
  design: SlideModule['design'];
}): string {
  const pagesMarkup = opts.pagesHtml
    .map(
      (page, i) => `<div class="os-page" data-idx="${i}"${i === 0 ? '' : ' hidden'}>${page}</div>`,
    )
    .join('');

  const frameStyle = opts.design
    ? Object.entries(designToCssVars(opts.design))
        .map(([k, v]) => `${k}: ${v};`)
        .join(' ')
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${opts.externalLinks}
<style>
html, body { margin: 0; height: 100%; background: #000; overflow: hidden; font-family: system-ui, sans-serif; }
.os-stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
.os-frame { width: 1920px; height: 1080px; background: #fff; color: #000; transform-origin: center center; overflow: hidden; position: relative; }
.os-page { position: absolute; inset: 0; }
.os-page[hidden] { display: none !important; }
.os-counter { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); color: #fff; background: rgba(0,0,0,.5); padding: 2px 10px; border-radius: 999px; font-size: 12px; z-index: 10; font-variant-numeric: tabular-nums; }
</style>
<style>${opts.bundledCss}</style>
</head>
<body>
<div class="os-stage"><div class="os-frame" id="os-frame" data-osd-canvas${frameStyle ? ` style="${escapeAttr(frameStyle)}"` : ''}>${pagesMarkup}</div></div>
<div class="os-counter"><span id="os-cur">1</span> / <span id="os-total">${opts.pagesHtml.length}</span></div>
<script>
(function () {
  var pages = document.querySelectorAll('.os-page');
  var idx = 0;
  var frame = document.getElementById('os-frame');
  var cur = document.getElementById('os-cur');
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    frame.style.transform = 'scale(' + s + ')';
  }
  function go(i) {
    idx = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach(function (p, n) { p.hidden = n !== idx; });
    cur.textContent = String(idx + 1);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('keydown', function (e) {
    if (['ArrowRight','ArrowDown','PageDown',' '].indexOf(e.key) >= 0) { e.preventDefault(); go(idx + 1); }
    else if (['ArrowLeft','ArrowUp','PageUp'].indexOf(e.key) >= 0) { e.preventDefault(); go(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(pages.length - 1); }
  });
  fit();
  go(0);
})();
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
