import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

const execFileAsync = promisify(execFile);

const buildDate = new Date();
const cwd = process.cwd();
const docsRoot = path.resolve(cwd, 'content/docs');
const homePath = path.resolve(cwd, 'app/(home)/page.tsx');

function resolvePagePath(slugs: readonly string[]): string | null {
  const candidates =
    slugs.length === 0
      ? [path.join(docsRoot, 'index.mdx')]
      : [`${path.join(docsRoot, ...slugs)}.mdx`, path.join(docsRoot, ...slugs, 'index.mdx')];
  return candidates.find((c) => existsSync(c)) ?? null;
}

async function gitMtime(file: string): Promise<Date> {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
    });
    const trimmed = stdout.trim();
    if (!trimmed) return buildDate;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? buildDate : d;
  } catch {
    return buildDate;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeLastModified = existsSync(homePath) ? await gitMtime(homePath) : buildDate;

  const docsPromises = source.getPages().map(async (page) => {
    const filePath = resolvePagePath(page.slugs);
    return {
      url: `${siteUrl}${page.url}`,
      lastModified: filePath ? await gitMtime(filePath) : buildDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  const docs = await Promise.all(docsPromises);

  return [
    {
      url: siteUrl,
      lastModified: homeLastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...docs,
  ];
}
