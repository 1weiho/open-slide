import { gitConfig } from './shared';

export async function fetchGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${gitConfig.owner}/${gitConfig.repo}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export function formatStarCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}
