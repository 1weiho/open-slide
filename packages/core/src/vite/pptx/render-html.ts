import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadSlideModule } from './load-slide.ts';
import { instrumentTree, type PrimRecord } from './instrument.tsx';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export type PageHtml = {
  pageIndex: number;
  pageName: string;
  html: string;
  primitives: PrimRecord[];
};

export type SlideRender = {
  pages: PageHtml[];
  design: any;
};

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function rewriteAssetUrls(
  html: string,
  slideDir: string,
  assetMap: Map<string, string>,
): Promise<string> {
  // Slide module's asset imports were stubbed to their relative specifier
  // (e.g. "./assets/foo.png"). Inline as data: URLs so headless chromium does
  // not need filesystem access and the natural image size loads correctly.
  const matches = [...html.matchAll(/(src|href)="(\.\/[^"]+)"/g)];
  for (const m of matches) {
    const rel = m[2];
    if (assetMap.has(rel)) continue;
    const abs = path.resolve(slideDir, rel);
    // Keep asset reads inside the deck directory: the './' regex still matches
    // './../../secret', and path.resolve would escape slideDir — so a deck must
    // not be able to inline a file from outside its folder into the pptx.
    const root = path.resolve(slideDir);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      assetMap.set(rel, rel); // out of bounds — leave the specifier untouched
      continue;
    }
    try {
      const buf = await readFile(abs);
      const ext = path.extname(abs).toLowerCase();
      const mime = MIME[ext] ?? 'application/octet-stream';
      assetMap.set(rel, `data:${mime};base64,${buf.toString('base64')}`);
    } catch {
      assetMap.set(rel, rel); // missing — leave as-is
    }
  }
  return html.replace(/(src|href)="(\.\/[^"]+)"/g, (_m, attr, rel) => {
    return `${attr}="${assetMap.get(rel) ?? rel}"`;
  });
}

function htmlShell(body: string, designCss: string): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<style>
:root { ${designCss} }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  width: 1920px; height: 1080px;
  font-family: var(--osd-font-body, sans-serif);
  color: var(--osd-text, #1a1f2e);
  background: var(--osd-bg, #ffffff);
  overflow: hidden;
  position: relative;
  font-size: 16px;
}
h1, h2, h3, h4, h5, h6, p, ul, ol { margin: 0; padding: 0; }
</style>
</head><body>${body}</body></html>`;
}

function designToCss(design: any): string {
  const p = design?.palette ?? {};
  const f = design?.fonts ?? {};
  const t = design?.typeScale ?? {};
  const parts: string[] = [];
  if (p.bg) parts.push(`--osd-bg: ${p.bg};`);
  if (p.text) parts.push(`--osd-text: ${p.text};`);
  if (p.accent) parts.push(`--osd-accent: ${p.accent};`);
  if (f.display) parts.push(`--osd-font-display: ${f.display};`);
  if (f.body) parts.push(`--osd-font-body: ${f.body};`);
  // typeScale → CSS pixel values. Decks reference these as
  // `var(--osd-size-hero)` / `var(--osd-size-body)`. Without the vars the
  // browser falls back to inherited 16px and the hero text rasterises tiny.
  if (typeof t.hero === 'number') parts.push(`--osd-size-hero: ${t.hero}px;`);
  if (typeof t.body === 'number') parts.push(`--osd-size-body: ${t.body}px;`);
  return parts.join(' ');
}

export async function renderSlideHtml(slideDir: string): Promise<SlideRender> {
  const mod = await loadSlideModule(slideDir);
  const pages = (mod as any).default as Array<() => React.ReactNode>;
  if (!Array.isArray(pages))
    throw new Error('slide module default export must be an array of pages');
  const design = (mod as any).design ?? {};
  const designCss = designToCss(design);

  const assetMap = new Map<string, string>();
  const out: PageHtml[] = [];
  // Communicate page index/total to the stubbed `useSlidePageNumber` hook
  // bundled into the user's deck. See `OPEN_SLIDE_STUB_SOURCE` in load-slide.ts.
  const g = globalThis as { __os_pptx_page_index?: number; __os_pptx_page_total?: number };
  const prevIndex = g.__os_pptx_page_index;
  const prevTotal = g.__os_pptx_page_total;
  try {
    g.__os_pptx_page_total = pages.length;
    for (let i = 0; i < pages.length; i++) {
      g.__os_pptx_page_index = i;
      const PageFn = pages[i] as any;
      const pageName = PageFn?.displayName || PageFn?.name || `page-${i}`;
      let body = '';
      let primitives: PrimRecord[] = [];
      try {
        const raw = React.createElement(PageFn);
        const { tree, primitives: prims } = instrumentTree(raw, `pg${i}`, { skipRoot: true });
        primitives = prims;
        body = ReactDOMServer.renderToStaticMarkup(tree as any);
      } catch (e: any) {
        body = `<div style="color:red;padding:40px">extract error: ${escAttr(String(e?.message ?? e))}</div>`;
      }
      body = await rewriteAssetUrls(body, slideDir, assetMap);
      out.push({ pageIndex: i, pageName, html: htmlShell(body, designCss), primitives });
    }
  } finally {
    g.__os_pptx_page_index = prevIndex;
    g.__os_pptx_page_total = prevTotal;
  }
  return { pages: out, design };
}
