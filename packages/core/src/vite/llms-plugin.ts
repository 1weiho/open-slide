import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Logger, Plugin, ViteDevServer } from 'vite';
import { SLIDE_ID_RE } from '../editing/slide-ops.ts';
import { findSlides, readFoldersManifest, readSlideMeta, toId } from './open-slide-plugin.ts';

export const LLMS_TXT_SENTINEL = 'Generated file — edits are overwritten.';

const OUT_FILE = 'llms.txt';
const FIELD_MAX = 300;
const REWRITE_DEBOUNCE_MS = 200;
const SENTINEL_SCAN_BYTES = 1024;

export type LlmsDeck = {
  id: string;
  sourcePath: string;
  title: string | null;
  summary: string | null;
  theme: string | null;
  createdAt: string | null;
  folderId: string | null;
};

export type LlmsFolder = { id: string; name: string };

export type LlmsLinkBase = 'source' | 'site';

export type RenderLlmsTxtOptions = {
  projectName: string;
  linkBase: LlmsLinkBase;
  folders?: LlmsFolder[];
};

// `title`/`summary`/`theme` are author-controlled strings and the only reader of
// llms.txt is an LLM agent, so they are escaped as data: flattened to a single
// line (no injected `##` heading) with the markdown link delimiters neutralised.
// Truncation happens before escaping so a cut can never land inside an escape
// pair and leave a trailing backslash that swallows the closing bracket.
function sanitizeField(raw: string | null): string | null {
  if (raw === null) return null;
  const flattened = raw
    // biome-ignore lint/suspicious/noControlCharactersInRegex: flattening control characters is the point
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (flattened === '') return null;
  const clipped = flattened.length > FIELD_MAX ? flattened.slice(0, FIELD_MAX) : flattened;
  return clipped.replace(/\\/g, '\\\\').replace(/([[\]])/g, '\\$1');
}

