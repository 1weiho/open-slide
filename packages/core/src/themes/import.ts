import fs from 'node:fs/promises';
import path from 'node:path';
import { DEMO_EXTS, FM_RE, parseFrontmatter } from './scan.ts';

// Matches what the local scanner accepts (any safe .md basename) so every
// locally working theme stays shareable; dots and separators stay excluded
// because the id is joined into filesystem paths.
export const THEME_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const MAX_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;
export const THEME_MANIFEST_PATH = 'themes/index.json';

export class ThemeImportError extends Error {
  readonly code: 'invalid' | 'forbidden' | 'not-found' | 'network';
  constructor(code: ThemeImportError['code'], message: string) {
    super(message);
    this.name = 'ThemeImportError';
    this.code = code;
  }
}

export type RemoteThemeEntry = {
  id: string;
  name: string;
  description: string;
  mdUrl: string;
  demoCandidates: string[];
};

export type FetchedTheme = {
  id: string;
  name: string;
  description: string;
  md: string;
  demo: { filename: string; source: string } | null;
};

export type DiscoverResult = {
  origin: string;
  entries: RemoteThemeEntry[];
};

function assertHostAllowed(url: URL, allowedHosts?: string[]): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ThemeImportError('invalid', `Only http(s) URLs are supported: ${url.href}`);
  }
  if (!allowedHosts || allowedHosts.length === 0) return;
  const hostname = url.hostname.toLowerCase();
  const ok = allowedHosts.some((h) => {
    const n = h.trim().toLowerCase().replace(/^\*\./, '');
    return n.length > 0 && (hostname === n || hostname.endsWith(`.${n}`));
  });
  if (!ok) {
    throw new ThemeImportError('forbidden', `Host not in themeImport.allowedHosts: ${url.host}`);
  }
}

function parseUrl(raw: string): URL {
  try {
    return new URL(raw);
  } catch {
    throw new ThemeImportError('invalid', `Invalid URL: ${raw}`);
  }
}

async function readLimited(res: Response, label: string): Promise<string> {
  const tooLarge = () =>
    new ThemeImportError('invalid', `File too large (> ${MAX_BYTES} bytes): ${label}`);
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) throw tooLarge();
  if (!res.body) return '';

  // Stream with a running total instead of arrayBuffer() so an oversized (or
  // lying-about-content-length) response is cut off at the cap, not buffered whole.
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => {});
      throw tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function fetchResponse(url: string, allowedHosts?: string[]): Promise<Response> {
  assertHostAllowed(parseUrl(url), allowedHosts);
  let res: Response;
  try {
    res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err) {
    const reason =
      (err as Error).name === 'TimeoutError'
        ? `timed out after ${FETCH_TIMEOUT_MS / 1000}s`
        : (err as Error).message;
    throw new ThemeImportError('network', `Fetch failed: ${url} (${reason})`);
  }
  // Re-check after redirects — an allowed host may 302 to an off-list one.
  if (res.url) assertHostAllowed(parseUrl(res.url), allowedHosts);
  return res;
}

async function fetchText(url: string, allowedHosts?: string[]): Promise<string> {
  const res = await fetchResponse(url, allowedHosts);
  if (!res.ok) {
    throw new ThemeImportError(
      res.status === 404 ? 'not-found' : 'network',
      `Fetch failed (${res.status}): ${url}`,
    );
  }
  return readLimited(res, url);
}

// Returns null on any miss, including HTML responses — SPA-fallback hosts answer
// 200 + index.html for paths that don't exist, which must never count as a hit.
async function tryFetchText(url: string, allowedHosts?: string[]): Promise<string | null> {
  try {
    const res = await fetchResponse(url, allowedHosts);
    if (!res.ok) return null;
    const text = await readLimited(res, url);
    return looksLikeHtml(text) ? null : text;
  } catch (err) {
    if (err instanceof ThemeImportError && err.code === 'forbidden') throw err;
    return null;
  }
}

function looksLikeHtml(text: string): boolean {
  const head = text.trimStart().slice(0, 200).toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<?xml');
}

function demoCandidatesFor(id: string, baseUrl: URL): string[] {
  return DEMO_EXTS.map((ext) => new URL(`${id}.demo.${ext}`, baseUrl).href);
}

