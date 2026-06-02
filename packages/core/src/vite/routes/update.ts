import type { ViteDevServer } from 'vite';
import { json } from './context.ts';

// GET /__update-check  → { current, latest, outdated }
//   Compares the running @open-slide/core version against the npm `latest`
//   dist-tag. Network/parse failures degrade to { latest: null, outdated: false }.

const PKG = '@open-slide/core';
const CACHE_TTL_MS = 10 * 60 * 1000;

type CheckResult = { current: string; latest: string | null; outdated: boolean };

let cache: { at: number; latest: string | null } | null = null;

function parseSemver(v: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isOutdated(current: string, latest: string): boolean {
  const a = parseSemver(current);
  const b = parseSemver(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (b[i] > a[i]) return true;
    if (b[i] < a[i]) return false;
  }
  return false;
}

async function fetchLatest(now: number): Promise<string | null> {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.latest;
  try {
    const res = await fetch(`https://registry.npmjs.org/${PKG}/latest`, {
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`registry ${res.status}`);
    const body = (await res.json()) as { version?: unknown };
    const latest = typeof body.version === 'string' ? body.version : null;
    cache = { at: now, latest };
    return latest;
  } catch {
    return cache?.latest ?? null;
  }
}

export function registerUpdateRoutes(server: ViteDevServer, current: string): void {
  server.middlewares.use('/__update-check', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const latest = await fetchLatest(Date.now());
    const result: CheckResult = {
      current,
      latest,
      outdated: latest ? isOutdated(current, latest) : false,
    };
    res.setHeader('cache-control', 'no-store');
    json(res, 200, result);
  });
}
