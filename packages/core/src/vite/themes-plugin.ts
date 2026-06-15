import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { normalizePath, type Plugin } from 'vite';
import type { OpenSlideConfig } from '../config.ts';

export type ThemesPluginOptions = {
  userCwd: string;
  config: OpenSlideConfig;
};

const THEMES_VMOD = 'virtual:open-slide/themes';

function resolved(id: string): string {
  return `\0${id}`;
}

type Frontmatter = {
  name: string;
  description: string;
};

type ParsedTheme = {
  id: string;
  frontmatter: Frontmatter;
  body: string;
  demoAbs: string | null;
};

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(raw: string, themeId: string): { fm: Frontmatter; body: string } {
  const match = raw.match(FM_RE);
  const fmText = match ? match[1] : '';
  const body = match ? match[2] : raw;

  const data: Record<string, string> = {};
  for (const line of fmText.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }

  return {
    fm: {
      name: data.name || themeId,
      description: data.description || '',
    },
    body: body.trim(),
  };
}

async function findThemes(userCwd: string, themesDir: string): Promise<string[]> {
  const abs = path.resolve(userCwd, themesDir);
  if (!existsSync(abs)) return [];
  const hits = await fg('*.md', { cwd: abs, absolute: true, onlyFiles: true });
  return hits.sort();
}

async function readTheme(mdAbs: string, themesRoot: string): Promise<ParsedTheme> {
  const id = path.basename(mdAbs, '.md');
  const raw = await fs.readFile(mdAbs, 'utf8');
  const { fm, body } = parseFrontmatter(raw, id);
  const demoCandidates = [`${id}.demo.tsx`, `${id}.demo.jsx`, `${id}.demo.ts`, `${id}.demo.js`];
  let demoAbs: string | null = null;
  for (const cand of demoCandidates) {
    const p = path.join(themesRoot, cand);
    if (existsSync(p)) {
      demoAbs = p;
      break;
    }
  }
  return { id, frontmatter: fm, body, demoAbs };
}

function generateThemesModule(themes: ParsedTheme[], isDev: boolean): string {
  const meta = themes.map((t) => ({
    id: t.id,
    name: t.frontmatter.name,
    description: t.frontmatter.description,
    body: t.body,
    hasDemo: t.demoAbs !== null,
  }));

  const cases = themes
    .flatMap((t) => {
      const abs = t.demoAbs;
      if (!abs) return [];
      const importPath = isDev ? `@fs/${normalizePath(abs).replace(/^\/+/, '')}` : abs;
      const importExpr = isDev
        ? `import(/* @vite-ignore */ import.meta.env.BASE_URL + ${JSON.stringify(importPath)})`
        : `import(${JSON.stringify(importPath)})`;
      return [`    case ${JSON.stringify(t.id)}: return ${importExpr};`];
    })
    .join('\n');

  return `// virtual:open-slide/themes — generated
export const themes = ${JSON.stringify(meta)};

export async function loadThemeDemo(id) {
  switch (id) {
${cases}
    default: throw new Error('Theme demo not found: ' + id);
  }
}
`;
}

export function themesPlugin(opts: ThemesPluginOptions): Plugin {
  const { userCwd, config } = opts;
  const themesDir = config.themesDir ?? 'themes';
  const themesRoot = path.resolve(userCwd, themesDir);

  let isDev = false;

  return {
    name: 'open-slide:themes',
    config(_c, env) {
      isDev = env.command === 'serve';
    },
    resolveId(id) {
      if (id === THEMES_VMOD) return resolved(THEMES_VMOD);
      return null;
    },
    async load(id) {
      if (id !== resolved(THEMES_VMOD)) return null;
      const files = await findThemes(userCwd, themesDir);
      const themes = await Promise.all(files.map((f) => readTheme(f, themesRoot)));
      return generateThemesModule(themes, isDev);
    },
    configureServer(server) {
      const isThemeFile = (p: string) => {
        const rel = path.relative(themesRoot, p);
        if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
        if (rel.includes(path.sep)) return false;
        return /\.(md|demo\.(tsx|jsx|ts|js))$/.test(rel);
      };

      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const reload = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(THEMES_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }, 150);
      };

      if (existsSync(themesRoot)) server.watcher.add(themesRoot);
      server.watcher.on('add', (p) => {
        if (isThemeFile(p)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (isThemeFile(p)) reload();
      });
      server.watcher.on('change', (p) => {
        if (isThemeFile(p)) reload();
      });
    },
  };
}