function entryFromMdUrl(url: URL): RemoteThemeEntry {
  const id = path.posix.basename(url.pathname).replace(/\.md$/i, '');
  if (!THEME_ID_RE.test(id)) {
    throw new ThemeImportError('invalid', `Theme id derived from URL is invalid: "${id}"`);
  }
  return {
    id,
    name: id,
    description: '',
    mdUrl: url.href,
    demoCandidates: demoCandidatesFor(id, url),
  };
}

type ManifestEntry = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  md?: unknown;
  demo?: unknown;
};

function normalizeManifestEntry(raw: ManifestEntry, manifestUrl: URL): RemoteThemeEntry | null {
  const id = typeof raw.id === 'string' ? raw.id : '';
  if (!THEME_ID_RE.test(id)) return null;
  const md = typeof raw.md === 'string' && raw.md ? raw.md : `${id}.md`;
  const mdUrl = new URL(md, manifestUrl).href;
  const demoCandidates =
    typeof raw.demo === 'string' && raw.demo
      ? [new URL(raw.demo, manifestUrl).href]
      : raw.demo === null
        ? []
        : demoCandidatesFor(id, manifestUrl);
  return {
    id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : id,
    description: typeof raw.description === 'string' ? raw.description : '',
    mdUrl,
    demoCandidates,
  };
}

function parseManifest(raw: string, manifestUrl: URL): RemoteThemeEntry[] {
  let parsed: { themes?: unknown };
  try {
    parsed = JSON.parse(raw) as { themes?: unknown };
  } catch {
    throw new ThemeImportError('invalid', `Manifest is not valid JSON: ${manifestUrl.href}`);
  }
  const list = Array.isArray(parsed.themes) ? (parsed.themes as ManifestEntry[]) : [];
  return list
    .map((t) => normalizeManifestEntry(t, manifestUrl))
    .filter((e): e is RemoteThemeEntry => e !== null);
}

async function tryManifest(
  manifestUrl: URL,
  allowedHosts?: string[],
): Promise<RemoteThemeEntry[] | null> {
  const raw = await tryFetchText(manifestUrl.href, allowedHosts);
  if (raw === null) return null;
  try {
    const entries = parseManifest(raw, manifestUrl);
    return entries.length > 0 ? entries : null;
  } catch {
    return null;
  }
}

const NOT_A_FILE_HINT =
  'Point at a built/preview site (open-slide preview) — the site root, a themes/index.json, or a <theme>.md. A dev-server URL or an in-app page route (e.g. /themes/<id>) does not serve theme files.';

export async function discoverThemes(
  rawUrl: string,
  allowedHosts?: string[],
): Promise<DiscoverResult> {
  const url = parseUrl(rawUrl);
  assertHostAllowed(url, allowedHosts);
  const pathname = url.pathname.toLowerCase();

  if (pathname.endsWith('.md')) {
    return { origin: url.origin, entries: [entryFromMdUrl(url)] };
  }

  if (pathname.endsWith('.json')) {
    const raw = await fetchText(url.href, allowedHosts);
    if (looksLikeHtml(raw)) {
      throw new ThemeImportError(
        'invalid',
        `Expected a JSON manifest but got HTML. ${NOT_A_FILE_HINT}`,
      );
    }
    return { origin: url.origin, entries: parseManifest(raw, url) };
  }

  const base = `${url.pathname.replace(/\/+$/, '')}`;
  const lastSegment = base.split('/').pop() ?? '';

  // A path like /themes/<id> is the gallery page URL — try the sibling <id>.md
  // first so it resolves to that one theme rather than the whole site manifest.
  if (THEME_ID_RE.test(lastSegment)) {
    const mdUrl = new URL(`${base}.md`, url);
    const md = await tryFetchText(mdUrl.href, allowedHosts);
    if (md !== null) {
      return { origin: url.origin, entries: [entryFromMdUrl(mdUrl)] };
    }
  }

  // Probe both interpretations of the path: a site root (manifest lives under
  // themes/) and the themes directory itself (e.g. a pasted /themes gallery URL,
  // with or without a trailing slash).
  const manifestCandidates = [
    new URL(`${base}/${THEME_MANIFEST_PATH}`, url),
    new URL(`${base}/index.json`, url),
  ];
  for (const candidate of manifestCandidates) {
    const entries = await tryManifest(candidate, allowedHosts);
    if (entries) return { origin: url.origin, entries };
  }

  throw new ThemeImportError('not-found', `No theme found at ${rawUrl}. ${NOT_A_FILE_HINT}`);
}

