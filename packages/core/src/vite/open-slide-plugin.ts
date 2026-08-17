import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { loadConfigFromFile, normalizePath, type Plugin, type ViteDevServer } from 'vite';
import type { OpenSlideConfig } from '../config.ts';
import { SLIDE_ID_RE } from '../editing/slide-ops.ts';
import { hasRecentWrite } from './recent-writes.ts';

export type { OpenSlideConfig };

export type OpenSlidePluginOptions = {
  userCwd: string;
  config: OpenSlideConfig;
  coreVersion: string;
};

const CONFIG_FILE = 'open-slide.config.ts';

const SLIDES_VMOD = 'virtual:open-slide/slides';
const CONFIG_VMOD = 'virtual:open-slide/config';
const FOLDERS_VMOD = 'virtual:open-slide/folders';

export type FoldersManifest = {
  folders: unknown[];
  assignments: Record<string, string>;
};

export async function readFoldersManifest(file: string): Promise<FoldersManifest> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoldersManifest>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? (parsed.assignments as Record<string, string>)
          : {},
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { folders: [], assignments: {} };
    }
    throw err;
  }
}

function resolved(id: string): string {
  return `\0${id}`;
}

export async function findSlides(userCwd: string, slidesDir: string): Promise<string[]> {
  const abs = path.resolve(userCwd, slidesDir);
  if (!existsSync(abs)) return [];
  const hits = await fg('*/index.{tsx,jsx,ts,js}', {
    cwd: abs,
    absolute: true,
    onlyFiles: true,
  });
  return hits.sort();
}

export function toId(absFile: string, slidesRoot: string): string {
  const rel = path.relative(slidesRoot, absFile);
  return rel.split(path.sep)[0];
}

// Matches a whole single- or double-quoted literal rather than stopping at the
// first inner quote, so prose values keep their apostrophes ("Rendering & 'use
// cache'"). Template literals and expressions stay unsupported by design.
const STRING_LITERAL_SRC = String.raw`(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")`;

function metaFieldRe(key: string): RegExp {
  return new RegExp(String.raw`(?:^|[\s,{])${key}\s*:\s*${STRING_LITERAL_SRC}`);
}

const META_TITLE_RE = metaFieldRe('title');
const META_THEME_RE = metaFieldRe('theme');
const META_SUMMARY_RE = metaFieldRe('summary');
const META_CREATED_AT_RE = metaFieldRe('createdAt');

const SHORT_ESCAPES: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
  b: '\b',
  f: '\f',
  v: '\v',
  '0': '\0',
};

