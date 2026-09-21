import { describe, expect, it } from 'vitest';
import { applyEditBatch, type BatchEdit } from './batch-edit.ts';
import type { EditOp } from './edit-ops.ts';

function edit(source: string, marker: string, ops: EditOp[]): BatchEdit {
  const offset = source.indexOf(marker);
  if (offset < 0) throw new Error(`Missing target: ${marker}`);
  const before = source.slice(0, offset);
  return {
    line: before.split('\n').length,
    column: offset - before.lastIndexOf('\n') - 1,
    ops,
  };
}

const style = (key: string, value: string): EditOp => ({ kind: 'set-style', key, value });

describe('applyEditBatch', () => {
  it('preserves sibling targets when earlier multiline styles collapse', () => {
    const source = `export default () => (
  <section>
    <h1 style={{
      color: 'red',
      fontSize: 40,
    }}>Title</h1>
    <h2 style={{
      color: 'blue',
      fontSize: 20,
    }}>Subtitle</h2>
  </section>
);`;
    const result = applyEditBatch(source, [
      edit(source, '<h1', [style('translate', '20px 10px')]),
      edit(source, '<h2', [style('translate', '40px 30px')]),
    ]);
    expect(result.results).toEqual([{ ok: true }, { ok: true }]);
    expect(result.source).toContain(
      "<h1 style={{ color: 'red', fontSize: 40, translate: '20px 10px' }}>",
    );
    expect(result.source).toContain(
      "<h2 style={{ color: 'blue', fontSize: 20, translate: '40px 30px' }}>",
    );
  });

  it('rebases same-line columns and preserves the request order at the same target', () => {
    const source = '<section><h1>Before</h1><h2>After</h2></section>';
    const result = applyEditBatch(source, [
      edit(source, '<h1', [{ kind: 'set-text', value: 'After' }]),
      edit(source, '<h2', [style('translate', '80px 0px')]),
      edit(source, '<h1', [{ ...style('color', 'red'), prevText: 'Before' } as EditOp]),
      edit(source, '<h1', [style('color', 'green'), style('width', '200px')]),
    ]);
    expect(result.results).toEqual(Array.from({ length: 4 }, () => ({ ok: true })));
    expect(result.source).toContain("<h1 style={{ color: 'green', width: '200px' }}>After</h1>");
    expect(result.source).toContain("<h2 style={{ translate: '80px 0px' }}>After</h2>");
  });

  it('tracks nested elements through both ancestor and descendant edits', () => {
    const source = `export default () => (
  <section style={{
    padding: 20,
    background: 'white',
  }}>
    <h1>Title <em>before</em></h1>
    <p>Body</p>
  </section>
);`;
    const result = applyEditBatch(source, [
      edit(source, '<section', [style('translate', '20px 30px')]),
      edit(source, '<em', [{ kind: 'set-text', value: 'a much longer title' }]),
      edit(source, '<h1', [style('fontSize', '48px')]),
      edit(source, '<p', [style('color', 'blue')]),
      edit(source, '<section', [style('background', 'black')]),
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
    expect(result.source).toContain(
      "<section style={{ padding: 20, background: 'black', translate: '20px 30px' }}>",
    );
    expect(result.source).toContain(
      "<h1 style={{ fontSize: '48px' }}>Title <em>a much longer title</em></h1>",
    );
    expect(result.source).toContain("<p style={{ color: 'blue' }}>Body</p>");
  });

  it('rebases preceding and following targets across asset imports and combined operations', () => {
    const source = `import React from 'react';
export default () => (
  <section>
    <h1 style={{
      color: 'red',
    }}>Title</h1>
    <img alt="first" />
    <img alt="second" />
    <p>Body</p>
  </section>
);`;
    const result = applyEditBatch(source, [
      edit(source, '<img alt="first"', [
        { kind: 'set-attr-asset', attr: 'src', assetPath: './assets/photo.png' },
        style('width', '180px'),
      ]),
      edit(source, '<h1', [style('translate', '30px 40px')]),
      edit(source, '<img alt="second"', [
        { kind: 'set-attr-asset', attr: 'src', assetPath: '@assets/photo.png' },
      ]),
      edit(source, '<p', [{ kind: 'set-text', value: 'Updated' }]),
      edit(source, '<img alt="first"', [style('height', '120px')]),
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
    expect(result.source).toContain("import photo from './assets/photo.png';");
    expect(result.source).toContain("import photo2 from '@assets/photo.png';");
    expect(result.source).toContain(
      "<img src={photo} alt=\"first\" style={{ width: '180px', height: '120px' }} />",
    );
    expect(result.source).toContain('<img src={photo2} alt="second" />');
    expect(result.source).toContain(
      "<h1 style={{ color: 'red', translate: '30px 40px' }}>Title</h1>",
    );
    expect(result.source).toContain('<p>Updated</p>');
  });

  it('keeps a replaced target at offset zero while rejecting descendants it removed', () => {
    const source = '<ImagePlaceholder width={200}><span>Hint</span></ImagePlaceholder>';
    const result = applyEditBatch(source, [
      edit(source, '<ImagePlaceholder', [
        { kind: 'replace-placeholder-with-image', assetPath: './assets/cover.png' },
      ]),
      edit(source, '<span', [style('color', 'red')]),
      edit(source, '<ImagePlaceholder', [style('translate', '20px 30px')]),
    ]);
    expect(result.results).toEqual([
      { ok: true },
      { ok: false, error: 'target was removed by an earlier edit' },
      { ok: true },
    ]);
    expect(result.source).toContain("import cover from './assets/cover.png';");
    expect(result.source).toContain('<img src={cover}');
    expect(result.source).toContain("translate: '20px 30px'");
    expect(result.source).not.toContain('color:');
  });

  it('returns failures in input order without shifting targets or applying partial edits', () => {
    const source = '<section><h1>Title</h1><p>Body</p></section>';
    const result = applyEditBatch(source, [
      { line: 0, ops: [style('color', 'red')] },
      edit(source, '<p', [style('color', 'blue')]),
      edit(source, '<h1', [
        style('color', 'red'),
        { kind: 'set-attr-asset', attr: 'src', assetPath: '/invalid.png' },
      ]),
      { line: 99, column: 0, ops: [style('width', '10px')] },
      edit(source, '<h1', [style('height', '80px')]),
    ]);
    expect(result.results).toEqual([
      { ok: false, error: 'invalid edit' },
      { ok: true },
      { ok: false, error: 'asset path must start with ./assets/ or @assets/' },
      { ok: false, error: 'no JSX element at location' },
      { ok: true },
    ]);
    expect(result.source).toContain("<h1 style={{ height: '80px' }}>Title</h1>");
    expect(result.source).toContain("<p style={{ color: 'blue' }}>Body</p>");
    expect(result.source).not.toContain("color: 'red'");
  });
});
