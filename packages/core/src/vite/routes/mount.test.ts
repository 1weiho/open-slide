import type { Connect, ViteDevServer } from 'vite';
import { describe, expect, it, vi } from 'vitest';
import { devRoutePaths, mountDevRoute, withBase } from './mount.ts';

function fakeServer(base: string): { server: ViteDevServer; use: ReturnType<typeof vi.fn> } {
  const use = vi.fn();
  const server = { config: { base }, middlewares: { use } } as unknown as ViteDevServer;
  return { server, use };
}

describe('devRoutePaths', () => {
  it('mounts only at root for the root base', () => {
    expect(devRoutePaths('/', '/__folders')).toEqual(['/__folders']);
  });

  it('mounts beneath the base and at root for a nested base', () => {
    expect(devRoutePaths('/my-slides/', '/__folders')).toEqual([
      '/my-slides/__folders',
      '/__folders',
    ]);
  });

  it('handles a nested base without a trailing slash', () => {
    expect(devRoutePaths('/my-slides', '/__edit')).toEqual(['/my-slides/__edit', '/__edit']);
  });

  it('handles a deeply nested base', () => {
    expect(devRoutePaths('/team/decks/', '/__notes')).toEqual(['/team/decks/__notes', '/__notes']);
  });

  it('falls back to root for undefined, empty, or relative bases', () => {
    expect(devRoutePaths(undefined, '/__folders')).toEqual(['/__folders']);
    expect(devRoutePaths('', '/__folders')).toEqual(['/__folders']);
    expect(devRoutePaths('./', '/__folders')).toEqual(['/__folders']);
  });
});

describe('withBase', () => {
  it('returns the path unchanged for the root base', () => {
    expect(withBase('/', '/__assets/intro/a.png')).toBe('/__assets/intro/a.png');
  });

  it('prefixes the path for a nested base', () => {
    expect(withBase('/my-slides/', '/__assets/intro/a.png')).toBe(
      '/my-slides/__assets/intro/a.png',
    );
  });
});

describe('mountDevRoute', () => {
  const handler: Connect.NextHandleFunction = (_req, _res, next) => next();

  it('registers a single mount for the root base', () => {
    const { server, use } = fakeServer('/');
    mountDevRoute(server, '/__folders', handler);
    expect(use.mock.calls.map((c) => c[0])).toEqual(['/__folders']);
    expect(use.mock.calls.every((c) => c[1] === handler)).toBe(true);
  });

  it('registers base-prefixed and root mounts for a nested base', () => {
    const { server, use } = fakeServer('/my-slides/');
    mountDevRoute(server, '/__folders', handler);
    expect(use.mock.calls.map((c) => c[0])).toEqual(['/my-slides/__folders', '/__folders']);
    expect(use.mock.calls.every((c) => c[1] === handler)).toBe(true);
  });
});
