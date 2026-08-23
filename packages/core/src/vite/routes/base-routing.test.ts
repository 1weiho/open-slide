import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type { Connect, ViteDevServer } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { designPlugin } from '../design-plugin.ts';
import { notesPlugin } from '../notes-plugin.ts';
import { registerAssetRoutes } from './assets.ts';
import { registerCommentRoutes } from './comments.ts';
import { type ApiContext, makeContext } from './context.ts';
import { registerEditRoutes } from './edit.ts';
import { registerFolderRoutes } from './folders.ts';
import { registerRestartRoutes } from './restart.ts';
import { registerSlideRoutes } from './slides.ts';
import { registerSvglRoutes } from './svgl.ts';
import { registerUpdateRoutes } from './update.ts';

type Mount = { route: string; handler: Connect.NextHandleFunction };

// Minimal stand-in for Vite's connect stack: prefix-matches mounted routes
// (stripping the matched prefix like connect does) and falls through to an
// SPA-style HTML response — the behavior the issue's repro observes when a
// request beneath the base misses every dev API route.
function serveMounts(mounts: Mount[]): http.Server {
  return http.createServer((req, res) => {
    const url = req.url ?? '/';
    const queue = [...mounts];
    const next = (): void => {
      const mount = queue.shift();
      if (!mount) {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/html');
        res.end('<!doctype html>');
        return;
      }
      const { route, handler } = mount;
      const boundary = url.length > route.length ? url[route.length] : '';
      if (!url.startsWith(route) || (boundary !== '' && boundary !== '/' && boundary !== '?')) {
        next();
        return;
      }
      req.url = url.slice(route.length);
      if (req.url[0] !== '/') req.url = `/${req.url}`;
      handler(req, res, next);
    };
    next();
  });
}

function fakeServer(base: string): { server: ViteDevServer; mounts: Mount[] } {
  const mounts: Mount[] = [];
  const server = {
    config: { base },
    middlewares: {
      use: (route: string, handler: Connect.NextHandleFunction) => {
        mounts.push({ route, handler });
      },
    },
  } as unknown as ViteDevServer;
  return { server, mounts };
}

function testContext(): ApiContext {
  const ctx = makeContext({ userCwd: os.tmpdir(), coreVersion: '0.0.0' });
  ctx.manifestPath = path.join(os.tmpdir(), 'open-slide-missing', '.folders.json');
  return ctx;
}

function registerWithBase(base: string): Mount[] {
  const { server, mounts } = fakeServer(base);
  registerFolderRoutes(server, testContext());
  return mounts;
}

async function listen(server: http.Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

describe('dev API routing under a configured base', () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map((s) => new Promise<void>((resolve) => s.close(() => resolve()))),
    );
  });

  async function start(base: string): Promise<string> {
    const server = serveMounts(registerWithBase(base));
    servers.push(server);
    return await listen(server);
  }

  it('serves /__folders at root when base is /', async () => {
    const origin = await start('/');
    const res = await fetch(`${origin}/__folders`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ folders: [], assignments: {} });
  });

  it('serves /__folders beneath a nested base instead of falling through to HTML', async () => {
    const origin = await start('/my-slides/');
    const res = await fetch(`${origin}/my-slides/__folders`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ folders: [], assignments: {} });
  });

  it('keeps serving root-mounted /__folders with a nested base for direct probes', async () => {
    const origin = await start('/my-slides/');
    const res = await fetch(`${origin}/__folders`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('still falls through to HTML for non-API paths beneath the base', async () => {
    const origin = await start('/my-slides/');
    const res = await fetch(`${origin}/my-slides/s/intro`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});

describe('dev API route inventory', () => {
  const ROUTES = [
    '/__edit',
    '/__comments',
    '/__slides',
    '/__assets',
    '/__svgl',
    '/__folders',
    '/__update-check',
    '/__update-package',
    '/__server-status',
    '/__restart-server',
    '/__design',
    '/__notes',
  ];

  function registerAll(base: string): string[] {
    const { server, mounts } = fakeServer(base);
    const ctx = testContext();
    registerEditRoutes(server, ctx);
    registerCommentRoutes(server, ctx);
    registerSlideRoutes(server, ctx);
    registerAssetRoutes(server, ctx);
    registerSvglRoutes(server);
    registerFolderRoutes(server, ctx);
    registerUpdateRoutes(server, ctx);
    registerRestartRoutes(server);
    for (const plugin of [
      designPlugin({ userCwd: os.tmpdir() }),
      notesPlugin({ userCwd: os.tmpdir() }),
    ]) {
      const hook = plugin.configureServer;
      const fn = typeof hook === 'function' ? hook : hook?.handler;
      fn?.(server);
    }
    return mounts.map((m) => m.route);
  }

  it('mounts every dev API route beneath a nested base', () => {
    const routes = registerAll('/my-slides/');
    for (const route of ROUTES) {
      expect(routes, `expected ${route} beneath the base`).toContain(`/my-slides${route}`);
      expect(routes, `expected ${route} at root`).toContain(route);
    }
  });

  it('mounts every dev API route once at root for the root base', () => {
    const routes = registerAll('/');
    for (const route of ROUTES) {
      expect(routes).toContain(route);
    }
    expect(new Set(routes).size).toBe(routes.length);
  });
});