// An unparseable timestamp is unsortable and unsafe to echo verbatim, so it is
// treated the same as a missing one.
function formatCreatedAt(raw: string | null): string | null {
  if (raw === null) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

function compareDecks(a: LlmsDeck, b: LlmsDeck): number {
  const aMs = a.createdAt === null ? Number.NaN : Date.parse(a.createdAt);
  const bMs = b.createdAt === null ? Number.NaN : Date.parse(b.createdAt);
  const aDated = Number.isFinite(aMs);
  const bDated = Number.isFinite(bMs);
  if (aDated && bDated && aMs !== bMs) return bMs - aMs;
  if (aDated !== bDated) return aDated ? -1 : 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function deckLink(deck: LlmsDeck, linkBase: LlmsLinkBase): string {
  return linkBase === 'site' ? `/s/${deck.id}` : deck.sourcePath;
}

function renderDeckLine(deck: LlmsDeck, linkBase: LlmsLinkBase): string {
  const title = sanitizeField(deck.title) ?? deck.id;
  const facets = [sanitizeField(deck.theme), formatCreatedAt(deck.createdAt)].filter(
    (value): value is string => value !== null,
  );
  const summary = sanitizeField(deck.summary);
  let line = `- [${title}](${deckLink(deck, linkBase)})`;
  if (facets.length > 0) line += `: ${facets.join(' · ')}`;
  if (summary !== null) line += ` — ${summary}`;
  return line;
}

export function renderLlmsTxt(decks: LlmsDeck[], opts: RenderLlmsTxtOptions): string {
  const sorted = [...decks].sort(compareDecks);
  const projectName = sanitizeField(opts.projectName) ?? 'open-slide';
  const noun = sorted.length === 1 ? 'deck' : 'decks';
  const lines = [
    `# ${projectName} — decks`,
    '',
    `> ${sorted.length} ${noun} built with open-slide. ${LLMS_TXT_SENTINEL}`,
  ];

  const folders = opts.folders ?? [];
  const knownFolderIds = new Set(folders.map((folder) => folder.id));
  const grouped = new Map<string, LlmsDeck[]>();
  const unassigned: LlmsDeck[] = [];
  for (const deck of sorted) {
    if (deck.folderId !== null && knownFolderIds.has(deck.folderId)) {
      const bucket = grouped.get(deck.folderId);
      if (bucket) bucket.push(deck);
      else grouped.set(deck.folderId, [deck]);
    } else {
      unassigned.push(deck);
    }
  }

  const pushSection = (heading: string, items: LlmsDeck[]) => {
    if (items.length === 0) return;
    lines.push('', `## ${heading}`, '');
    for (const deck of items) lines.push(renderDeckLine(deck, opts.linkBase));
  };

  for (const folder of folders) {
    pushSection(sanitizeField(folder.name) ?? folder.id, grouped.get(folder.id) ?? []);
  }
  pushSection('Decks', unassigned);

  return `${lines.join('\n')}\n`;
}

export type CollectDecksOptions = {
  userCwd: string;
  slidesDir: string;
};

function isFolder(raw: unknown): raw is { id: string; name: string } {
  if (raw === null || typeof raw !== 'object') return false;
  const folder = raw as { id?: unknown; name?: unknown };
  return typeof folder.id === 'string' && typeof folder.name === 'string';
}

export async function collectDecks(
  opts: CollectDecksOptions,
): Promise<{ decks: LlmsDeck[]; folders: LlmsFolder[] }> {
  const userCwd = path.resolve(opts.userCwd);
  const slidesRoot = path.resolve(userCwd, opts.slidesDir);
  const files = await findSlides(userCwd, opts.slidesDir);
  const manifest = await readFoldersManifest(path.join(slidesRoot, '.folders.json'));
  const folders = manifest.folders
    .filter(isFolder)
    .map((folder) => ({ id: folder.id, name: folder.name }));
  const { assignments } = manifest;

  const scanned = await Promise.all(
    files.map(async (abs) => {
      const id = toId(abs, slidesRoot);
      if (!SLIDE_ID_RE.test(id)) return null;
      const meta = await readSlideMeta(abs);
      // A slide id may legitimately be `__proto__`, which would otherwise read
      // straight off Object.prototype instead of the manifest.
      const assigned = Object.hasOwn(assignments, id) ? assignments[id] : null;
      return {
        id,
        sourcePath: path.relative(userCwd, abs).split(path.sep).join('/'),
        title: meta.title,
        summary: meta.summary,
        theme: meta.theme,
        createdAt: meta.createdAt,
        folderId: typeof assigned === 'string' ? assigned : null,
      } satisfies LlmsDeck;
    }),
  );

  return { decks: scanned.filter((deck): deck is LlmsDeck => deck !== null), folders };
}

export type WriteLlmsTxtResult =
  | { written: true; file: string }
  | {
      written: false;
      reason: 'outside-root' | 'irregular-file' | 'foreign-file' | 'error';
      message: string;
    };

async function readHead(file: string): Promise<string> {
  const handle = await fs.open(file, 'r');
  try {
    const buf = Buffer.alloc(SENTINEL_SCAN_BYTES);
    const { bytesRead } = await handle.read(buf, 0, SENTINEL_SCAN_BYTES, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

export async function writeLlmsTxt(rootDir: string, contents: string): Promise<WriteLlmsTxtResult> {
  const root = path.resolve(rootDir);
  const file = path.resolve(root, OUT_FILE);
  if (path.relative(root, file) !== OUT_FILE) {
    return { written: false, reason: 'outside-root', message: `${file} escapes ${root}` };
  }

  try {
    // lstat, not stat: a symlink here must be refused rather than followed.
    const stats = await fs.lstat(file);
    if (!stats.isFile()) {
      return { written: false, reason: 'irregular-file', message: `${file} is not a regular file` };
    }
    if (!(await readHead(file)).includes(LLMS_TXT_SENTINEL)) {
      return { written: false, reason: 'foreign-file', message: `${file} is not generated` };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      return { written: false, reason: 'error', message: String((err as Error).message ?? err) };
    }
  }

  const tmp = `${file}.${process.pid}.${Date.now().toString(36)}.tmp`;
  try {
    // `wx` fails outright on an existing path, symlinks included, so the
    // temporary file can never be redirected somewhere else.
    await fs.writeFile(tmp, contents, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tmp, file);
    return { written: true, file };
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => undefined);
    return { written: false, reason: 'error', message: String((err as Error).message ?? err) };
  }
}

export type LlmsPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

async function readProjectName(userCwd: string): Promise<string> {
  const fallback = path.basename(userCwd);
  try {
    const raw = await fs.readFile(path.join(userCwd, 'package.json'), 'utf8');
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed.name === 'string' && parsed.name.trim() !== '' ? parsed.name : fallback;
  } catch {
    return fallback;
  }
}

export function llmsPlugin(opts: LlmsPluginOptions): Plugin {
  const userCwd = path.resolve(opts.userCwd);
  const slidesDir = opts.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const foldersManifestPath = path.join(slidesRoot, '.folders.json');

  let isDev = false;
  let buildOutDir = '';
  let logger: Logger | null = null;

  const isSlideEntry = (p: string): boolean => {
    const rel = path.relative(slidesRoot, p);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
    const parts = rel.split(path.sep);
    return parts.length === 2 && /^index\.(tsx|jsx|ts|js)$/.test(parts[1]);
  };

  const generate = async (targetDir: string, linkBase: LlmsLinkBase) => {
    const { decks, folders } = await collectDecks({ userCwd, slidesDir });
    const contents = renderLlmsTxt(decks, {
      projectName: await readProjectName(userCwd),
      linkBase,
      folders,
    });
    const result = await writeLlmsTxt(targetDir, contents);
    if (!result.written) {
      logger?.warn(`[open-slide] skipped writing ${OUT_FILE}: ${result.message}`);
    }
  };

  return {
    name: 'open-slide:llms',
    configResolved(config) {
      isDev = config.command === 'serve';
      buildOutDir = path.resolve(config.root, config.build.outDir);
      logger = config.logger;
    },
    configureServer(server: ViteDevServer) {
      void generate(userCwd, 'source');

      let timer: ReturnType<typeof setTimeout> | null = null;
      const schedule = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          void generate(userCwd, 'source');
        }, REWRITE_DEBOUNCE_MS);
      };

      if (existsSync(slidesRoot)) server.watcher.add(slidesRoot);
      server.watcher.add(foldersManifestPath);
      const onWatchEvent = (p: string) => {
        if (isSlideEntry(p) || p === foldersManifestPath) schedule();
      };
      server.watcher.on('add', onWatchEvent);
      server.watcher.on('change', onWatchEvent);
      server.watcher.on('unlink', onWatchEvent);
    },
    async closeBundle() {
      // Vite fires closeBundle when the dev server shuts down too, and the dev
      // copy is already kept current by the watcher.
      if (isDev) return;
      await generate(buildOutDir, 'site');
    },
  };
}
