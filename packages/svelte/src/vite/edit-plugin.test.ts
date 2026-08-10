import { describe, expect, it } from 'vitest';
import { applySvelteElementEdit } from './edit-plugin.ts';

describe('applySvelteElementEdit', () => {
  it('updates direct text and adds source-backed styles', () => {
    const result = applySvelteElementEdit('<div><h1>Title</h1></div>', {
      line: 1,
      column: 6,
      text: 'New title',
      styles: { 'font-size': '72px', color: '#123456' },
    });

    expect(result).toEqual({
      ok: true,
      source: '<div><h1 style="font-size: 72px; color: #123456">New title</h1></div>',
    });
  });

  it('updates text separated by line breaks', () => {
    const result = applySvelteElementEdit('<h1>One deck index.<br />Any number of pages.</h1>', {
      line: 1,
      column: 1,
      text: 'Quarterly Results. Built with Svelte.',
    });

    expect(result).toEqual({
      ok: true,
      source: '<h1>Quarterly Results. Built with Svelte.</h1>',
    });
  });

  it('updates and removes properties while preserving unrelated styles', () => {
    const result = applySvelteElementEdit(
      '<h1 style="font-size: 48px; margin: 0; color: red">Title</h1>',
      {
        line: 1,
        column: 1,
        styles: { 'font-size': '64px', color: null },
      },
    );

    expect(result).toEqual({
      ok: true,
      source: '<h1 style="font-size: 64px; margin: 0">Title</h1>',
    });
  });

  it('removes an empty style attribute', () => {
    const result = applySvelteElementEdit('<h1 style="color: red">Title</h1>', {
      line: 1,
      column: 1,
      styles: { color: null },
    });

    expect(result).toEqual({ ok: true, source: '<h1>Title</h1>' });
  });

  it('rejects dynamic style attributes without rewriting source', () => {
    const result = applySvelteElementEdit('<h1 style={headingStyle}>Title</h1>', {
      line: 1,
      column: 1,
      styles: { color: 'red' },
    });

    expect(result).toEqual({
      ok: false,
      error: 'dynamic style attributes are not directly editable',
    });
  });

  it('replaces an ImagePlaceholder with an imported image', () => {
    const source = `<script lang="ts">\nimport ImagePlaceholder from '@open-slide/svelte/ImagePlaceholder.svelte';\n</script>\n\n<ImagePlaceholder hint="Revenue chart" width={640} height={360} />`;
    const result = applySvelteElementEdit(source, {
      line: 5,
      column: 1,
      assetPath: './assets/revenue-chart.png',
    });

    expect(result).toEqual({
      ok: true,
      source: `<script lang="ts">\nimport revenueChart from './assets/revenue-chart.png';\nimport ImagePlaceholder from '@open-slide/svelte/ImagePlaceholder.svelte';\n</script>\n\n<img src={revenueChart} alt="Revenue chart" style="width: 640px; height: 360px; object-fit: contain" />`,
    });
  });
});
