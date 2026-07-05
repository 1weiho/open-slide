import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

export type ThemeFrontmatter = {
  name: string;
  description: string;
};

export type ScannedTheme = {
  id: string;
  frontmatter: ThemeFrontmatter;
  body: string;
  demoAbs: string | null;
};

export type ThemeManifestEntry = {
  id: string;
  name: string;
  description: string;
  md: string;
  demo: string | null;
};

export const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
export const DEMO_EXTS = ['tsx', 'jsx', 'ts', 'js'] as const;

export function parseFrontmatter(
  raw: string,
  themeId: string,
): { fm: ThemeFrontmatter; body: string } {
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

export async function findThemeFiles(themesRoot: string): Promise<string[]> {
  if (!existsSync(themesRoot)) return [];
  const hits = await fg('*.md', { cwd: themesRoot, absolute: true, onlyFiles: true });
  return hits.sort();
}

export async function readScannedTheme(mdAbs: string, themesRoot: string): Promise<ScannedTheme> {
  const id = path.basename(mdAbs, '.md');
  const raw = await fs.readFile(mdAbs, 'utf8');
  const { fm, body } = parseFrontmatter(raw, id);
  let demoAbs: string | null = null;
  for (const ext of DEMO_EXTS) {
    const p = path.join(themesRoot, `${id}.demo.${ext}`);
    if (existsSync(p)) {
      demoAbs = p;
      break;
    }
  }
  return { id, frontmatter: fm, body, demoAbs };
}

export async function scanThemes(themesRoot: string): Promise<ScannedTheme[]> {
  const files = await findThemeFiles(themesRoot);
  return Promise.all(files.map((f) => readScannedTheme(f, themesRoot)));
}

export function manifestEntry(theme: ScannedTheme): ThemeManifestEntry {
  return {
    id: theme.id,
    name: theme.frontmatter.name,
    description: theme.frontmatter.description,
    md: `${theme.id}.md`,
    demo: theme.demoAbs ? path.basename(theme.demoAbs) : null,
  };
}

export async function buildThemeManifest(
  themesRoot: string,
): Promise<{ themes: ThemeManifestEntry[] }> {
  const themes = await scanThemes(themesRoot);
  return { themes: themes.map(manifestEntry) };
}
