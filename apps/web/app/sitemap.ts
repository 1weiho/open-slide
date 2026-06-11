import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

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

function gitMtime(file: string): Date {
  try {
    const stdout = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!stdout) return buildDate;
    const d = new Date(stdout);
    return Number.isNaN(d.getTime()) ? buildDate : d;
  } catch {
    return buildDate;
  }
}

const homeLastModified = existsSync(homePath) ? gitMtime(homePath) : buildDate;

export default function sitemap(): MetadataRoute.Sitemap {
  const docs: MetadataRoute.Sitemap = source.getPages().map((page) => {
    const filePath = resolvePagePath(page.slugs);
    return {
      url: `${siteUrl}${page.url}`,
      lastModified: filePath ? gitMtime(filePath) : buildDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

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