const ESCAPE_RE = /\\(u\{[0-9a-fA-F]{1,6}\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g;

// Resolve escapes the way the JS parser would, so `\n` becomes a newline rather
// than a literal "n". Anything unrecognised keeps its escaped character, which
// covers `\'`, `\"` and `\\`.
function unescapeStringLiteral(raw: string): string {
  return raw.replace(ESCAPE_RE, (_: string, seq: string) => {
    if (seq[0] === 'u' || seq[0] === 'x') {
      const hex = seq[1] === '{' ? seq.slice(2, -1) : seq.slice(1);
      const code = Number.parseInt(hex, 16);
      // Out of range would throw in String.fromCodePoint; keep the escape as
      // written rather than failing a whole build over one odd title.
      if (code > 0x10ffff) return `\\${seq}`;
      return String.fromCodePoint(code);
    }
    return SHORT_ESCAPES[seq] ?? seq;
  });
}

// Index of the literal's closing quote, or -1 if it never closes. Only `` ` ``
// may span lines; an unterminated quote means the source is unparseable anyway.
function skipStringLiteral(src: string, start: number): number {
  const quote = src[start];
  for (let i = start + 1; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === quote) return i;
    if (ch === '\n' && quote !== '`') return -1;
  }
  return -1;
}

function matchMetaField(body: string, re: RegExp): string | null {
  const match = body.match(re);
  if (!match) return null;
  const raw = match[1] ?? match[2];
  return raw === undefined ? null : unescapeStringLiteral(raw);
}

export type ExtractedMeta = {
  title: string | null;
  theme: string | null;
  summary: string | null;
  createdAt: string | null;
};

const EMPTY_META: ExtractedMeta = { title: null, theme: null, summary: null, createdAt: null };

export function extractMeta(src: string): ExtractedMeta {
  const empty = EMPTY_META;
  const metaStart = src.search(/export\s+const\s+meta\b/);
  if (metaStart === -1) return empty;
  const eqIdx = src.indexOf('=', metaStart);
  if (eqIdx === -1) return empty;
  const openBrace = src.indexOf('{', eqIdx);
  if (openBrace === -1) return empty;
  let depth = 0;
  let closeBrace = -1;
  for (let i = openBrace; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      // Skip the whole literal: a brace inside a value ("the {curly} case")
      // must not be mistaken for the end of the meta object.
      const end = skipStringLiteral(src, i);
      if (end === -1) return empty;
      i = end;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }
  if (closeBrace === -1) return empty;
  const body = src.slice(openBrace + 1, closeBrace);
  return {
    title: matchMetaField(body, META_TITLE_RE),
    theme: matchMetaField(body, META_THEME_RE),
    summary: matchMetaField(body, META_SUMMARY_RE),
    createdAt: matchMetaField(body, META_CREATED_AT_RE),
  };
}

export async function readSlideMeta(abs: string): Promise<ExtractedMeta> {
  try {
    const src = await fs.readFile(abs, 'utf8');
    return extractMeta(src);
  } catch {
    return EMPTY_META;
  }
}

function parseCreatedAtMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

// Deduped across repeated virtual-module regenerations so dev HMR doesn't
// re-log the same ignored folder on every slide change.
const warnedInvalidSlideIds = new Set<string>();

export async function generateSlidesModule(
  files: string[],
  slidesRoot: string,
  isDev: boolean,
): Promise<{ code: string; ignored: string[] }> {
  const scanned = await Promise.all(
    files.map(async (abs) => {
      const id = toId(abs, slidesRoot);
      const importPath = isDev ? `@fs/${normalizePath(abs).replace(/^\/+/, '')}` : abs;
      const meta = await readSlideMeta(abs);
      return { id, importPath, theme: meta.theme, createdAt: parseCreatedAtMs(meta.createdAt) };
    }),
  );

  // Discovery globs every `slides/*/index.*`, but a slide id is used in URLs,
  // filesystem paths, and the editing routes — all guarded by SLIDE_ID_RE. Drop
  // folders with an unusable id instead of listing them as slides that then fail
  // every folder/edit action; `load` warns about each ignored folder.
  const entries = scanned.filter((e) => SLIDE_ID_RE.test(e.id));
  const ignored = scanned.filter((e) => !SLIDE_ID_RE.test(e.id)).map((e) => e.id);

  const ids = JSON.stringify(entries.map((e) => e.id).sort());
  const themesMap: Record<string, string> = {};
  const createdAtMap: Record<string, number> = {};
  for (const e of entries) {
    if (e.theme) themesMap[e.id] = e.theme;
    if (e.createdAt !== null) createdAtMap[e.id] = e.createdAt;
  }
  const themesJson = JSON.stringify(themesMap);
  const createdAtJson = JSON.stringify(createdAtMap);
  const importTokens = JSON.stringify(Object.fromEntries(entries.map((e) => [e.id, 0])));
  const devRuntime = isDev
    ? `
const slideImportTokens = ${importTokens};
if (import.meta.hot) {
  import.meta.hot.on('open-slide:slide-changed', (data) => {
    const ids = Array.isArray(data?.slideIds) ? data.slideIds : data?.slideId ? [data.slideId] : [];
    const token = Date.now();
    for (const id of ids) {
      if (Object.prototype.hasOwnProperty.call(slideImportTokens, id)) slideImportTokens[id] = token;
    }
  });
}
`
    : '';
  const cases = entries
    .map((e) => {
      const importExpr = isDev
        ? `import(/* @vite-ignore */ import.meta.env.BASE_URL + ${JSON.stringify(`${e.importPath}?t=`)} + slideImportTokens[${JSON.stringify(e.id)}])`
        : `import(${JSON.stringify(e.importPath)})`;
      return `    case ${JSON.stringify(e.id)}: return ${importExpr};`;
    })
    .join('\n');

  const code = `// virtual:open-slide/slides — generated
export const slideIds = ${ids};
export const slideThemes = ${themesJson};
export const slideCreatedAt = ${createdAtJson};
${devRuntime}

export async function loadSlide(id) {
  switch (id) {
${cases}
    default: throw new Error('Slide not found: ' + id);
  }
}
`;
  return { code, ignored };
}

export function openSlidePlugin(opts: OpenSlidePluginOptions): Plugin {
  const { userCwd, config, coreVersion } = opts;
  const slidesDir = config.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const foldersManifestPath = path.join(slidesRoot, '.folders.json');

  let isDev = false;
  const slideIdForEntry = (p: string): string | null => {
    const rel = path.relative(slidesRoot, p);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    const parts = rel.split(path.sep);
    if (parts.length !== 2) return null;
    if (!/^index\.(tsx|jsx|ts|js)$/.test(parts[1])) return null;
    return parts[0];
  };
  let slideChangeTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingSlideChanges = new Set<string>();
  const queueSlideChanged = (server: ViteDevServer, id: string) => {
    pendingSlideChanges.add(id);
    if (slideChangeTimer) clearTimeout(slideChangeTimer);
    slideChangeTimer = setTimeout(() => {
      slideChangeTimer = null;
      const mod = server.moduleGraph.getModuleById(resolved(SLIDES_VMOD));
      if (mod) server.moduleGraph.invalidateModule(mod);
      const slideIds = Array.from(pendingSlideChanges);
      pendingSlideChanges.clear();
      server.ws.send({
        type: 'custom',
        event: 'open-slide:slide-changed',
        data: { slideIds },
      });
    }, 100);
  };

  return {
    name: 'open-slide',
    config(_c, env) {
      isDev = env.command === 'serve';
      return {
        server: { fs: { allow: [userCwd] } },
      };
    },
    resolveId(id) {
      if (id === SLIDES_VMOD) return resolved(SLIDES_VMOD);
      if (id === CONFIG_VMOD) return resolved(CONFIG_VMOD);
      if (id === FOLDERS_VMOD) return resolved(FOLDERS_VMOD);
      return null;
    },
    async load(id) {
      if (id === resolved(SLIDES_VMOD)) {
        const files = await findSlides(userCwd, slidesDir);
        const { code, ignored } = await generateSlidesModule(files, slidesRoot, isDev);
        for (const slideId of ignored) {
          if (warnedInvalidSlideIds.has(slideId)) continue;
          warnedInvalidSlideIds.add(slideId);
          this.warn(
            `Ignoring slide folder "${slideId}": slide ids must match ${SLIDE_ID_RE} (lowercase/uppercase letters, digits, "-", "_"). Rename the folder under "${slidesDir}/" to a kebab-case id so it appears in the browser and can be moved into folders.`,
          );
        }
        return code;
      }
      if (id === resolved(CONFIG_VMOD)) {
        const userBuild = config.build ?? {};
        const buildResolved = isDev
          ? { showSlideBrowser: true, showSlideUi: true, allowHtmlDownload: true }
          : {
              showSlideBrowser: userBuild.showSlideBrowser ?? true,
              showSlideUi: userBuild.showSlideUi ?? true,
              allowHtmlDownload: userBuild.allowHtmlDownload ?? true,
            };
        const resolvedConfig = { ...config, build: buildResolved, version: coreVersion };
        return `export default ${JSON.stringify(resolvedConfig)};\n`;
      }
      if (id === resolved(FOLDERS_VMOD)) {
        const manifest = await readFoldersManifest(foldersManifestPath);
        return `export default ${JSON.stringify(manifest)};\n`;
      }
      return null;
    },
    handleHotUpdate(ctx) {
      const slideId = slideIdForEntry(ctx.file);
      if (!slideId) return;
      // A speaker-note save writes the slide file itself. The notes plugin
      // records that write so we can recognise it here and skip the
      // `slide-changed` broadcast, which would otherwise bump the dev
      // cache-bust token and remount the slide canvas. Genuine source edits
      // are never recorded, so they keep full HMR behaviour.
      if (hasRecentWrite(ctx.file)) return [];
      queueSlideChanged(ctx.server, slideId);
      return [];
    },
    configureServer(server) {
      const isSlideEntry = (p: string) => slideIdForEntry(p) !== null;

      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const reload = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(SLIDES_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }, 150);
      };
      // Vite's `root` is the core app dir, so chokidar doesn't watch the
      // user's slides folder by default. Add it explicitly — and pass the
      // directory itself, since Vite sets `disableGlobbing: true` and would
      // otherwise treat a glob pattern as a literal path.
      if (existsSync(slidesRoot)) server.watcher.add(slidesRoot);
      server.watcher.on('add', (p) => {
        if (isSlideEntry(p)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (isSlideEntry(p)) reload();
      });

      let foldersTimer: ReturnType<typeof setTimeout> | null = null;
      const invalidateFolders = () => {
        if (foldersTimer) clearTimeout(foldersTimer);
        foldersTimer = setTimeout(() => {
          foldersTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(FOLDERS_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
        }, 100);
      };
      server.watcher.add(foldersManifestPath);
      server.watcher.on('change', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('add', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('unlink', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
    },
  };
}

export async function loadUserConfig(userCwd: string): Promise<OpenSlideConfig> {
  const file = path.join(userCwd, CONFIG_FILE);
  if (!existsSync(file)) return {};
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    file,
    userCwd,
    'silent',
  );
  return (loaded?.config ?? {}) as OpenSlideConfig;
}
