import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import { installFontFiles, listInstalledFamilies } from './system-fonts.ts';

/**
 * A deck is portable code, but what it renders with is not: the fonts it names
 * and the assets it imports live outside the file, so opening someone else's
 * deck silently substitutes both.
 */

/**
 * Never under CI: the machine is discarded after the run, so resolving what it
 * is missing only buys latency and one more way for the job to fail.
 */
export function shouldRunPreflight(
  opts: { preflight?: boolean },
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return opts.preflight !== false && !env.CI;
}

export type PreflightReport = {
  decks: string[];
  fontsNeeded: string[];
  fontsAlreadyPresent: string[];
  fontsInstalled: string[];
  fontsUnresolved: { family: string; reason: string }[];
  assetsDownloaded: string[];
  assetsMissing: { deck: string; asset: string }[];
};

const GENERIC_FAMILIES = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'inherit',
  'initial',
  'unset',
  'emoji',
  'math',
  'fangsong',
  '-apple-system',
  'blinkmacsystemfont',
]);

/**
 * The runtime's own typography. Decks inherit it without naming it anywhere, so
 * a scan of the workspace would never turn it up.
 */
const RUNTIME_FAMILIES = ['Geist', 'Geist Mono'];

/** Families whose npm package we know by name rather than by convention. */
const KNOWN_FONT_PACKAGES: Record<string, string> = {
  geist: 'geist',
  'geist variable': 'geist',
  'geist mono': 'geist',
  'geist mono variable': 'geist',
};

export async function runPreflight(
  userCwd: string,
  opts: { quiet?: boolean; install?: boolean } = {},
): Promise<PreflightReport> {
  const install = opts.install ?? true;
  const report: PreflightReport = {
    decks: [],
    fontsNeeded: [],
    fontsAlreadyPresent: [],
    fontsInstalled: [],
    fontsUnresolved: [],
    assetsDownloaded: [],
    assetsMissing: [],
  };

  const slidesRoot = join(userCwd, 'slides');
  if (!existsSync(slidesRoot)) return report;

  const families = new Set<string>(RUNTIME_FAMILIES);
  for (const deck of readdirSync(slidesRoot)) {
    const entry = join(slidesRoot, deck, 'index.tsx');
    if (!existsSync(entry)) continue;
    report.decks.push(deck);

    let source = '';
    try {
      source = readFileSync(entry, 'utf8');
    } catch {
      continue;
    }
    for (const family of extractFamilies(source)) families.add(family);
    await resolveDeckAssets(userCwd, deck, source, report, install);
  }

  // Themes carry the typography the decks inherit.
  const themesRoot = join(userCwd, 'themes');
  if (existsSync(themesRoot)) {
    for (const file of readdirSync(themesRoot)) {
      if (!/\.(md|tsx)$/i.test(file)) continue;
      try {
        for (const family of extractFamilies(readFileSync(join(themesRoot, file), 'utf8'))) {
          families.add(family);
        }
      } catch {
        // Unreadable theme is not fatal.
      }
    }
  }

  if (families.size === 0) return report;

  const installed = listInstalledFamilies();
  for (const family of families) {
    report.fontsNeeded.push(family);
    if (isPresent(family, installed)) {
      report.fontsAlreadyPresent.push(family);
      continue;
    }
    if (!install) {
      report.fontsUnresolved.push({ family, reason: 'install disabled' });
      continue;
    }
    // One family that cannot be resolved, for any reason including a filesystem
    // error nobody anticipated, is a line in the report and never the end of the
    // run: the standalone command has no try/catch above it.
    try {
      const outcome = await installFamily(userCwd, family);
      if (outcome.ok) report.fontsInstalled.push(family);
      else report.fontsUnresolved.push({ family, reason: outcome.reason });
    } catch (err) {
      report.fontsUnresolved.push({ family, reason: (err as Error).message });
    }
  }

  if (!opts.quiet) printReport(report);
  return report;
}

function isPresent(family: string, installed: Set<string>): boolean {
  const name = family.toLowerCase();
  if (installed.has(name)) return true;
  // "Geist Variable" is satisfied by the installed static "Geist".
  const base = name.replace(/\s+variable$/, '');
  if (installed.has(base)) return true;
  for (const candidate of installed) {
    if (candidate.startsWith(`${base} `)) return true;
  }
  return false;
}

