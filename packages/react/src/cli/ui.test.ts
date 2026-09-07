import { describe, expect, it } from 'vitest';
import { rewriteViteMessage } from './ui.ts';

describe('rewriteViteMessage', () => {
  it('translates hmr vocabulary', () => {
    expect(rewriteViteMessage('hmr update /slides/a/index.tsx')).toBe(
      'updated /slides/a/index.tsx',
    );
    expect(rewriteViteMessage('hmr invalidate /slides/a/index.tsx')).toBe(
      'invalidated /slides/a/index.tsx',
    );
    expect(rewriteViteMessage('page reload slides/a/index.tsx')).toBe(
      'full reload slides/a/index.tsx',
    );
    expect(rewriteViteMessage('page reload')).toBe('full reload');
    expect(rewriteViteMessage('trigger page reload slides/a/index.tsx')).toBe(
      'full reload slides/a/index.tsx',
    );
  });

  it('keeps ANSI styling around the rewritten phrase', () => {
    expect(rewriteViteMessage('[32mhmr update [39m[2m/a.tsx[22m')).toBe(
      '[32mupdated [39m[2m/a.tsx[22m',
    );
  });

  it('rephrases dependency re-bundling notices', () => {
    expect(rewriteViteMessage('optimized dependencies changed. reloading')).toBe(
      'dependencies changed, reloading',
    );
    expect(rewriteViteMessage('Re-optimizing dependencies because vite config has changed')).toBe(
      'config changed, re-bundling',
    );
    expect(rewriteViteMessage('Re-optimizing dependencies because lockfile has changed')).toBe(
      'lockfile changed, re-bundling',
    );
    expect(rewriteViteMessage('Forced re-optimization of dependencies')).toBe(
      're-bundling dependencies',
    );
    expect(rewriteViteMessage('server restarted.')).toBe('server restarted');
  });

  it('strips the [vite] tag wherever it appears', () => {
    expect(rewriteViteMessage('[vite] warning: something')).toBe('warning: something');
    expect(rewriteViteMessage('a [vite] b [vite]')).toBe('a b ');
  });

  it('strips the builtin reporter plugin tag from build warnings', () => {
    expect(
      rewriteViteMessage('[plugin builtin:vite-reporter] \n(!) Some chunks are larger than 500 kB'),
    ).toBe('(!) Some chunks are larger than 500 kB');
  });

  it('drops the build banner', () => {
    expect(
      rewriteViteMessage('[36mvite v8.2.2 building client environment for production...'),
    ).toBeNull();
    expect(
      rewriteViteMessage('vite v8.2.2 building client environment for production...'),
    ).toBeNull();
  });

  it('passes ordinary messages through untouched', () => {
    expect(rewriteViteMessage('Port 5173 is in use, trying another one...')).toBe(
      'Port 5173 is in use, trying another one...',
    );
    expect(rewriteViteMessage('✓ built in 1.20s')).toBe('✓ built in 1.20s');
  });
});
