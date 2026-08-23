import type { Connect, ViteDevServer } from 'vite';

export function withBase(base: string | undefined, path: string): string {
  const b = base ?? '/';
  if (!b.startsWith('/')) return path;
  return b.replace(/\/+$/, '') + path;
}

// With a nested `base` the client requests dev API routes beneath it, so
// mount there first; keep the root mount so direct probes and pre-base
// clients keep working.
export function devRoutePaths(base: string | undefined, route: string): string[] {
  const prefixed = withBase(base, route);
  return prefixed === route ? [route] : [prefixed, route];
}

export function mountDevRoute(
  server: ViteDevServer,
  route: string,
  handler: Connect.NextHandleFunction,
): void {
  for (const path of devRoutePaths(server.config.base, route)) {
    server.middlewares.use(path, handler);
  }
}