async function installFamily(
  userCwd: string,
  family: string,
): Promise<{ ok: boolean; reason: string }> {
  const pkg = packageForFamily(family);
  // Reuse an outline the workspace already has, but never install the package to
  // get one: that would write a dependency and a lockfile entry into someone's
  // project as a side effect of starting a dev server. Font packages target
  // browsers and ship woff2 anyway, which no operating system can install, so
  // this path only pays off for the rare package carrying a .ttf.
  let files = findFontFiles(userCwd, pkg);

  if (files.length === 0) {
    files = await downloadFromGoogleFonts(userCwd, family);
  }

  if (files.length === 0) {
    return {
      ok: false,
      reason: `no .ttf/.otf in ${pkg} nor on Google Fonts; install the font manually, then run "open-slide preflight"`,
    };
  }
  const result = installFontFiles(files);
  if (result.installed === 0) return { ok: false, reason: 'copy into the fonts folder failed' };
  return { ok: true, reason: '' };
}

/**
 * Google Fonts serves a zip of static outlines per family. That is the only
 * broadly available source of installable TTFs — npm font packages target
 * browsers and ship woff2, which no operating system can install.
 */
async function downloadFromGoogleFonts(userCwd: string, family: string): Promise<string[]> {
  const slug = family.replace(/\s+Variable$/i, '');
  const cacheDir = join(
    userCwd,
    'node_modules',
    '.open-slide',
    'fonts',
    slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  );

  if (existsSync(cacheDir)) {
    const cached: string[] = [];
    collectFonts(cacheDir, cached, 0);
    if (cached.length > 0) return cached;
  }

  const dir = slug.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const entries = await listGoogleFontFiles(dir);
  if (entries.length === 0) return [];

  // Static faces name their weight in the file itself, which is what a system
  // install exposes; the variable build is a last resort.
  const statics = entries.filter((e) => !/\[.*\]/.test(e.name));
  const chosen = statics.length > 0 ? statics : entries;

  const out: string[] = [];
  mkdirSync(cacheDir, { recursive: true });
  for (const entry of chosen) {
    try {
      const res = await fetch(entry.url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) continue;
      const dest = join(cacheDir, entry.name);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      out.push(dest);
    } catch {
      // One failed face does not sink the family.
    }
  }
  return out;
}

type RemoteFont = { name: string; url: string };

/**
 * The google/fonts repository is the only stable public source of installable
 * outlines: the fonts.google.com download endpoint now answers with HTML, and
 * the CSS API serves woff2. Families live under a licence folder, and the
 * static weights sit in `static/` when a variable build exists.
 */
async function listGoogleFontFiles(dir: string): Promise<RemoteFont[]> {
  for (const licence of ['ofl', 'apache', 'ufl']) {
    const base = `https://api.github.com/repos/google/fonts/contents/${licence}/${dir}`;
    const listing = await fetchJson(base);
    if (!Array.isArray(listing)) continue;

    const statics = listing.find(
      (item: { name?: string; type?: string }) => item.name === 'static' && item.type === 'dir',
    );
    if (statics) {
      const inner = await fetchJson(`${base}/static`);
      if (Array.isArray(inner)) {
        const files = toFontEntries(inner);
        if (files.length > 0) return files;
      }
    }
    const files = toFontEntries(listing);
    if (files.length > 0) return files;
  }
  return [];
}

