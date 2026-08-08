import type { ViteDevServer } from 'vite';
import { json } from './context.ts';

// GET /__svgl/search?q=&limit=  proxy https://api.svgl.app/?search=…
// GET /__svgl/svg?u=…           proxy raw svg from svgl.app (https only)

export function registerSvglRoutes(server: ViteDevServer): void {
  server.middlewares.use('/__svgl', async (req, res, next) => {
    const reqUrl = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    if (method !== 'GET') return next();

    try {
      let target: string | null = null;
      if (reqUrl.pathname === '/search') {
        const params = new URLSearchParams();
        const q = reqUrl.searchParams.get('q');
        const limit = reqUrl.searchParams.get('limit');
        if (q) params.set('search', q);
        if (limit) params.set('limit', limit);
        const qs = params.toString();
        target = `https://api.svgl.app/${qs ? `?${qs}` : ''}`;
      } else if (reqUrl.pathname === '/svg') {
        const u = reqUrl.searchParams.get('u');
        if (!u) return json(res, 400, { error: 'missing u' });
        let parsed: URL;
        try {
          parsed = new URL(u);
        } catch {
          return json(res, 400, { error: 'invalid u' });
        }
        if (parsed.protocol !== 'https:') return json(res, 400, { error: 'https only' });
        const host = parsed.hostname.toLowerCase();
        if (host !== 'svgl.app' && !host.endsWith('.svgl.app')) {
          return json(res, 400, { error: 'host not allowed' });
        }
        target = parsed.toString();
      } else {
        return next();
      }

      const upstream = await fetch(target);
      const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';
      res.statusCode = upstream.status;
      res.setHeader('content-type', ct);
      res.setHeader('cache-control', 'no-store');
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch (err) {
      json(res, 502, { error: String((err as Error).message ?? err) });
    }
  });
}
