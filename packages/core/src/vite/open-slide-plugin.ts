import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import type { Plugin } from 'vite';

export type OpenSlideConfig = {
  title?: string;
  slidesDir?: string;
  port?: number;
};

export type OpenSlidePluginOptions = {
  userCwd: string;
  config: OpenSlideConfig;
};

const DECKS_VMOD = 'virtual:open-slide/decks';
const CONFIG_VMOD = 'virtual:open-slide/config';

function resolved(id: string): string {
  return `\0${id}`;
}

async function findDecks(userCwd: string, slidesDir: string): Promise<string[]> {
  const abs = path.resolve(userCwd, slidesDir);
  if (!existsSync(abs)) return [];
  const hits = await fg('*/index.{tsx,jsx,ts,js}', {
    cwd: abs,
    absolute: true,
    onlyFiles: true,
  });
  return hits.sort();
}

function toId(absFile: string, slidesRoot: string): string {
  const rel = path.relative(slidesRoot, absFile);
  return rel.split(path.sep)[0];
}

function generateDecksModule(
  files: string[],
  slidesRoot: string,
  isDev: boolean,
): string {
  const entries = files.map((abs) => {
    const id = toId(abs, slidesRoot);
    const importPath = isDev ? `/@fs${abs}` : abs;
    return { id, importPath };
  });

  const ids = JSON.stringify(entries.map((e) => e.id).sort());
  const cases = entries
    .map(
      (e) =>
        `    case ${JSON.stringify(e.id)}: return import(${JSON.stringify(e.importPath)});`,
    )
    .join('\n');

  return `// virtual:open-slide/decks — generated
export const deckIds = ${ids};

export async function loadDeck(id) {
  switch (id) {
${cases}
    default: throw new Error('Deck not found: ' + id);
  }
}
`;
}

export function openSlidePlugin(opts: OpenSlidePluginOptions): Plugin {
  const { userCwd, config } = opts;
  const slidesDir = config.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);

  let isDev = false;

  return {
    name: 'open-slide',
    config(_c, env) {
      isDev = env.command === 'serve';
      return {
        server: { fs: { allow: [userCwd] } },
      };
    },
    resolveId(id) {
      if (id === DECKS_VMOD) return resolved(DECKS_VMOD);
      if (id === CONFIG_VMOD) return resolved(CONFIG_VMOD);
      return null;
    },
    async load(id) {
      if (id === resolved(DECKS_VMOD)) {
        const files = await findDecks(userCwd, slidesDir);
        return generateDecksModule(files, slidesRoot, isDev);
      }
      if (id === resolved(CONFIG_VMOD)) {
        return `export default ${JSON.stringify(config)};\n`;
      }
      return null;
    },
    configureServer(server) {
      const reload = () => {
        const mod = server.moduleGraph.getModuleById(resolved(DECKS_VMOD));
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.add(path.join(slidesRoot, '*'));
      server.watcher.on('add', (p) => {
        if (p.startsWith(slidesRoot)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (p.startsWith(slidesRoot)) reload();
      });

      server.middlewares.use('/__open-slide/title', (_req, res) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ title: config.title ?? null }));
      });
    },
  };
}

export async function loadUserConfig(userCwd: string): Promise<OpenSlideConfig> {
  const file = path.join(userCwd, 'open-slide.json');
  if (!existsSync(file)) return {};
  const raw = await readFile(file, 'utf8');
  return JSON.parse(raw) as OpenSlideConfig;
}