function toFontEntries(listing: unknown[]): RemoteFont[] {
  const out: RemoteFont[] = [];
  for (const item of listing as { name?: string; download_url?: string }[]) {
    if (!item.name || !item.download_url) continue;
    if (!/\.(ttf|otf)$/i.test(item.name)) continue;
    out.push({ name: item.name, url: item.download_url });
  }
  return out;
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'open-slide-preflight' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function packageForFamily(family: string): string {
  const known = KNOWN_FONT_PACKAGES[family.toLowerCase()];
  if (known) return known;
  // Convention used by the fontsource project, which mirrors Google Fonts.
  const slug = family
    .toLowerCase()
    .replace(/\s+variable$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `@fontsource/${slug}`;
}

/** Static outlines only: the browser can use woff2, the OS cannot. */
function findFontFiles(userCwd: string, pkg: string): string[] {
  const roots = [join(userCwd, 'node_modules', ...pkg.split('/'))];
  const store = join(userCwd, 'node_modules', '.pnpm');
  if (existsSync(store)) {
    const prefix = `${pkg.replace('/', '+')}@`;
    for (const entry of readdirSync(store)) {
      if (entry.startsWith(prefix))
        roots.push(join(store, entry, 'node_modules', ...pkg.split('/')));
    }
  }

  const out: string[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    collectFonts(root, out, 0);
  }
  return out;
}

function collectFonts(dir: string, out: string[], depth: number): void {
  if (depth > 6) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' && depth > 0) continue;
    const full = join(dir, entry);
    if (/\.(ttf|otf)$/i.test(entry)) {
      // Variable files register inconsistently across systems; the static faces
      // are what the export maps weights onto.
      if (entry.includes('[wght]') || /Variable/i.test(entry)) continue;
      out.push(full);
      continue;
    }
    if (!entry.includes('.')) collectFonts(full, out, depth + 1);
  }
}

/**
 * Assets a deck imports have to exist before it renders. A deck can ship an
 * `assets.manifest.json` mapping file names to URLs; anything listed there and
 * missing on disk is fetched now.
 */
async function resolveDeckAssets(
  userCwd: string,
  deck: string,
  source: string,
  report: PreflightReport,
  install: boolean,
): Promise<void> {
  const deckDir = join(userCwd, 'slides', deck);
  const referenced = new Set<string>();
  for (const match of source.matchAll(/from\s+['"](\.\/assets\/[^'"]+)['"]/g)) {
    referenced.add(match[1].replace('./', ''));
  }
  for (const match of source.matchAll(/['"]@assets\/([^'"]+)['"]/g)) {
    referenced.add(join('..', '..', 'assets', match[1]));
  }

  let manifest: Record<string, string> = {};
  const manifestPath = join(deckDir, 'assets.manifest.json');
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      for (const name of Object.keys(manifest)) referenced.add(join('assets', name));
    } catch {
      // Malformed manifest is reported through the missing-asset list below.
    }
  }

  for (const rel of referenced) {
    const full = join(deckDir, rel);
    if (existsSync(full)) continue;

    const url = manifest[rel.replace(/^assets[\\/]/, '')];
    if (url && install) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
        if (!res.ok) throw new Error(String(res.status));
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, Buffer.from(await res.arrayBuffer()));
        report.assetsDownloaded.push(`${deck}/${rel}`);
        continue;
      } catch {
        // Falls through to the missing list.
      }
    }
    report.assetsMissing.push({ deck, asset: rel });
  }
}

function extractFamilies(source: string): string[] {
  const out = new Set<string>();
  const values: string[] = [];

  const patterns = [
    /fontFamily\s*:\s*['"`]([^'"`]+)['"`]/g,
    /font-family\s*:\s*([^;\n}]+)/g,
    /--osd-font-[a-z]+\s*:\s*([^;\n}]+)/g,
  ];
  for (const re of patterns) {
    for (const match of source.matchAll(re)) values.push(match[1]);
  }

  // `fontFamily: FONT` with `const FONT = 'Inter, sans-serif'` at the top of the
  // file is idiomatic in decks, and a literal-only scan would miss it entirely.
  for (const match of source.matchAll(/fontFamily\s*:\s*([A-Z_][A-Za-z0-9_]*)/g)) {
    const decl = source.match(
      new RegExp(`\\b(?:const|let|var)\\s+${match[1]}\\s*=\\s*['"\`]([^'"\`]+)['"\`]`),
    );
    if (decl) values.push(decl[1]);
  }

  for (const value of values) {
    for (const part of value.split(',')) {
      const name = part.trim().replace(/^["']|["']$/g, '');
      if (!name || name.startsWith('var(')) continue;
      if (GENERIC_FAMILIES.has(name.toLowerCase())) continue;
      if (name.length > 48) continue;
      out.add(name);
    }
  }
  return [...out];
}

function printReport(r: PreflightReport): void {
  if (r.fontsNeeded.length === 0 && r.assetsMissing.length === 0) return;
  const line = (msg: string) => process.stdout.write(`${msg}\n`);

  if (r.fontsInstalled.length > 0) {
    line(`${chalk.green('preflight:')} installed font(s): ${r.fontsInstalled.join(', ')}`);
  }
  if (r.assetsDownloaded.length > 0) {
    line(`${chalk.green('preflight:')} downloaded asset(s): ${r.assetsDownloaded.join(', ')}`);
  }
  for (const item of r.fontsUnresolved) {
    line(`${chalk.yellow('preflight:')} font "${item.family}" unavailable (${item.reason})`);
  }
  for (const item of r.assetsMissing) {
    line(`${chalk.yellow('preflight:')} missing asset in ${item.deck}: ${item.asset}`);
  }
}
