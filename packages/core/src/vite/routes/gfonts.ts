import type { ViteDevServer } from 'vite';
import { json } from './context.ts';

// GET /__gfonts/search?q=&limit=     search the Google Fonts catalog (public metadata, no API key)
// GET /__gfonts/download?family=&variant=  download one weight as a single font file from gstatic

const CATALOG_URL = 'https://fonts.google.com/metadata/fonts';
const CATALOG_TTL = 60 * 60 * 1000;
// The css v1 endpoint serves a single complete TrueType file for generic UAs.
// Modern browser UAs get unicode-range-subset woff2 split across many files,
// and an MSIE UA gets EOT — a bare Mozilla token sidesteps both.
const LEGACY_UA = 'Mozilla/5.0';
const FONT_EXTS = new Set(['ttf', 'otf', 'woff', 'woff2']);

type CatalogEntry = {
  family: string;
  category: string;
  variants: string[];
  popularity: number;
};

let catalogCache: { at: number; entries: CatalogEntry[] } | null = null;
let catalogInflight: Promise<CatalogEntry[]> | null = null;

async function loadCatalog(): Promise<CatalogEntry[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL) return catalogCache.entries;
  if (catalogInflight) return catalogInflight;
  catalogInflight = (async () => {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`metadata ${res.status}`);
    const text = await res.text();
    // Google guards the JSON with an XSSI prefix like ")]}'".
    const start = text.indexOf('{');
    const data = JSON.parse(start > 0 ? text.slice(start) : text) as {
      familyMetadataList?: Array<{
        family: string;
        category?: string;
        fonts?: Record<string, unknown>;
        popularity?: number;
      }>;
    };
    const entries: CatalogEntry[] = (data.familyMetadataList ?? []).map((f) => ({
      family: f.family,
      category: f.category ?? '',
      variants: Object.keys(f.fonts ?? {}),
      popularity: typeof f.popularity === 'number' ? f.popularity : Number.MAX_SAFE_INTEGER,
    }));
    catalogCache = { at: Date.now(), entries };
    return entries;
  })();
  try {
    return await catalogInflight;
  } finally {
    catalogInflight = null;
  }
}

function cssFamilyParam(family: string): string {
  return encodeURIComponent(family).replace(/%20/g, '+');
}

async function resolveFontFile(
  family: string,
  variant: string,
): Promise<{ url: string; ext: string } | null> {
  const italic = /i(talic)?$/.test(variant);
  const weight = variant.replace(/i(talic)?$/, '') || '400';
  const style = italic ? `${weight}italic` : weight;
  const cssUrl = `https://fonts.googleapis.com/css?family=${cssFamilyParam(family)}:${style}`;
  const css = await fetch(cssUrl, { headers: { 'user-agent': LEGACY_UA } });
  if (!css.ok) return null;
  const body = await css.text();
  const match = body.match(/url\((https:\/\/[^)]+)\)/);
  if (!match) return null;
  let parsed: URL;
  try {
    parsed = new URL(match[1]);
  } catch {
    return null;
  }
  if (!parsed.hostname.toLowerCase().endsWith('gstatic.com')) return null;
  const rawExt = parsed.pathname.split('.').pop()?.toLowerCase() ?? '';
  const ext = FONT_EXTS.has(rawExt) ? rawExt : 'ttf';
  return { url: parsed.toString(), ext };
}

export function registerGfontsRoutes(server: ViteDevServer): void {
  server.middlewares.use('/__gfonts', async (req, res, next) => {
    const reqUrl = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    if (method !== 'GET') return next();

    try {
      if (reqUrl.pathname === '/search') {
        const q = (reqUrl.searchParams.get('q') ?? '').trim().toLowerCase();
        const limit = Number(reqUrl.searchParams.get('limit')) || 30;
        let entries = await loadCatalog();
        if (q) entries = entries.filter((e) => e.family.toLowerCase().includes(q));
        const items = entries
          .slice()
          .sort((a, b) => a.popularity - b.popularity)
          .slice(0, limit)
          .map((e) => ({ family: e.family, category: e.category, variants: e.variants }));
        return json(res, 200, items);
      }

      if (reqUrl.pathname === '/download') {
        const family = reqUrl.searchParams.get('family');
        const variant = reqUrl.searchParams.get('variant') || '400';
        if (!family) return json(res, 400, { error: 'missing family' });
        const resolved = await resolveFontFile(family, variant);
        if (!resolved) return json(res, 404, { error: 'font not found' });
        const upstream = await fetch(resolved.url);
        if (!upstream.ok) return json(res, 502, { error: `gstatic ${upstream.status}` });
        res.statusCode = 200;
        res.setHeader('content-type', upstream.headers.get('content-type') ?? 'font/ttf');
        res.setHeader('x-font-ext', resolved.ext);
        res.setHeader('cache-control', 'no-store');
        res.end(Buffer.from(await upstream.arrayBuffer()));
        return;
      }

      return next();
    } catch (err) {
      json(res, 502, { error: String((err as Error).message ?? err) });
    }
  });
}
