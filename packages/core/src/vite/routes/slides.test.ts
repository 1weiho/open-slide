import type { ServerResponse } from 'node:http';
import type { Connect, ViteDevServer } from 'vite';
import { describe, expect, it, vi } from 'vitest';
import { makeContext } from './context.ts';
import { registerSlideRoutes } from './slides.ts';

type Middleware = (
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void | Promise<void>;

function createResponse() {
  const res = {
    statusCode: 200,
    headers: new Map<string, unknown>(),
    body: '',
    setHeader(name: string, value: unknown) {
      this.headers.set(name, value);
    },
    end(chunk: unknown) {
      this.body = String(chunk);
    },
  };
  return res as unknown as ServerResponse & typeof res;
}

function createStandaloneSlidesHandler(): Middleware {
  let handler: Middleware | null = null;
  const server = {
    middlewares: {
      use(prefix: string, fn: Middleware) {
        expect(prefix).toBe('/__slides');
        handler = fn;
      },
    },
    ws: { send: vi.fn() },
  } as unknown as ViteDevServer;

  registerSlideRoutes(
    server,
    makeContext({ userCwd: '/repo', coreVersion: '0.0.0', mode: 'standalone' }),
  );

  if (handler === null) throw new Error('expected slide route middleware');
  return handler;
}

function createRequest(method: string, url: string): Connect.IncomingMessage {
  return { method, url, headers: {}, socket: {} } as Connect.IncomingMessage;
}

describe('registerSlideRoutes in standalone mode', () => {
  it.each([
    ['POST', '/index/duplicate'],
    ['DELETE', '/index'],
  ])('returns 400 for unsupported %s %s deck-level mutation', async (method, url) => {
    const handler = createStandaloneSlidesHandler();
    const req = createRequest(method, url);
    const res = createResponse();
    const next = vi.fn();

    await handler(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      error: 'operation not supported in standalone mode',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
