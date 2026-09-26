import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizePath, type Plugin } from 'vite';
import type { OpenSlideConfig } from '../config.ts';
import { manifestEntry, type ScannedTheme, scanThemes } from '../themes/scan.ts';

export type ThemesPluginOptions = {
  userCwd: string;
  config: OpenSlideConfig;
};

const THEMES_VMOD = 'virtual:open-slide/themes';

function resolved(id: string): string {
  return `\0${id}`;
}

function generateThemesModule(themes: ScannedTheme[], isDev: boolean): string {
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
  // During a build, load() and generateBundle() see the same on-disk state, so
  // the scan is shared. Never cached in dev — the watcher invalidates the
  // module expecting a fresh scan on the next load().
  let buildScan: ScannedTheme[] | null = null;

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
      const themes = await scanThemes(themesRoot);
      if (!isDev) buildScan = themes;
      return generateThemesModule(themes, isDev);
    },
    async generateBundle() {
      const themes = buildScan ?? (await scanThemes(themesRoot));

      for (const theme of themes) {
        const mdAbs = path.join(themesRoot, `${theme.id}.md`);
        const md = await fs.readFile(mdAbs, 'utf8');
        this.emitFile({ type: 'asset', fileName: `themes/${theme.id}.md`, source: md });

        if (theme.demoAbs) {
          const demoName = path.basename(theme.demoAbs);
          const demoSource = await fs.readFile(theme.demoAbs, 'utf8');
          this.emitFile({ type: 'asset', fileName: `themes/${demoName}`, source: demoSource });
        }
      }

      const manifest = themes.map(manifestEntry);
      this.emitFile({
        type: 'asset',
        fileName: 'themes/index.json',
        source: `${JSON.stringify({ themes: manifest }, null, 2)}\n`,
      });
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