export async function fetchTheme(
  entry: RemoteThemeEntry,
  allowedHosts?: string[],
): Promise<FetchedTheme> {
  const md = await fetchText(entry.mdUrl, allowedHosts);
  if (looksLikeHtml(md)) {
    throw new ThemeImportError(
      'invalid',
      `Got HTML instead of a theme file from ${entry.mdUrl}. ${NOT_A_FILE_HINT}`,
    );
  }
  let demo: FetchedTheme['demo'] = null;
  for (const candidate of entry.demoCandidates) {
    const source = await tryFetchText(candidate, allowedHosts);
    if (source !== null) {
      const ext = (path.posix.extname(new URL(candidate).pathname).slice(1) || 'tsx').toLowerCase();
      const safeExt = (DEMO_EXTS as readonly string[]).includes(ext) ? ext : 'tsx';
      demo = { filename: `${entry.id}.demo.${safeExt}`, source };
      break;
    }
  }
  return { id: entry.id, name: entry.name, description: entry.description, md, demo };
}

export type WriteResult = {
  id: string;
  requestedId: string;
  renamed: boolean;
  written: string[];
};

function formatFrontmatterValue(value: string): string {
  return JSON.stringify(value);
}

// Rewrites (or inserts) the `name:` field in a theme's frontmatter without
// touching the body — used to disambiguate display names on import collisions.
function setThemeDisplayName(md: string, name: string): string {
  const value = formatFrontmatterValue(name);
  const match = md.match(FM_RE);
  if (!match) {
    return `---\nname: ${value}\n---\n\n${md.replace(/^\uFEFF?\s*/, '')}`;
  }
  let replaced = false;
  const lines = match[1].split(/\r?\n/).map((line) => {
    if (!replaced && /^name\s*:/.test(line)) {
      replaced = true;
      return `name: ${value}`;
    }
    return line;
  });
  if (!replaced) lines.unshift(`name: ${value}`);
  return `---\n${lines.join('\n')}\n---\n${match[2] ? `\n${match[2]}` : ''}`;
}

// On a name clash, copy in as <id>-1, <id>-2, … rather than overwriting —
// unless force replaces the existing theme in place. The exclusive-create
// flag makes the free-id probe and the write a single atomic step, so
// concurrent imports of the same id get distinct suffixes instead of
// silently clobbering each other.
async function writeThemeMd(
  themesRoot: string,
  fetched: FetchedTheme,
  force: boolean,
): Promise<string> {
  if (force) {
    await fs.writeFile(path.join(themesRoot, `${fetched.id}.md`), fetched.md);
    return fetched.id;
  }
  for (let i = 0; i < 1000; i++) {
    const targetId = i === 0 ? fetched.id : `${fetched.id}-${i}`;
    // On a collision rename (replit → replit-1), suffix the display name to match
    // so the gallery shows "Replit 1" instead of a second indistinguishable "Replit".
    const md =
      i === 0
        ? fetched.md
        : setThemeDisplayName(
            fetched.md,
            `${parseFrontmatter(fetched.md, fetched.id).fm.name} ${i}`,
          );
    try {
      await fs.writeFile(path.join(themesRoot, `${targetId}.md`), md, { flag: 'wx' });
      return targetId;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
    }
  }
  throw new ThemeImportError('invalid', `Too many themes named "${fetched.id}"`);
}

export async function writeTheme(
  themesRoot: string,
  fetched: FetchedTheme,
  opts: { force?: boolean } = {},
): Promise<WriteResult> {
  if (!THEME_ID_RE.test(fetched.id)) {
    throw new ThemeImportError('invalid', `Invalid theme id: "${fetched.id}"`);
  }

  await fs.mkdir(themesRoot, { recursive: true });
  const targetId = await writeThemeMd(themesRoot, fetched, opts.force === true);
  const written: string[] = [`${targetId}.md`];

  // Clear every demo variant first: a leftover demo with a higher-priority
  // extension (scan probes tsx before js) would shadow the one written below.
  await Promise.all(
    DEMO_EXTS.map((ext) =>
      fs.rm(path.join(themesRoot, `${targetId}.demo.${ext}`), { force: true }),
    ),
  );
  if (fetched.demo) {
    const ext = (fetched.demo.filename.split('.').pop() ?? 'tsx').toLowerCase();
    const demoName = `${targetId}.demo.${ext}`;
    await fs.writeFile(path.join(themesRoot, demoName), fetched.demo.source);
    written.push(demoName);
  }

  return { id: targetId, requestedId: fetched.id, renamed: targetId !== fetched.id, written };
}
