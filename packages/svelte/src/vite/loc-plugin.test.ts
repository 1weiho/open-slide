import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { svelteLocPlugin } from './loc-plugin.ts';

describe('svelteLocPlugin', () => {
  it('instruments slide elements loaded through Vite fs URLs', async () => {
    const slidesRoot = path.resolve('/workspace/slides');
    const plugin = svelteLocPlugin({ slidesRoot });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('Expected a transform hook');

    const result = await transform.call(
      {} as never,
      '<div><h1>Title</h1></div>',
      '/@fs/workspace/slides/example/01-title.svelte',
      {} as never,
    );

    expect(result).toMatchObject({
      code: '<div data-osd-loc="1:1" data-osd-file="example/01-title.svelte"><h1 data-osd-loc="1:6" data-osd-file="example/01-title.svelte">Title</h1></div>',
    });
  });

  it('does not instrument Svelte components outside the slides root', async () => {
    const plugin = svelteLocPlugin({ slidesRoot: '/workspace/slides' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('Expected a transform hook');

    const result = await transform.call(
      {} as never,
      '<div>App</div>',
      '/workspace/src/App.svelte',
      {} as never,
    );

    expect(result).toBeNull();
  });

  it('ignores Svelte virtual style modules', async () => {
    const plugin = svelteLocPlugin({ slidesRoot: '/workspace/slides' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('Expected a transform hook');

    const result = await transform.call(
      {} as never,
      '.page.s-hash { color: red; }',
      '/workspace/slides/example/01-title.svelte?svelte&type=style&lang.css',
      {} as never,
    );

    expect(result).toBeNull();
  });
});
